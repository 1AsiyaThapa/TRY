import express from 'express'
import Transaction from '../models/Transaction.js'
import Budget from '../models/Budget.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import { sendBudgetAlertEmail } from '../utils/sendBudgetAlert.js'

const router = express.Router()

// GET /api/transactions?type=income|expense
router.get('/', protect, async (req, res) => {
  try {
    const filter = { user: req.user.id }
    if (req.query.type) filter.type = req.query.type
    const transactions = await Transaction.find(filter).sort({ date: -1 })
    res.json(transactions)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  const { type, title, amount, category, date, note } = req.body
  if (!type || !title || !amount || !category || !date)
    return res.status(400).json({ message: 'All fields are required' })

  try {
    const transaction = await Transaction.create({
      user: req.user.id, type, title, amount, category, date, note,
    })

    // Check budget alert only for expenses
    if (type === 'expense') {
      const month = new Date(date).toISOString().slice(0, 7)
      const budget = await Budget.findOne({ user: req.user.id, month })

      if (budget) {
        const start = new Date(`${month}-01`)
        const end = new Date(start)
        end.setMonth(end.getMonth() + 1)

        const expenses = await Transaction.find({
          user: req.user.id, type: 'expense',
          date: { $gte: start, $lt: end },
        })
        const spent = expenses.reduce((s, t) => s + t.amount, 0)
        const pct = (spent / budget.amount) * 100

        // Only send email if crossing 80% or 100% threshold
        // Use a flag on budget to avoid spamming
        const prevPct = budget.lastAlertPct || 0

        if ((pct >= 100 && prevPct < 100) || (pct >= 80 && prevPct < 80)) {
          const user = await User.findById(req.user.id)
          const over = pct >= 100
          try {
            await sendBudgetAlertEmail(user.email, user.name, {
              pct, spent, budget: budget.amount,
              remaining: Math.max(budget.amount - spent, 0),
              over,
            })
            budget.lastAlertPct = over ? 100 : 80
            await budget.save()
          } catch (emailErr) {
            console.error('Budget alert email failed:', emailErr.message)
          }
        }

        // Return threshold info so frontend can show push notification
        res.status(201).json({
          ...transaction.toObject(),
          budgetAlert: pct >= 80 ? { pct, spent, budgetAmount: budget.amount, over: pct >= 100 } : null,
        })
        return
      }
    }

    res.status(201).json(transaction)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!transaction) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
