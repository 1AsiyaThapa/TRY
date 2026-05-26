import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  note: { type: String, trim: true },
}, { timestamps: true })

export default mongoose.model('Transaction', transactionSchema)
