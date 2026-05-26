import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  lastAlertPct: { type: Number, default: 0 },
}, { timestamps: true })

budgetSchema.index({ user: 1, month: 1 }, { unique: true })

export default mongoose.model('Budget', budgetSchema)
