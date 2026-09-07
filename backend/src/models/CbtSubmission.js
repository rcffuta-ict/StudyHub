import mongoose from 'mongoose'

const cbtSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
    },
    faculty: {
      type: String,
      default: '',
    },
    matricNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    combination: {
      type: String,
      enum: ['MPC', 'PCB'],
      required: true,
    },
    questionSet: {
      type: String,
      enum: ['Set A', 'Set B'],
      default: 'Set A',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 75,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'expired'],
      default: 'in-progress',
    },
  },
  {
    timestamps: true,
  }
)

cbtSubmissionSchema.index({ userId: 1 })
cbtSubmissionSchema.index({ matricNumber: 1 })
cbtSubmissionSchema.index({ score: -1, timeSpentSeconds: 1 })

const CbtSubmission = mongoose.model('CbtSubmission', cbtSubmissionSchema)

export default CbtSubmission
