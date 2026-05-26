import express from 'express'
import Category from '../models/Category.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/categories?type=income|expense
router.get('/', protect, async (req, res) => {
  try {
    const filter = { user: req.user.id }
    if (req.query.type) filter.type = req.query.type
    const categories = await Category.find(filter).sort({ name: 1 })
    res.json(categories)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/categories
router.post('/', protect, async (req, res) => {
  const { name, type } = req.body
  if (!name || !type) return res.status(400).json({ message: 'Name and type are required' })

  try {
    const category = await Category.create({ user: req.user.id, name, type })
    res.status(201).json(category)
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Category already exists' })
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/categories/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Category.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
