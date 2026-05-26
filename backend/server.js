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

// Init passport AFTER dotenv has loaded
initPassport()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(session({
  secret: process.env.JWT_SECRET,
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => console.error('DB connection error:', err))
