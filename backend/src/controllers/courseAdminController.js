import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Course from '../models/Course.js'
import Topic from '../models/Topic.js'
import User from '../models/User.js'
import { extractPlaylistId, fetchPlaylistVideos, extractVideoId, fetchSingleVideo } from '../services/youtubeService.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/materials')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Generate access token for course (Super admin only)
export const generateCourseAccessToken = async (req, res) => {
  try {
    const { courseId } = req.body
    
    // Only super admin can generate tokens
    const adminEmail = process.env.ADMIN_EMAIL
    if (!req.user || req.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Unauthorized - Super admin access required' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    await Course.findByIdAndUpdate(
      courseId,
      { adminAccessToken: token },
      { returnDocument: 'after' }
    )

    res.json({ 
      message: 'Access token generated successfully',
      token,
      courseId: course._id,
      courseTitle: course.title,
      note: 'Share this token securely with the course administrator'
    })
  } catch (error) {
    console.error('Generate token error:', error)
    res.status(500).json({ message: 'Failed to generate access token' })
  }
}

// Course admin login (no registration needed) - Simplified: just course ID
export const courseAdminLogin = async (req, res) => {
  try {
    const { courseId, email, name } = req.body

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // Create or find user account (auto-create if doesn't exist)
    let user
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() })
      
      if (!user) {
        // Auto-create account with minimal info
        user = await User.create({
          email: email.toLowerCase().trim(),
          fullName: name || email.split('@')[0] || 'Course Administrator',
          password: crypto.randomBytes(16).toString('hex'), // Random password
          faculty: course.faculty,
          department: course.department,
          level: course.level
        })
      }
    } else {
      // If no email provided, create a temporary user
      const tempEmail = `course-admin-${courseId}-${Date.now()}@temp.studyhub`
      user = await User.create({
        email: tempEmail,
        fullName: name || 'Course Administrator',
        password: crypto.randomBytes(16).toString('hex'),
        faculty: course.faculty,
        department: course.department,
        level: course.level
      })
    }

    // Assign as course admin if not already
    if (!course.courseAdmin || course.courseAdmin.toString() !== user._id.toString()) {
      await Course.findByIdAndUpdate(courseId, { courseAdmin: user._id })
    }

    // Generate JWT token
    const token = generateToken(user._id)

    res.json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      token,
      courseId: course._id,
      courseTitle: course.title,
      isCourseAdmin: true
    })
  } catch (error) {
    console.error('Course admin login error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email or login with existing account.' })
    }
    res.status(500).json({ message: 'Login failed' })
  }
}


// Get courses where user is the course admin
export const getMyAdminCourses = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Check if super admin
    const adminEmail = process.env.ADMIN_EMAIL
    const isSuperAdmin = adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()
    
    let courses
    if (isSuperAdmin) {
      // Super admin can see all courses
      courses = await Course.find().sort({ level: 1, title: 1 })
    } else {
      // Course admin can only see their courses
      courses = await Course.find({ courseAdmin: userId }).sort({ level: 1, title: 1 })
    }
    
    res.json(courses)
  } catch (error) {
    console.error('Get my admin courses error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get course details with topics (for course admin)
export const getMyCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.user._id

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // Verify user is course admin or super admin
    const adminEmail = process.env.ADMIN_EMAIL
    const isSuperAdmin = adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()
    const isCourseAdmin = course.courseAdmin && course.courseAdmin.toString() === userId.toString()

    if (!isSuperAdmin && !isCourseAdmin) {
      return res.status(403).json({ message: 'You do not have permission to manage this course' })
    }

    const topics = await Topic.find({ courseId }).sort({ order: 1 })
    
    res.json({ course, topics })
  } catch (error) {
    console.error('Get course details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Import single video (same logic as admin, but with course admin check)
export const importSingleVideo = async (req, res) => {
  try {
    const { courseId, videoUrl, topicTitle, topicDescription } = req.body
    const apiKey = process.env.YOUTUBE_API_KEY
    const userId = req.user._id

    if (!apiKey) {
      return res.status(500).json({ message: 'YouTube API key not configured' })
    }

    if (!videoUrl || !courseId || !topicTitle) {
      return res.status(400).json({ message: 'Missing required fields: courseId, videoUrl, topicTitle' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // Verify user is course admin or super admin
    const adminEmail = process.env.ADMIN_EMAIL
    const isSuperAdmin = adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()
    const isCourseAdmin = course.courseAdmin && course.courseAdmin.toString() === userId.toString()

    if (!isSuperAdmin && !isCourseAdmin) {
      return res.status(403).json({ message: 'You do not have permission to manage this course' })
    }

    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      return res.status(400).json({ message: 'Invalid video URL. Please provide a valid YouTube video URL.' })
    }

    const video = await fetchSingleVideo(videoId, apiKey)

    let topic = await Topic.findOne({ courseId, title: topicTitle })
    
    if (topic) {
      const videoExists = topic.videos.some(v => v.youtubeId === videoId)
      if (!videoExists) {
        topic.videos.push(video)
        topic.description = topicDescription || topic.description
        await topic.save()
      }
    } else {
      const topicCount = await Topic.countDocuments({ courseId })
      topic = await Topic.create({
        courseId,
        title: topicTitle,
        description: topicDescription || '',
        videos: [video],
        order: topicCount
      })
    }

    const topicCount = await Topic.countDocuments({ courseId })
    await Course.findByIdAndUpdate(courseId, {
      topics: topicCount
    })

    res.json({
      message: 'Video imported successfully',
      topic: {
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        videosCount: topic.videos.length
      },
      videosCount: 1
    })
  } catch (error) {
    console.error('Import video error:', error)
    let statusCode = 500
    let errorMessage = error.message || 'Failed to import video'
    
    if (error.message?.includes('Network error') || error.message?.includes('Unable to connect')) {
      statusCode = 503
      errorMessage = error.message
    } else if (error.message?.includes('Invalid video URL') || error.message?.includes('Video not found')) {
      statusCode = 400
      errorMessage = error.message
    } else if (error.message?.includes('API key') || error.message?.includes('access denied')) {
      statusCode = 500
      errorMessage = error.message
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Import playlist (same logic as admin, but with course admin check)
export const importPlaylist = async (req, res) => {
  try {
    const { courseId, playlistUrl, topicTitle, topicDescription } = req.body
    const apiKey = process.env.YOUTUBE_API_KEY
    const userId = req.user._id

    if (!apiKey) {
      return res.status(500).json({ message: 'YouTube API key not configured' })
    }

    if (!playlistUrl || !courseId || !topicTitle) {
      return res.status(400).json({ message: 'Missing required fields: courseId, playlistUrl, topicTitle' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // Verify user is course admin or super admin
    const adminEmail = process.env.ADMIN_EMAIL
    const isSuperAdmin = adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()
    const isCourseAdmin = course.courseAdmin && course.courseAdmin.toString() === userId.toString()

    if (!isSuperAdmin && !isCourseAdmin) {
      return res.status(403).json({ message: 'You do not have permission to manage this course' })
    }

    const playlistId = extractPlaylistId(playlistUrl)
    if (!playlistId) {
      return res.status(400).json({ message: 'Invalid playlist URL. Please provide a valid YouTube playlist URL.' })
    }

    const videos = await fetchPlaylistVideos(playlistId, apiKey)

    if (videos.length === 0) {
      return res.status(400).json({ message: 'No videos found in playlist' })
    }

    let topic = await Topic.findOne({ courseId, title: topicTitle })
    
    if (topic) {
      topic.videos = videos
      topic.description = topicDescription || topic.description
      await topic.save()
    } else {
      const topicCount = await Topic.countDocuments({ courseId })
      topic = await Topic.create({
        courseId,
        title: topicTitle,
        description: topicDescription || '',
        videos,
        order: topicCount
      })
    }

    const topicCount = await Topic.countDocuments({ courseId })
    await Course.findByIdAndUpdate(courseId, {
      topics: topicCount
    })

    res.json({
      message: 'Playlist imported successfully',
      topic: {
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        videosCount: topic.videos.length
      },
      videosCount: videos.length
    })
  } catch (error) {
    console.error('Import playlist error:', error)
    let statusCode = 500
    let errorMessage = error.message || 'Failed to import playlist'
    
    if (error.message?.includes('Network error') || error.message?.includes('Unable to connect')) {
      statusCode = 503
      errorMessage = error.message
    } else if (error.message?.includes('Invalid playlist URL') || error.message?.includes('Playlist not found')) {
      statusCode = 400
      errorMessage = error.message
    } else if (error.message?.includes('API key') || error.message?.includes('access denied')) {
      statusCode = 500
      errorMessage = error.message
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Upload material (same logic as admin, but with course admin check)
export const uploadMaterial = async (req, res) => {
  try {
    const { topicId, materialType, title } = req.body
    const file = req.file
    const userId = req.user._id

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    if (!topicId || !materialType || !title) {
      return res.status(400).json({ message: 'Missing required fields: topicId, materialType, title' })
    }

    const topic = await Topic.findById(topicId).populate('courseId')
    if (!topic) {
      fs.unlinkSync(file.path)
      return res.status(404).json({ message: 'Topic not found' })
    }

    // Get course to verify permissions
    const courseId = topic.courseId._id || topic.courseId
    const course = await Course.findById(courseId)
    
    // Verify user is course admin or super admin
    const adminEmail = process.env.ADMIN_EMAIL
    const isSuperAdmin = adminEmail && req.user.email.toLowerCase() === adminEmail.toLowerCase()
    const isCourseAdmin = course.courseAdmin && course.courseAdmin.toString() === userId.toString()

    if (!isSuperAdmin && !isCourseAdmin) {
      fs.unlinkSync(file.path)
      return res.status(403).json({ message: 'You do not have permission to manage this course' })
    }

    const fileUrl = `/uploads/materials/${file.filename}`

    topic.materials.push({
      type: materialType,
      title,
      fileUrl
    })

    await topic.save()

    res.json({
      message: 'Material uploaded successfully',
      material: topic.materials[topic.materials.length - 1]
    })
  } catch (error) {
    console.error('Upload material error:', error)
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError)
      }
    }
    res.status(500).json({ message: 'Failed to upload material' })
  }
}

// Helper function to verify course admin permissions
const verifyCourseAdmin = async (userId, courseId) => {
  const course = await Course.findById(courseId)
  if (!course) {
    return { error: 'Course not found', course: null }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const isSuperAdmin = adminEmail && userId.email?.toLowerCase() === adminEmail.toLowerCase()
  const isCourseAdmin = course.courseAdmin && course.courseAdmin.toString() === userId._id.toString()

  if (!isSuperAdmin && !isCourseAdmin) {
    return { error: 'You do not have permission to manage this course', course: null }
  }

  return { error: null, course }
}

// Add forum link to course
export const addForumLink = async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, url, platform, description } = req.body

    if (!title || !url) {
      return res.status(400).json({ message: 'Missing required fields: title, url' })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid URL format' })
    }

    const { error, course } = await verifyCourseAdmin(req.user, courseId)
    if (error) {
      return res.status(error === 'Course not found' ? 404 : 403).json({ message: error })
    }

    // Check if link already exists
    const linkExists = course.forumLinks.some(link => link.url === url)
    if (linkExists) {
      return res.status(400).json({ message: 'This forum link already exists for this course' })
    }

    course.forumLinks.push({
      title,
      url,
      platform: platform || 'Other',
      description: description || ''
    })

    await course.save()

    res.json({
      message: 'Forum link added successfully',
      forumLink: course.forumLinks[course.forumLinks.length - 1]
    })
  } catch (error) {
    console.error('Add forum link error:', error)
    res.status(500).json({ message: 'Failed to add forum link' })
  }
}

// Update forum link
export const updateForumLink = async (req, res) => {
  try {
    const { courseId, linkId } = req.params
    const { title, url, platform, description } = req.body

    if (!title || !url) {
      return res.status(400).json({ message: 'Missing required fields: title, url' })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid URL format' })
    }

    const { error, course } = await verifyCourseAdmin(req.user, courseId)
    if (error) {
      return res.status(error === 'Course not found' ? 404 : 403).json({ message: error })
    }

    const linkIndex = course.forumLinks.findIndex(link => link._id.toString() === linkId)
    if (linkIndex === -1) {
      return res.status(404).json({ message: 'Forum link not found' })
    }

    // Check if URL already exists (excluding current link)
    const urlExists = course.forumLinks.some(
      (link, index) => link.url === url && index !== linkIndex
    )
    if (urlExists) {
      return res.status(400).json({ message: 'This URL already exists for this course' })
    }

    course.forumLinks[linkIndex] = {
      ...course.forumLinks[linkIndex].toObject(),
      title,
      url,
      platform: platform || 'Other',
      description: description || ''
    }

    await course.save()

    res.json({
      message: 'Forum link updated successfully',
      forumLink: course.forumLinks[linkIndex]
    })
  } catch (error) {
    console.error('Update forum link error:', error)
    res.status(500).json({ message: 'Failed to update forum link' })
  }
}

// Delete forum link
export const deleteForumLink = async (req, res) => {
  try {
    const { courseId, linkId } = req.params

    const { error, course } = await verifyCourseAdmin(req.user, courseId)
    if (error) {
      return res.status(error === 'Course not found' ? 404 : 403).json({ message: error })
    }

    const linkIndex = course.forumLinks.findIndex(link => link._id.toString() === linkId)
    if (linkIndex === -1) {
      return res.status(404).json({ message: 'Forum link not found' })
    }

    course.forumLinks.splice(linkIndex, 1)
    await course.save()

    res.json({ message: 'Forum link deleted successfully' })
  } catch (error) {
    console.error('Delete forum link error:', error)
    res.status(500).json({ message: 'Failed to delete forum link' })
  }
}

// Update course information
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, description, instructor, units, image } = req.body

    const { error, course } = await verifyCourseAdmin(req.user, courseId)
    if (error) {
      return res.status(error === 'Course not found' ? 404 : 403).json({ message: error })
    }

    // Update allowed fields (course admins can't change faculty, department, level)
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (instructor !== undefined) updateData.instructor = instructor
    if (units !== undefined) updateData.units = units
    if (image !== undefined) updateData.image = image

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { returnDocument: 'after', runValidators: true }
    )

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    })
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ message: 'Failed to update course' })
  }
}
