import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'
import Topic from '../models/Topic.js'

// @desc    Get user's enrolled courses
// @route   GET /api/courses/my-courses
// @access  Private
export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user._id

    // Get all enrollments for the user
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId')
      .sort({ enrolledAt: -1 })

    // Format the response
    const courses = await Promise.all(enrollments.map(async (enrollment) => {
      if (!enrollment.courseId) return null;
      let image = enrollment.courseId.image;
      if (!image) {
        const firstTopic = await Topic.findOne({ courseId: enrollment.courseId._id, 'videos.0': { $exists: true } }).sort({ order: 1 });
        if (firstTopic && firstTopic.videos && firstTopic.videos.length > 0) {
          image = firstTopic.videos[0].thumbnail || `https://img.youtube.com/vi/${firstTopic.videos[0].youtubeId}/hqdefault.jpg`;
        }
      }
      return {
        _id: enrollment.courseId._id,
        title: enrollment.courseId.title,
        description: enrollment.courseId.description,
        topics: enrollment.courseId.topics || 12, // Default or from course
        progress: enrollment.progress || 0,
        units: enrollment.courseId.units || 3, // Default or from course
        lastActivity: enrollment.updatedAt || enrollment.enrolledAt,
        image: image || null
      }
    }))

    res.json(courses.filter(c => c !== null))
  } catch (error) {
    console.error('Get my courses error:', error)
    res.status(500).json({ message: 'Server error occurred' })
  }
}

// @desc    Get all available courses
// @route   GET /api/courses
// @access  Private
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .select('-adminAccessToken') // Don't expose access tokens
      .sort({ createdAt: -1 })

    const coursesWithThumbnails = await Promise.all(courses.map(async (course) => {
      const courseObj = course.toObject()
      if (!courseObj.image) {
        const firstTopic = await Topic.findOne({ courseId: courseObj._id, 'videos.0': { $exists: true } }).sort({ order: 1 });
        if (firstTopic && firstTopic.videos && firstTopic.videos.length > 0) {
          courseObj.image = firstTopic.videos[0].thumbnail || `https://img.youtube.com/vi/${firstTopic.videos[0].youtubeId}/hqdefault.jpg`;
        }
      }
      return courseObj
    }))

    res.json(coursesWithThumbnails)
  } catch (error) {
    console.error('Get all courses error:', error)
    res.status(500).json({ message: 'Server error occurred' })
  }
}

// @desc    Enroll in a course
// @route   POST /api/courses/:courseId/enroll
// @access  Private
export const enrollCourse = async (req, res) => {
  try {
    const userId = req.user._id
    const { courseId } = req.params

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId })
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId,
      progress: 0
    })

    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment
    })
  } catch (error) {
    console.error('Enroll course error:', error)
    res.status(500).json({ message: 'Server error occurred' })
  }
}

// @desc    Unenroll / terminate enrollment in a course
// @route   DELETE /api/courses/:courseId/enroll
// @access  Private
export const unenrollCourse = async (req, res) => {
  try {
    const userId = req.user._id
    const { courseId } = req.params

    const enrollment = await Enrollment.findOneAndDelete({ userId, courseId })
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }

    res.json({ message: 'Successfully unenrolled from course' })
  } catch (error) {
    console.error('Unenroll course error:', error)
    res.status(500).json({ message: 'Server error occurred' })
  }
}

// @desc    Get course details with topics and videos
// @route   GET /api/courses/:courseId
// @access  Private
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params
    const course = await Course.findById(courseId)
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    const topics = await Topic.find({ courseId }).sort({ order: 1 })
    
    // Calculate course statistics
    let totalVideos = 0
    let totalMaterials = 0
    let totalPastQuestions = 0
    
    topics.forEach(topic => {
      totalVideos += topic.videos?.length || 0
      if (topic.materials && topic.materials.length > 0) {
        topic.materials.forEach(material => {
          if (material.type === 'pdf' || material.type === 'note') {
            totalMaterials++
          } else if (material.type === 'past-question') {
            totalPastQuestions++
          }
        })
      }
    })
    
    const courseObj = course.toObject()
    if (!courseObj.image) {
      const firstTopic = await Topic.findOne({ courseId, 'videos.0': { $exists: true } }).sort({ order: 1 });
      if (firstTopic && firstTopic.videos && firstTopic.videos.length > 0) {
        courseObj.image = firstTopic.videos[0].thumbnail || `https://img.youtube.com/vi/${firstTopic.videos[0].youtubeId}/hqdefault.jpg`;
      }
    }

    res.json({ 
      course: courseObj, 
      topics,
      statistics: {
        totalVideos,
        totalMaterials,
        totalPastQuestions,
        totalTopics: topics.length
      }
    })
  } catch (error) {
    console.error('Get course details error:', error)
    res.status(500).json({ message: 'Server error occurred' })
  }
}

