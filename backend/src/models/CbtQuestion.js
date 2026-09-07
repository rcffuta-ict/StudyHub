import mongoose from 'mongoose'

const cbtQuestionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    },
    subsection_id: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    subsection_name: {
      type: String,
      required: true,
    },
    question_set: {
      type: String,
      required: true,
      enum: ['Set A', 'Set B'],
      default: 'Set A',
    },
    question_text: {
      type: String,
      required: true,
    },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correct_option: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

cbtQuestionSchema.index({ subject: 1, question_set: 1, subsection_id: 1 })

const CbtQuestion = mongoose.model('CbtQuestion', cbtQuestionSchema)

export default CbtQuestion
