import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    trim: true,
    lowercase: true,
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please enter your message'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'resolved'],
    default: 'unread',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Contact', contactSchema)
