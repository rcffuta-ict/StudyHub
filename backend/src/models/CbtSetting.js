import mongoose from 'mongoose'

const cbtSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_cbt_config',
      unique: true,
    },
    activeSet: {
      type: String,
      enum: ['Set A', 'Set B'],
      default: 'Set A',
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    isExamActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

const CbtSetting = mongoose.model('CbtSetting', cbtSettingSchema)

export default CbtSetting
