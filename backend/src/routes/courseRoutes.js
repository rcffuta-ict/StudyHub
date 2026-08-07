import express from 'express'
import { getMyCourses, getAllCourses, enrollCourse, unenrollCourse, getCourseDetails } from '../controllers/courseController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All routes are protected
router.get('/my-courses', protect, getMyCourses)
router.get('/', protect, getAllCourses)
router.get('/:courseId', protect, getCourseDetails)
router.post('/:courseId/enroll', protect, enrollCourse)
router.delete('/:courseId/enroll', protect, unenrollCourse)
router.post('/:courseId/unenroll', protect, unenrollCourse)

export default router

