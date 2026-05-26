import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import session from 'express-session'
import passport, { initPassport } from './config/passport.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import categoryRoutes from './routes/categories.js'
import receiptRoutes from './routes/receipt.js'
import chatRoutes from './routes/chat.js'
import recurringRoutes from './routes/recurring.js'
import predictionRoutes from './routes/prediction.js'
import budgetRoutes from './routes/budgets.js'
import profileRoutes from './routes/profile.js'

// Log env vars presence (not values) to help debug
console.log('ENV CHECK:', {
  MONGO_URI: !!process.env.MONGO_URI,
  JWT_SECRET: !!process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  PORT: process.env.PORT,
})

// Init passport AFTER dotenv has loaded
try {
  initPassport()
} catch (err) {
  console.error('Passport init error:', err.message)
}

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/receipt', receiptRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/recurring', recurringRoutes)
app.use('/api/prediction', predictionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/profile', profileRoutes)

const PORT = process.env.PORT || 5000

// Start server immediately so Render detects the open port
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running on port ${PORT}`)
)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('DB connection error:', err))
