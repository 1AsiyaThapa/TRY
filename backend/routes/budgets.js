import express from 'express'
import Budget from '../models/Budget.js'
import Transaction from '../models/Transaction.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/budgets?month=YYYY-MM
router.get('/', protect, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7)
    const budget = await Budget.findOne({ user: req.user.id, month })

    const start = new Date(`${month}-01`)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)

    const expenses = await Transaction.find({
      user: req.user.id, type: 'expense',
      date: { $gte: start, $lt: end },
    })

    const spent = expenses.reduce((s, t) => s + t.amount, 0)

    res.json({ budget: budget || null, spent })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/budgets — set or update budget for a month
router.post('/', protect, async (req, res) => {
  const { amount, month } = req.body
  if (!amount || !month) return res.status(400).json({ message: 'Amount and month required' })

  try {
    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, month },
      { amount },
      { upsert: true, new: true }
    )
    res.status(201).json(budget)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/budgets/:month
router.delete('/:month', protect, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ user: req.user.id, month: req.params.month })
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

export default router
