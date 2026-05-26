import express from 'express'
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Store file in memory (no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

// POST /api/receipt/scan
router.post('/scan', protect, upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' })

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    }

    const prompt = `Analyze this receipt image and extract the following information in JSON format only, no extra text:
{
  "amount": <total amount as a number, no currency symbol>,
  "category": <best matching category from: Food, Transport, Shopping, Entertainment, Utilities, Health, Education, Other>,
  "date": <date in YYYY-MM-DD format, or today's date if not found>,
  "note": <merchant name or brief description, max 50 chars>
}
If you cannot read the receipt clearly, return your best estimate. Always return valid JSON.`

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse receipt data')

    const data = JSON.parse(jsonMatch[0])

    // Validate and sanitize
    res.json({
      amount: parseFloat(data.amount) || 0,
      category: data.category || 'Other',
      date: data.date || new Date().toISOString().split('T')[0],
      note: data.note || '',
    })
  } catch (err) {
    console.error('Receipt scan error:', err)
    res.status(500).json({ message: 'Could not read receipt. Please fill in manually.' })
  }
})

export default router
