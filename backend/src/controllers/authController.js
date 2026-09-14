import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import mongoose from 'mongoose'
import { verifyGoogleToken } from '../services/googleAuthService.js'
import crypto from 'crypto'

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg || 'Validation failed',
        errors: errors.array() 
      })
    }

    const { email, password, fullName, name, faculty, department, level } = req.body
    const userFullName = (fullName || name || '').trim()

    // Check if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Create user
    const user = await User.create({
      email,
      password,
      fullName: userFullName,
      faculty,
      department,
      level,
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        faculty: user.faculty,
        department: user.department,
        level: user.level,
        token: generateToken(user._id),
      })
    } else {
      res.status(500).json({ message: 'Failed to create user' })
    }
  } catch (error) {
    console.error('Registration error:', error)
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }
    res.status(500).json({ message: error.message || 'Server error occurred' })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg || 'Validation failed',
        errors: errors.array() 
      })
    }

    const { email, password } = req.body

    // Normalize email (lowercase and trim) to match database storage
    const normalizedEmail = email.toLowerCase().trim()

    // Check for user. Unlike the generic "Invalid credentials" below, a missing
    // account is flagged explicitly so the frontend can offer to register instead
    // of just failing — this is a deliberate, small account-enumeration trade-off.
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address.', accountNotFound: true })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      faculty: user.faculty,
      department: user.department,
      level: user.level,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: error.message || 'Server error occurred' })
  }
}

// @desc    Google Sign-in/Sign-up authentication
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token, faculty, department, level } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Google credential token is required' })
    }

    // Verify token
    const payload = await verifyGoogleToken(token)
    const { email, name, email_verified } = payload

    if (email_verified !== true) {
      return res.status(400).json({ message: 'Google account email is not verified' })
    }

    if (!email) {
      return res.status(400).json({ message: 'Email not returned by Google' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail })

    if (user) {
      // User exists, log them in directly
      return res.json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        faculty: user.faculty,
        department: user.department,
        level: user.level,
        token: generateToken(user._id),
      })
    }

    // User does not exist, check if we have the extra info to register them
    if (faculty && department && level) {
      // Generate a secure random password
      const randomPassword = crypto.randomBytes(8).toString('hex') + 'Google1!'

      user = await User.create({
        email: normalizedEmail,
        password: randomPassword,
        fullName: name || 'Google User',
        faculty,
        department,
        level,
      })

      return res.status(201).json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        faculty: user.faculty,
        department: user.department,
        level: user.level,
        token: generateToken(user._id),
      })
    }

    // Otherwise, signal that we need registration fields to finish creating the account
    return res.json({
      needRegistrationInfo: true,
      email: normalizedEmail,
      fullName: name || '',
    })

  } catch (error) {
    console.error('Google login controller error:', error)
    res.status(500).json({ message: error.message || 'Server error occurred' })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (req.user && req.user.isGuest) {
      return res.json(req.user)
    }
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const guestLogin = async (req, res) => {
  try {
    const guestId = new mongoose.Types.ObjectId().toString()
    const token = jwt.sign({ id: guestId, isGuest: true }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })
    res.json({
      _id: guestId,
      email: 'guest@studyhub.com',
      fullName: 'Guest Student',
      faculty: 'Science & Tech',
      department: 'Computer Science',
      level: '100',
      isGuest: true,
      token,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error occurred' })
  }
}

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    if (req.user && req.user.isGuest) {
      return res.status(400).json({ message: 'Guest accounts cannot update profile details.' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { fullName, faculty, department, level, newPassword } = req.body

    if (fullName) user.fullName = fullName
    if (faculty) user.faculty = faculty
    if (department) user.department = department
    if (level) user.level = level

    if (newPassword && newPassword.trim().length >= 6) {
      user.password = newPassword
    }

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      faculty: updatedUser.faculty,
      department: updatedUser.department,
      level: updatedUser.level,
      isVerified: updatedUser.isVerified,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating profile' })
  }
}

export { register, login, googleLogin, getMe, guestLogin, updateProfile }
