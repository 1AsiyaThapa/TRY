import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  googleId: { type: String },
  avatar: { type: String }, // base64 data URL
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
