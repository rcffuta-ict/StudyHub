import express from 'express'
import { protect } from '../middleware/auth.js'
import { adminAuth } from '../middleware/adminAuth.js'
import { 
  importPlaylist,
  importSingleVideo,
  uploadMaterial, 
  getAllCoursesAdmin,
  getCourseDetailsAdmin,
  deleteTopic,
  createCourse,
  updateAcademicSeason,
  upload 
} from '../controllers/adminController.js'
import {
  getContactMessages,
  updateMessageStatus,
  deleteContactMessage
} from '../controllers/contactController.js'

const router = express.Router()

// All admin routes require authentication and admin access
router.use(protect)
router.use(adminAuth)

router.get('/courses', getAllCoursesAdmin)
router.get('/courses/:courseId', getCourseDetailsAdmin)
router.post('/courses', createCourse)
router.post('/import-playlist', importPlaylist)
router.post('/import-video', importSingleVideo)
router.post('/upload-material', upload.single('file'), uploadMaterial)
router.delete('/topics/:topicId', deleteTopic)
router.put('/academic-season', updateAcademicSeason)

// Contact Messages Management
router.get('/messages', getContactMessages)
router.patch('/messages/:id/status', updateMessageStatus)
router.delete('/messages/:id', deleteContactMessage)

export default router
