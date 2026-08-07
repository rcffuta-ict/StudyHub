import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import YouTubePlayer from '../components/YouTubePlayer'
import HigherLevelPrep from '../components/HigherLevelPrep'
import { coursesAPI, progressAPI } from '../services/api'
import toast from 'react-hot-toast'

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [topics, setTopics] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('overview') // 'overview' or 'learning'
  const [showOutline, setShowOutline] = useState(false)
  const [courseProgress, setCourseProgress] = useState(null)
  const [completedVideoIds, setCompletedVideoIds] = useState(new Set())

  useEffect(() => {
    fetchCourseDetails()
    fetchCourseProgress()
  }, [courseId])

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      const response = await coursesAPI.getCourseDetails(courseId)
      setCourse(response.data.course)
      setTopics(response.data.topics)
      setStatistics(response.data.statistics)
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseProgress = async () => {
    try {
      const response = await progressAPI.getCourseProgress(courseId)
      setCourseProgress(response.data)
      if (response.data.completedVideoIds) {
        setCompletedVideoIds(new Set(response.data.completedVideoIds))
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const handleStartLearning = () => {
    setViewMode('learning')
    // Select first video by default
    if (topics.length > 0 && topics[0].videos.length > 0) {
      setSelectedTopic(topics[0])
      setSelectedVideo(topics[0].videos[0])
    }
  }

  const handleVideoSelect = async (video, topic) => {
    setSelectedVideo(video)
    setSelectedTopic(topic)
    // Track video watch start
    try {
      await progressAPI.trackVideoWatch(courseId, topic._id, video.youtubeId)
      // Refresh progress after selecting video
      fetchCourseProgress()
    } catch (error) {
      console.error('Error tracking video:', error)
    }
  }

  const handleVideoEnd = async () => {
    if (!selectedVideo || !selectedTopic) return
    // Mark video as completed
    try {
      await progressAPI.markVideoComplete(
        courseId, 
        selectedTopic._id, 
        selectedVideo.youtubeId,
        selectedVideo.duration || 0
      )
      toast.success('Video marked as completed!')
      // Refresh progress
      fetchCourseProgress()
    } catch (error) {
      console.error('Error marking video complete:', error)
    }
  }

  const handleVideoProgress = async (progressData) => {
    if (!selectedVideo || !selectedTopic) return
    // Update watch time every 10 seconds
    try {
      await progressAPI.updateWatchTime(
        courseId, 
        selectedTopic._id, 
        selectedVideo.youtubeId, 
        progressData.currentTime
      )
    } catch (error) {
      console.error('Error updating watch time:', error)
    }
  }

  const getNextVideo = () => {
    if (!selectedTopic || !selectedVideo) return null
    
    const currentIndex = selectedTopic.videos.findIndex(v => v.youtubeId === selectedVideo.youtubeId)
    if (currentIndex < selectedTopic.videos.length - 1) {
      return { video: selectedTopic.videos[currentIndex + 1], topic: selectedTopic }
    }
    // Check next topic
    const topicIndex = topics.findIndex(t => t._id === selectedTopic._id)
    if (topicIndex < topics.length - 1 && topics[topicIndex + 1].videos.length > 0) {
      return { video: topics[topicIndex + 1].videos[0], topic: topics[topicIndex + 1] }
    }
    return null
  }

  const getPreviousVideo = () => {
    if (!selectedTopic || !selectedVideo) return null
    
    const currentIndex = selectedTopic.videos.findIndex(v => v.youtubeId === selectedVideo.youtubeId)
    if (currentIndex > 0) {
      return { video: selectedTopic.videos[currentIndex - 1], topic: selectedTopic }
    }
    // Check previous topic
    const topicIndex = topics.findIndex(t => t._id === selectedTopic._id)
    if (topicIndex > 0 && topics[topicIndex - 1].videos.length > 0) {
      const prevTopic = topics[topicIndex - 1]
      return { video: prevTopic.videos[prevTopic.videos.length - 1], topic: prevTopic }
    }
    return null
  }

  const formatDuration = (seconds) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isVideoCompleted = (videoId) => {
    return completedVideoIds.has(videoId)
  }

  const handleUnenrollCourse = async () => {
    if (!window.confirm(`Are you sure you want to drop / terminate enrollment in ${course?.title || 'this course'}?`)) return
    try {
      await coursesAPI.unenrollCourse(courseId)
      toast.success('Successfully terminated course enrollment')
      navigate('/courses')
    } catch (error) {
      console.error('Error unenrolling:', error)
      toast.error(error.response?.data?.message || 'Failed to unenroll from course')
    }
  }

  const renderCleanTopicNotes = (video, topic) => {
    if (!video && !topic) return <p className="text-gray-500 italic">No notes selected.</p>

    const rawDescription = video?.description || topic?.description || ''
    
    // Clean raw description by stripping URLs and social media boilerplate
    const cleanedText = rawDescription
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/www\.[^\s]+/g, '')
      .replace(/bit\.ly[^\s]+/g, '')
      .replace(/t\.me[^\s]+/g, '')
      .replace(/(subscribe|like|share|follow|instagram|twitter|facebook|telegram|channel|playlist|discord|whatsapp)/gi, '')
      .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')
      .replace(/[^\w\s.,?!()'":\-\n]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const topicTitle = topic?.title || 'Core Topic'
    const videoTitle = video?.title || 'Lesson Overview'

    return (
      <div className="space-y-4 font-sans text-gray-800">
        <div className="border-b border-purple-200/60 pb-3">
          <h4 className="font-extrabold text-base text-[#4B2E83] font-['Outfit',sans-serif]">
            {videoTitle} – Key Concepts Summary
          </h4>
          <p className="text-xs text-purple-900/80 font-medium">
            Under {topicTitle}
          </p>
        </div>

        {cleanedText.length > 40 ? (
          <div className="text-xs sm:text-sm leading-relaxed text-gray-700 space-y-2">
            {cleanedText.split('. ').map((sentence, idx) => (
              sentence.trim() && (
                <p key={idx} className="flex items-start gap-2">
                  <span className="text-[#4B2E83] font-bold mt-0.5">•</span>
                  <span>{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</span>
                </p>
              )
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-xs sm:text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Key Learning Objectives for {videoTitle}:</p>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-start gap-2">
                <span className="text-[#4B2E83] font-bold">•</span>
                <span>Master core theoretical definitions and foundational equations introduced in {topicTitle}.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4B2E83] font-bold">•</span>
                <span>Analyze step-by-step problem-solving methodologies for semester exam questions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4B2E83] font-bold">•</span>
                <span>Review associated past question patterns and high-frequency CBT mock scenarios.</span>
              </li>
            </ul>
          </div>
        )}

        <div className="bg-white p-3.5 rounded-xl border border-purple-200/70 flex items-center justify-between text-xs">
          <span className="font-bold text-[#4B2E83]">💡 Revision Tip</span>
          <span className="text-gray-500 font-medium">Re-watch key sections & practice past questions after viewing notes.</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading course...</div>
        </div>
      </Layout>
    )
  }

  // Overview Mode - Course Overview Page
  if (viewMode === 'overview') {
    return (
      <Layout>
        <div>
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/courses')} 
              className="text-[#4B2E83] font-bold hover:underline flex items-center gap-2 text-sm"
            >
              <span>←</span> Back to Courses
            </button>
            <button
              onClick={handleUnenrollCourse}
              className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all"
            >
              Terminate Enrollment
            </button>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{course?.title}</h1>
          
          {course?.description && (
            <p className="text-gray-600 mb-6">{course.description}</p>
          )}

          {/* Progress Section */}
          {courseProgress && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Progress</h3>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {courseProgress.completedVideos} of {courseProgress.totalVideos} videos completed
                  </span>
                  <span className="font-semibold text-[#4B2E83]">
                    {courseProgress.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#4B2E83] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${courseProgress.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Course Outline Toggle */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <button
              onClick={() => setShowOutline(!showOutline)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold">View Course outline</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showOutline ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showOutline && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="space-y-2 mt-4">
                  {topics.map((topic, index) => (
                    <div key={topic._id} className="text-sm text-gray-600">
                      {index + 1}. {topic.title}
                      {topic.videos && topic.videos.length > 0 && (
                        <span className="text-gray-400 ml-2">
                          ({topic.videos.length} {topic.videos.length === 1 ? 'video' : 'videos'})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Course Content Statistics */}
          {statistics && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#4B2E83] mb-1">
                    {statistics.totalVideos}
                  </div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#4B2E83] mb-1">
                    {statistics.totalMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Materials</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#4B2E83] mb-1">
                    {statistics.totalPastQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Past Questions</div>
                </div>
              </div>
            </div>
          )}

          {/* Higher Level Prep Tools for 300L+ */}
          {(!isNaN(Number(course?.level)) && Number(course?.level) >= 300) && (
            <div className="mb-6">
              <HigherLevelPrep courseTitle={course?.title} courseLevel={course?.level} />
            </div>
          )}

          {/* Start Learning Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleStartLearning}
              className="w-full sm:w-auto px-8 py-3 bg-[#4B2E83] text-white rounded-xl hover:bg-[#3b2368] transition-colors font-bold text-sm shadow-md"
            >
              Start Learning →
            </button>
            <button
              onClick={handleUnenrollCourse}
              className="w-full sm:w-auto px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors"
            >
              Terminate Enrollment
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Learning Mode - Course Learning Page (Video Top -> Outline Middle -> Notes Bottom)
  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('overview')} 
              className="text-[#4B2E83] font-bold hover:underline flex items-center gap-1.5 text-xs sm:text-sm bg-purple-50 px-3 py-1.5 rounded-lg"
            >
              <span>←</span> Back to Overview
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{course?.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {courseProgress && (
              <span className="text-xs font-extrabold text-[#4B2E83] bg-purple-100 px-3 py-1.5 rounded-lg">
                {courseProgress.completionPercentage}% Complete
              </span>
            )}
            <button
              onClick={handleUnenrollCourse}
              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-all"
            >
              Terminate Enrollment
            </button>
          </div>
        </div>

        {/* 1. TOP SECTION: Video Player */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-4">
          {selectedVideo ? (
            <>
              {/* Video Title & Nav Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4B2E83] bg-purple-50 px-2.5 py-1 rounded-md">
                    {selectedTopic?.title || 'Current Topic'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{selectedVideo.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prev = getPreviousVideo()
                      if (prev) handleVideoSelect(prev.video, prev.topic)
                    }}
                    disabled={!getPreviousVideo()}
                    className="px-3.5 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  >
                    ← Previous Lesson
                  </button>
                  <button
                    onClick={() => {
                      const next = getNextVideo()
                      if (next) handleVideoSelect(next.video, next.topic)
                    }}
                    disabled={!getNextVideo()}
                    className="px-3.5 py-2 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] disabled:opacity-40 transition-colors"
                  >
                    Next Lesson →
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <YouTubePlayer
                  videoId={selectedVideo.youtubeId}
                  onVideoEnd={handleVideoEnd}
                  onProgress={handleVideoProgress}
                />
              </div>
            </>
          ) : (
            <div className="w-full aspect-video bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 text-sm font-medium">
              Select a lesson topic below to start watching
            </div>
          )}
        </div>

        {/* 2. MIDDLE SECTION: Course Outline & Topic Selector */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Course Outline & Lessons</h2>
              <p className="text-xs text-gray-500">Click any topic video below to play</p>
            </div>
            <span className="text-xs font-bold bg-purple-50 text-[#4B2E83] px-3 py-1 rounded-full">
              {topics.length} Topics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic, topicIdx) => (
              <div key={topic._id} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 flex flex-col justify-between">
                <div>
                  <p className="font-extrabold text-xs text-[#4B2E83] uppercase tracking-wider mb-2">
                    Topic {topicIdx + 1}: {topic.title}
                  </p>
                  <div className="space-y-1.5">
                    {topic.videos?.map((video, vIdx) => {
                      const isSelected = selectedVideo?.youtubeId === video.youtubeId
                      const isCompleted = isVideoCompleted(video.youtubeId)
                      return (
                        <button
                          key={video.youtubeId}
                          onClick={() => handleVideoSelect(video, topic)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'border-[#4B2E83] bg-purple-100/70 text-[#4B2E83] font-bold shadow-sm'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <span className="line-clamp-1">{topicIdx + 1}.{vIdx + 1} {video.title}</span>
                          {isCompleted && (
                            <span className="w-4 h-4 bg-[#4B2E83] text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. BOTTOM SECTION: Formatted Topic Notes & Study Materials */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Topic Notes & Key Takeaways</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Legible revision notes for {selectedTopic?.title || 'this topic'}</p>
          </div>

          {/* Formatted Notes Box */}
          <div className="bg-purple-50/40 p-5 rounded-xl border border-purple-100/80 text-sm text-gray-700 leading-relaxed">
            {renderCleanTopicNotes(selectedVideo, selectedTopic)}
          </div>

          {/* Study Materials & Attachments */}
          {selectedTopic?.materials && selectedTopic.materials.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-3">Topic Downloads & Attachments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTopic.materials.map((mat, i) => (
                  <a
                    key={i}
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mat.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-[#4B2E83] hover:shadow-sm transition-all"
                  >
                    <span className="px-2 py-1 bg-purple-100 text-[#4B2E83] text-xs font-bold rounded">
                      {mat.type === 'pdf' ? 'PDF' : mat.type === 'past-question' ? 'PQ' : 'NOTE'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{mat.title}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{mat.type.replace('-', ' ')}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CourseDetail
