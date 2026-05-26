import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Transaction from '../models/Transaction.js'

const router = express.Router()

// POST /api/chat
router.post('/', protect, async (req, res) => {
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ message: 'Message is required' })

  try {
    // Fetch user's financial summary to give context to AI
    const [incomes, expenses] = await Promise.all([
      Transaction.find({ user: req.user.id, type: 'income' }),
      Transaction.find({ user: req.user.id, type: 'expense' }),
    ])

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
    const savings = totalIncome - totalExpenses

    // Group expenses by category
    const expenseByCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

    const recentTx = [...incomes, ...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(t => `${t.type === 'income' ? '+' : '-'}Rs.${t.amount} (${t.category}) on ${new Date(t.date).toDateString()}`)
      .join('\n')

    const systemContext = `You are PaisaTrack's friendly financial assistant. You help users understand their finances, give budgeting tips, and answer money-related questions.

Here is the user's current financial data:
- Total Income: Rs.${totalIncome.toFixed(2)}
- Total Expenses: Rs.${totalExpenses.toFixed(2)}
- Net Savings: Rs.${savings.toFixed(2)}
- Expense breakdown: ${JSON.stringify(expenseByCategory)}
- Recent transactions:
${recentTx || 'No transactions yet'}

Be concise, friendly, and helpful. Use the user's actual data when relevant. If asked about topics unrelated to personal finance, politely redirect to financial topics.`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemContext,
    })

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    })

    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ message: 'AI assistant is unavailable right now.' })
  }
})

export default router
