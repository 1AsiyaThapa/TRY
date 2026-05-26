import express from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/profile — update name
router.patch('/', protect, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, { name: name.trim() }, { new: true }
    ).select('-password -otp -otpExpiry')
    res.json(user)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/profile/password — change password
router.patch('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Both fields are required' })

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  if (!passwordRegex.test(newPassword))
    return res.status(400).json({ message: 'Password must be 8+ chars with uppercase, lowercase, number and special character.' })

  try {
    const user = await User.findById(req.user.id)
    if (user.password === 'GOOGLE_AUTH')
      return res.status(400).json({ message: 'Google accounts cannot change password here.' })

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' })

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ message: 'Password updated successfully.' })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/profile/avatar — upload profile picture
router.patch('/avatar', protect, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' })
  try {
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    const user = await User.findByIdAndUpdate(
      req.user.id, { avatar: base64 }, { new: true }
    ).select('-password -otp -otpExpiry')
    res.json(user)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/profile/avatar — remove profile picture
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, { avatar: null }, { new: true }
    ).select('-password -otp -otpExpiry')
    res.json(user)
  } catch { res.status(500).json({ message: 'Server error' }) }
})

export default router
