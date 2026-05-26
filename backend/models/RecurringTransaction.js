import mongoose from 'mongoose'

const recurringSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  nextDue: { type: Date, required: true },
  note: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('RecurringTransaction', recurringSchema)
