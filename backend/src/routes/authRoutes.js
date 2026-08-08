import express from 'express'
import { body } from 'express-validator'
import { register, login, googleLogin, getMe, guestLogin, updateProfile } from '../controllers/authController.js'
import { forgotPassword, verifyOTP, resetPassword } from '../controllers/passwordController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body().custom((value, { req }) => {
    const name = req.body.fullName || req.body.name
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Full name is required')
    }
    return true
  }),
  body('faculty').trim().notEmpty().withMessage('Faculty is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('level').isIn(['100', '200', '300', '400', '500']).withMessage('Level must be 100, 200, 300, 400, or 500'),
]

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
]

const verifyOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
]

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

// Auth routes
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.post('/google', googleLogin)
router.post('/guest-login', guestLogin)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, forgotPassword)
router.post('/verify-otp', verifyOTPValidation, verifyOTP)
router.post('/reset-password', resetPasswordValidation, resetPassword)

export default router
