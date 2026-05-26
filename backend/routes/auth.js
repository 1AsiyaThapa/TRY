import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import passport from '../config/passport.js'
import User from '../models/User.js'
import { sendVerificationEmail } from '../utils/sendEmail.js'

const router = express.Router()

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' })

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  if (!passwordRegex.test(password))
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
    })

  try {
    const existing = await User.findOne({ email })

    // If user exists and already verified
    if (existing && existing.isVerified)
      return res.status(409).json({ message: 'Email already registered. Please log in.' })

    const hashed = await bcrypt.hash(password, 12)
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    if (existing) {
      // Resend OTP to unverified user
      existing.name = name
      existing.password = hashed
      existing.otp = otp
      existing.otpExpiry = otpExpiry
      await existing.save()
    } else {
      await User.create({ name, email, password: hashed, otp, otpExpiry })
    }

    await sendVerificationEmail(email, otp)
    res.status(200).json({ message: 'Verification code sent to your email' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp)
    return res.status(400).json({ message: 'Email and code are required' })

  try {
    const user = await User.findOne({ email })

    if (!user)
      return res.status(404).json({ message: 'User not found' })

    if (user.isVerified)
      return res.status(400).json({ message: 'Email already verified' })

    if (user.otp !== otp)
      return res.status(400).json({ message: 'Invalid verification code' })

    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' })

    user.isVerified = true
    user.otp = undefined
    user.otpExpiry = undefined
    await user.save()

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(200).json({ message: 'Email verified successfully', token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' })

  try {
    const user = await User.findOne({ email })

    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.isVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in' })

    if (user.password === 'GOOGLE_AUTH')
      return res.status(401).json({ message: 'This account uses Google sign-in. Please continue with Google.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/signup?error=google_failed` }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, name: req.user.name, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`)
  }
)

export default router
