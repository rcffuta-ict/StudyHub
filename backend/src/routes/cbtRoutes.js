import express from 'express'
import {
  getStatus,
  startExam,
  syncDraft,
  submitExam,
  getLeaderboard,
  adminUpdateSettings,
  adminResetAttempt,
} from '../controllers/cbtController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Public student CBT routes (guarded by user auth)
router.get('/status', protect, getStatus)
router.post('/start', protect, startExam)
router.post('/sync-draft', protect, syncDraft)
router.post('/submit', protect, submitExam)

// Admin CBT routes (guarded by admin auth)
router.get('/admin/leaderboard', protect, admin, getLeaderboard)
router.put('/admin/settings', protect, admin, adminUpdateSettings)
router.delete('/admin/reset-attempt/:id', protect, admin, adminResetAttempt)

export default router
