import express from 'express'
import { protect } from '../middleware/auth.js'
import Transaction from '../models/Transaction.js'
import RecurringTransaction from '../models/RecurringTransaction.js'
import { trainAndPredict } from '../utils/predictionEngine.js'

const router = express.Router()

// GET /api/prediction
router.get('/', protect, async (req, res) => {
  try {
    const [expenses, recurring] = await Promise.all([
      Transaction.find({ user: req.user.id, type: 'expense' }).sort({ date: 1 }),
      RecurringTransaction.find({ user: req.user.id, isActive: true }),
    ])

    if (expenses.length < 3) {
      return res.json({
        prediction: null,
        message: 'Add at least 3 expense records to generate a prediction.',
      })
    }

    const recurringTotal = recurring.reduce((s, r) => s + r.amount, 0)
    const prediction = trainAndPredict(expenses, recurringTotal)

    res.json({ prediction })
  } catch (err) {
    console.error('Prediction error:', err)
    res.status(500).json({ message: 'Could not generate prediction.' })
  }
})

export default router
