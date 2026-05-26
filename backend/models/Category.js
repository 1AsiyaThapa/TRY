import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
}, { timestamps: true })

categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true })

export default mongoose.model('Category', categorySchema)
