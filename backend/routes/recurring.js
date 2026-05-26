import express from 'express'
import RecurringTransaction from '../models/RecurringTransaction.js'
import Transaction from '../models/Transaction.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const getNextDue = (date, frequency) => {
  const d = new Date(date)
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1); break
    case 'weekly':  d.setDate(d.getDate() + 7); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

// GET /api/recurring
router.get('/', protect, async (req, res) => {
  try {
    const items = await RecurringTransaction.find({ user: req.user.id }).sort({ nextDue: 1 })
    res.json(items)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/recurring/upcoming — due within 3 days
router.get('/upcoming', protect, async (req, res) => {
  try {
    const now = new Date()
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)
    in3Days.setHours(23, 59, 59, 999)

    const items = await RecurringTransaction.find({
      user: req.user.id,
      isActive: true,
      nextDue: { $lte: in3Days },
    }).sort({ nextDue: 1 })

    res.json(items)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/recurring
router.post('/', protect, async (req, res) => {
  const { category, amount, frequency, startDate, note, type } = req.body
  if (!category || !amount || !frequency || !startDate)
    return res.status(400).json({ message: 'All fields are required' })
  try {
    const item = await RecurringTransaction.create({
      user: req.user.id,
      type: type || 'expense',
      category, amount, frequency, note,
      startDate: new Date(startDate),
      nextDue: new Date(startDate),
    })
    res.status(201).json(item)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/recurring/:id/log — mark as paid (log transaction + advance nextDue)
router.post('/:id/log', protect, async (req, res) => {
  try {
    const item = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user.id })
    if (!item) return res.status(404).json({ message: 'Not found' })

    await Transaction.create({
      user: req.user.id,
      type: item.type,
      title: item.category,
      amount: item.amount,
      category: item.category,
      date: new Date(),
      note: item.note || `Recurring ${item.frequency}`,
    })

    item.nextDue = getNextDue(item.nextDue, item.frequency)
    await item.save()
    res.json(item)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/recurring/:id/skip — skip this occurrence, advance nextDue
router.post('/:id/skip', protect, async (req, res) => {
  try {
    const item = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user.id })
    if (!item) return res.status(404).json({ message: 'Not found' })
    item.nextDue = getNextDue(item.nextDue, item.frequency)
    await item.save()
    res.json(item)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/recurring/:id/toggle — enable/disable
router.patch('/:id/toggle', protect, async (req, res) => {
  try {
    const item = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user.id })
    if (!item) return res.status(404).json({ message: 'Not found' })
    item.isActive = !item.isActive
    await item.save()
    res.json(item)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/recurring/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await RecurringTransaction.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/recurring/process — auto-log overdue
router.post('/process', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const due = await RecurringTransaction.find({
      user: req.user.id, isActive: true, nextDue: { $lte: today },
    })
    const logged = []
    for (const item of due) {
      await Transaction.create({
        user: req.user.id, type: item.type, title: item.category,
        amount: item.amount, category: item.category, date: item.nextDue,
        note: item.note || `Recurring ${item.frequency}`,
      })
      item.nextDue = getNextDue(item.nextDue, item.frequency)
      await item.save()
      logged.push(item.category)
    }
    res.json({ logged, count: logged.length })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

export default router
