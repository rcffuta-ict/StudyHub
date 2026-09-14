import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminAPI, dashboardAPI, cbtAPI } from '../services/api'
import toast from 'react-hot-toast'
import AdminLayout from '../components/AdminLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import Pagination from '../components/Pagination'
import { faculties } from '../utils/faculties'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseDetails, setCourseDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [academicSeason, setAcademicSeason] = useState('second-semester')

  // Contact Messages state
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageFilter, setMessageFilter] = useState('all')
  const [msgPage, setMsgPage] = useState(1)
  const msgPerPage = 4

  // CBT Scholarship States
  const [cbtSubmissions, setCbtSubmissions] = useState([])
  const [cbtConfig, setCbtConfig] = useState({ activeSet: 'Set A', durationMinutes: 45, isExamActive: true, examStartAt: null, examEndAt: null })
  const [loadingCbt, setLoadingCbt] = useState(false)
  const [examWindow, setExamWindow] = useState({ start: '', end: '' })

  // Convert an ISO date string to the "YYYY-MM-DDTHH:mm" shape <input type="datetime-local"> expects
  const toDatetimeLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  useEffect(() => {
    setExamWindow({
      start: toDatetimeLocal(cbtConfig.examStartAt),
      end: toDatetimeLocal(cbtConfig.examEndAt),
    })
  }, [cbtConfig.examStartAt, cbtConfig.examEndAt])

  const fetchCbtLeaderboard = async () => {
    try {
      setLoadingCbt(true)
      const res = await cbtAPI.getLeaderboard()
      if (res.data.success) {
        setCbtSubmissions(res.data.submissions || [])
        if (res.data.config) setCbtConfig(res.data.config)
      }
    } catch (error) {
      console.error('CBT Leaderboard error:', error)
    } finally {
      setLoadingCbt(false)
    }
  }

  useEffect(() => {
    fetchCbtLeaderboard()
  }, [])

  const handleUpdateCbtSettings = async (newSettings) => {
    try {
      const res = await cbtAPI.updateSettings(newSettings)
      if (res.data.success) {
        setCbtConfig(res.data.config)
        toast.success('CBT Exam Settings Updated!')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update CBT settings.')
    }
  }

  const handleSaveExamWindow = () => {
    handleUpdateCbtSettings({
      examStartAt: examWindow.start ? new Date(examWindow.start).toISOString() : null,
      examEndAt: examWindow.end ? new Date(examWindow.end).toISOString() : null,
    })
  }

  const handleClearExamWindow = () => {
    handleUpdateCbtSettings({ examStartAt: null, examEndAt: null })
  }

  const handleResetCbtAttempt = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to reset the attempt for ${studentName}? This will delete their score and allow a retake.`)) return
    try {
      const res = await cbtAPI.resetAttempt(id)
      if (res.data.success) {
        toast.success(res.data.message)
        fetchCbtLeaderboard()
      }
    } catch (error) {
      toast.error('Failed to reset attempt.')
    }
  }

  const handleExportCbtCsv = () => {
    if (cbtSubmissions.length === 0) return toast.error('No submissions to export.')
    
    const headers = ['Rank', 'Surname', 'Firstname', 'Email', 'Matric Number', 'Department', 'Faculty', 'Combination', 'Question Set', 'Score', 'Total Questions', 'Percentage', 'Time Spent (s)', 'Status', 'Submitted Date']
    const rows = cbtSubmissions.map((sub, idx) => [
      idx + 1,
      `"${sub.surname || ''}"`,
      `"${sub.firstname || ''}"`,
      `"${sub.email || ''}"`,
      `"${sub.matricNumber || ''}"`,
      `"${sub.department || ''}"`,
      `"${sub.faculty || ''}"`,
      sub.combination,
      sub.questionSet,
      sub.score,
      sub.totalQuestions,
      `${sub.percentage}%`,
      sub.timeSpentSeconds,
      sub.status,
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `100L_Scholarship_CBT_Results_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Leaderboard CSV exported successfully!')
  }

  useEffect(() => {
    const fetchAcademicSeason = async () => {
      try {
        const response = await dashboardAPI.getAcademicSeason()
        if (response.data?.season) {
          setAcademicSeason(response.data.season)
        }
      } catch (error) {
        console.error('Error fetching academic season:', error)
        let saved = localStorage.getItem('studyhub_academic_season')
        const firstSemDate = new Date('2026-03-02T00:00:00.000Z')
        if (saved === 'first-semester' && new Date() > firstSemDate) {
          saved = 'second-semester'
        }
        setAcademicSeason(saved || 'second-semester')
      }
    }
    fetchAcademicSeason()
  }, [])

  const handleSeasonChange = async (season) => {
    try {
      await adminAPI.updateAcademicSeason(season)
      localStorage.setItem('studyhub_academic_season', season)
      setAcademicSeason(season)
      toast.success(`Academic season updated to: ${season.replace('-', ' ').toUpperCase()}`)
    } catch (error) {
      console.error('Error updating academic season:', error)
      toast.error('Failed to update academic season on server')
    }
  }

  // Contact Messages Handlers
  const fetchMessages = async () => {
    try {
      setLoadingMessages(true)
      const response = await adminAPI.getContactMessages()
      setMessages(response.data || [])
    } catch (error) {
      console.error('Error fetching contact messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleUpdateMessageStatus = async (id, status) => {
    try {
      await adminAPI.updateMessageStatus(id, status)
      toast.success(`Message marked as ${status}`)
      fetchMessages()
    } catch (error) {
      toast.error('Failed to update message status')
    }
  }

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return
    try {
      await adminAPI.deleteContactMessage(id)
      toast.success('Message deleted')
      fetchMessages()
    } catch (error) {
      toast.error('Failed to delete message')
    }
  }

  // Form states
  const [importType, setImportType] = useState('playlist') // 'playlist' or 'video'
  const [playlistForm, setPlaylistForm] = useState({
    courseId: '',
    playlistUrl: '',
    topicTitle: '',
    topicDescription: ''
  })
  const [videoForm, setVideoForm] = useState({
    courseId: '',
    videoUrl: '',
    topicTitle: '',
    topicDescription: ''
  })

  const [materialForm, setMaterialForm] = useState({
    topicId: '',
    materialType: 'pdf',
    title: '',
    file: null
  })

  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    description: '',
    faculty: '',
    department: '',
    level: '100',
    units: 3
  })
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [showCreateCourse, setShowCreateCourse] = useState(false)

  // Dashboard section navigation (keeps unrelated admin tools visually separated)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || ''
    if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      toast.error('Admin access required')
      navigate('/admin/login')
      return
    }

    fetchCourses()
    fetchMessages()
  }, [user, navigate])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllCourses()
      if (response.data && Array.isArray(response.data)) {
        setCourses(response.data)
        if (response.data.length === 0) {
          toast.error('No courses found. Please create courses first.')
        }
      } else {
        setCourses([])
        toast.error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error(error.response?.data?.message || 'Failed to load courses')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseDetails = async (courseId) => {
    try {
      const response = await adminAPI.getCourseDetails(courseId)
      setCourseDetails(response.data)
      setSelectedCourse(courseId)
    } catch (error) {
      console.error('Error fetching course details:', error)
      toast.error('Failed to load course details')
    }
  }

  const handleImportPlaylist = async (e) => {
    e.preventDefault()
    if (!playlistForm.courseId || !playlistForm.playlistUrl || !playlistForm.topicTitle) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setImporting(true)
      const response = await adminAPI.importPlaylist(playlistForm)
      toast.success(`Successfully imported ${response.data.videosCount} videos!`)
      setPlaylistForm({
        courseId: '',
        playlistUrl: '',
        topicTitle: '',
        topicDescription: ''
      })
      if (selectedCourse === playlistForm.courseId) {
        fetchCourseDetails(playlistForm.courseId)
      }
    } catch (error) {
      console.error('Error importing playlist:', error)
      toast.error(error.response?.data?.message || 'Failed to import playlist')
    } finally {
      setImporting(false)
    }
  }

  const handleImportVideo = async (e) => {
    e.preventDefault()
    if (!videoForm.courseId || !videoForm.videoUrl || !videoForm.topicTitle) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setImporting(true)
      const response = await adminAPI.importSingleVideo(videoForm)
      toast.success('Successfully imported video!')
      setVideoForm({
        courseId: '',
        videoUrl: '',
        topicTitle: '',
        topicDescription: ''
      })
      if (selectedCourse === videoForm.courseId) {
        fetchCourseDetails(videoForm.courseId)
      }
    } catch (error) {
      console.error('Error importing video:', error)
      toast.error(error.response?.data?.message || 'Failed to import video')
    } finally {
      setImporting(false)
    }
  }

  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    if (!materialForm.topicId || !materialForm.title || !materialForm.file) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('topicId', materialForm.topicId)
      formData.append('materialType', materialForm.materialType)
      formData.append('title', materialForm.title)
      formData.append('file', materialForm.file)

      await adminAPI.uploadMaterial(formData)
      toast.success('Material uploaded successfully!')
      setMaterialForm({
        topicId: '',
        materialType: 'pdf',
        title: '',
        file: null
      })
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse)
      }
    } catch (error) {
      console.error('Error uploading material:', error)
      toast.error(error.response?.data?.message || 'Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? All videos and materials will be removed.')) {
      return
    }

    try {
      await adminAPI.deleteTopic(topicId)
      toast.success('Topic deleted successfully!')
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse)
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      toast.error('Failed to delete topic')
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    try {
      setCreatingCourse(true)
      await adminAPI.createCourse(newCourseForm)
      toast.success('Course created successfully!')
      setNewCourseForm({
        title: '',
        description: '',
        faculty: '',
        department: '',
        level: '100',
        units: 3
      })
      setShowCreateCourse(false)
      fetchCourses()
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error(error.response?.data?.message || 'Failed to create course')
    } finally {
      setCreatingCourse(false)
    }
  }

  const filteredMessages = messages.filter(m => {
    if (messageFilter === 'all') return true
    return m.status === messageFilter
  })

  const unreadCount = messages.filter(m => m.status === 'unread').length

  // Sidebar menu sections — AdminLayout renders these as real navigation items
  const SECTIONS = [
    { key: 'overview', name: 'Overview', icon: 'dashboard' },
    { key: 'cbt', name: 'Scholarship Exam', icon: 'school', badge: cbtSubmissions.length },
    { key: 'messages', name: 'Messages', icon: 'mail', badge: unreadCount },
    { key: 'courses', name: 'Courses & Content', icon: 'menu_book' },
  ]

  if (loading) {
    return (
      <AdminLayout sections={SECTIONS} activeSection={activeTab} onSectionChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout sections={SECTIONS} activeSection={activeTab} onSectionChange={setActiveTab}>
      <div className="space-y-6">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Courses</span>
                <span className="text-2xl font-black text-gray-900">{courses.length}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">CBT Submissions</span>
                <span className="text-2xl font-black text-gray-900">{cbtSubmissions.length}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Unread Messages</span>
                <span className="text-2xl font-black text-gray-900">{unreadCount}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Exam Status</span>
                <span className={`text-sm font-black ${cbtConfig.isExamActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {cbtConfig.isExamActive ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Academic Season Panel */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold mb-2">Academic Season Control</h2>
              <p className="text-sm text-gray-500 mb-4">Toggle the current calendar phase of the university. This dynamically changes countdown deadlines and motivation types on student homepages.</p>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {['first-semester', 'second-semester', 'academic-break'].map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => handleSeasonChange(season)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${academicSeason === season ? 'bg-purple-brand text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {season === 'first-semester' ? 'First Semester' : season === 'second-semester' ? 'Second Semester' : 'Academic Break'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCHOLARSHIP EXAM TAB ── */}
        {activeTab === 'cbt' && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">100L Fellowship Alumni CBT Exam Controls</h2>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {cbtSubmissions.length} Submissions
                </span>
              </div>
              <p className="text-sm text-gray-500">Manage exam duration, set pools (Set A vs Set B), and view/export student leaderboard rankings.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchCbtLeaderboard}
                className="px-3.5 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Board
              </button>
              <button
                type="button"
                onClick={handleExportCbtCsv}
                className="px-4 py-2 bg-purple-brand text-white text-xs font-bold rounded-lg hover:bg-purple-800 shadow-sm transition-all"
              >
                Export CSV Results
              </button>
            </div>
          </div>

          {/* Config Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            {/* Active Question Set Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Active Question Pool (Damage Control)
              </label>
              <div className="flex gap-2">
                {['Set A', 'Set B'].map((set) => (
                  <button
                    key={set}
                    type="button"
                    onClick={() => handleUpdateCbtSettings({ activeSet: set })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      cbtConfig.activeSet === set
                        ? 'bg-purple-brand text-white border-purple-brand shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {set} {set === 'Set B' ? '(Backup Pool)' : '(Primary Pool)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Duration Control */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Exam Duration (Minutes)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={cbtConfig.durationMinutes || 45}
                  onChange={(e) => setCbtConfig({ ...cbtConfig, durationMinutes: parseInt(e.target.value) || 45 })}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateCbtSettings({ durationMinutes: Number(cbtConfig.durationMinutes) })}
                  className="px-3.5 py-1.5 bg-purple-brand text-white text-xs font-bold rounded-lg hover:bg-purple-800"
                >
                  Save Duration
                </button>
              </div>
            </div>

            {/* Exam Active Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Exam Active Status
              </label>
              <button
                type="button"
                onClick={() => handleUpdateCbtSettings({ isExamActive: !cbtConfig.isExamActive })}
                className={`w-full py-2 text-xs font-bold rounded-lg border transition-all ${
                  cbtConfig.isExamActive
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-rose-600 text-white border-rose-600'
                }`}
              >
                {cbtConfig.isExamActive ? '🟢 Exam Active (Students Can Take)' : '🔴 Exam Paused'}
              </button>
            </div>
          </div>

          {/* Scheduled Exam Window */}
          <div className="mb-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Scheduled Exam Window (Optional)
            </label>
            <p className="text-[11px] text-gray-500 mb-3">
              Restrict when students can <strong>start</strong> a fresh attempt, in addition to the Exam Active toggle above. Leave blank for no schedule restriction. Students already mid-exam can still finish after the window closes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Opens At</label>
                <input
                  type="datetime-local"
                  value={examWindow.start}
                  onChange={(e) => setExamWindow({ ...examWindow, start: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Closes At</label>
                <input
                  type="datetime-local"
                  value={examWindow.end}
                  onChange={(e) => setExamWindow({ ...examWindow, end: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveExamWindow}
                className="px-3.5 py-1.5 bg-purple-brand text-white text-xs font-bold rounded-lg hover:bg-purple-800"
              >
                Save Window
              </button>
              <button
                type="button"
                onClick={handleClearExamWindow}
                className="px-3.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200"
              >
                Clear Window
              </button>
              <span className="text-[11px] font-bold text-gray-500 ml-auto">
                {(() => {
                  if (!cbtConfig.examStartAt && !cbtConfig.examEndAt) return 'No schedule set — manual toggle only.'
                  const now = new Date()
                  if (cbtConfig.examStartAt && now < new Date(cbtConfig.examStartAt)) {
                    return `🕒 Opens ${new Date(cbtConfig.examStartAt).toLocaleString()}`
                  }
                  if (cbtConfig.examEndAt && now > new Date(cbtConfig.examEndAt)) {
                    return `🔒 Closed since ${new Date(cbtConfig.examEndAt).toLocaleString()}`
                  }
                  return '🟢 Within scheduled window'
                })()}
              </span>
            </div>
          </div>

          {/* Submissions Leaderboard Table */}
          {loadingCbt ? (
            <div className="py-8 text-center text-xs text-gray-500">Loading Candidate Submissions...</div>
          ) : cbtSubmissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
              No exam submissions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Matric No</th>
                    <th className="p-3">Dept &amp; Faculty</th>
                    <th className="p-3">Combo</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Pct</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                  {cbtSubmissions.map((sub, idx) => (
                    <tr key={sub._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-extrabold text-purple-900">#{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{sub.firstname} {sub.surname}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{sub.email}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-900 uppercase">{sub.matricNumber}</td>
                      <td className="p-3 max-w-[150px] truncate">{sub.department}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">{sub.combination}</span></td>
                      <td className="p-3 font-extrabold text-gray-900">{sub.score} / {sub.totalQuestions}</td>
                      <td className="p-3 font-bold text-emerald-700">{sub.percentage}%</td>
                      <td className="p-3">{Math.floor((sub.timeSpentSeconds || 0) / 60)}m {(sub.timeSpentSeconds || 0) % 60}s</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                          sub.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleResetCbtAttempt(sub._id, `${sub.firstname} ${sub.surname}`)}
                          className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold rounded border border-red-200 transition-colors"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Student Contact Messages</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Inquiries and feedback submitted via the homepage Contact Us form.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchMessages}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200"
              >
                Refresh
              </button>
              <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold">
                {['all', 'unread', 'read', 'resolved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setMessageFilter(f)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${messageFilter === f ? 'bg-purple-brand text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingMessages ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No contact messages found ({messageFilter !== 'all' ? `Filtered by: ${messageFilter}` : 'Empty inbox'}).
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                {filteredMessages.slice((msgPage - 1) * msgPerPage, msgPage * msgPerPage).map((msg) => (
                  <div
                    key={msg._id}
                    className={`p-4 rounded-xl border transition-all ${
                      msg.status === 'unread'
                        ? 'bg-purple-50/50 border-purple-200'
                        : msg.status === 'resolved'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">{msg.name}</span>
                        <span className="text-xs text-gray-500 font-mono">({msg.email})</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            msg.status === 'unread'
                              ? 'bg-purple-100 text-[#4B2E83] border border-purple-200'
                              : msg.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-800 mb-1">Subject: {msg.subject}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium bg-white/80 p-3 rounded-lg border border-gray-100 mb-3 whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(msg._id, 'read')}
                          className="px-3 py-1 bg-purple-100 text-[#4B2E83] text-xs font-bold rounded-lg hover:bg-purple-200"
                        >
                          Mark as Read
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(msg._id, 'resolved')}
                          className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={msgPage}
                totalPages={Math.ceil(filteredMessages.length / msgPerPage)}
                onPageChange={setMsgPage}
                totalItems={filteredMessages.length}
                itemsPerPage={msgPerPage}
                className="mt-4"
              />
            </div>
          )}
        </div>
        )}

        {/* ── COURSES & CONTENT TAB ── */}
        {activeTab === 'courses' && (
        <div className="space-y-6">
        {/* Manage Courses Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-xl font-bold mb-4">Manage Courses</h2>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No courses available. Create a course below.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course to View/Manage
                </label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    const courseId = e.target.value
                    if (courseId) {
                      fetchCourseDetails(courseId)
                    } else {
                      setSelectedCourse(null)
                      setCourseDetails(null)
                    }
                  }}
                  className="w-full md:w-auto min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title} ({course.level} Level)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {courseDetails && (
            <div className="mt-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Course Admin Access</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Course:</strong> {courseDetails.course.title}
                </p>
                <div className="mb-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Course ID (for course admin login):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedCourse}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCourse)
                        toast.success('Course ID copied to clipboard!')
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Share this Course ID with the course administrator. They can use it to login at{' '}
                  <span className="font-mono">/course-admin/login</span> (no token needed!)
                </p>
              </div>
              
              <h3 className="text-lg font-bold mb-4">Topics in {courseDetails.course.title}</h3>
              
              <div className="space-y-4">
                {courseDetails.topics.length > 0 ? (
                  courseDetails.topics.map((topic) => (
                    <div key={topic._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{topic.title}</h4>
                          {topic.description && (
                            <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTopic(topic._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Videos: {topic.videos.length}</p>
                        <p>Materials: {topic.materials?.length || 0}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No topics added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Course Section - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setShowCreateCourse(!showCreateCourse)}
            className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-bold">Create New Course</h2>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showCreateCourse ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showCreateCourse && (
            <div className="px-6 pb-6">
              <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={newCourseForm.title}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                    required
                    placeholder="e.g., Introduction to Mathematics (MTH 101)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <select
                    value={newCourseForm.level}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, level: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty *
                  </label>
                  <select
                    value={newCourseForm.faculty}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, faculty: e.target.value, department: '' })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map((fac) => (
                      <option key={fac.name} value={fac.name}>{fac.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={newCourseForm.department}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, department: e.target.value })}
                    required
                    disabled={!newCourseForm.faculty}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">Select Department</option>
                    {faculties.find((f) => f.name === newCourseForm.faculty)?.departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourseForm.units}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, units: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourseForm.description}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCourse}
                    className="px-4 py-2 bg-purple-brand text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
                  >
                    {creatingCourse ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Content Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Import YouTube Content */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Import YouTube Content</h2>
              <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportType('playlist')}
                  className={`px-3 py-1 rounded-md transition-all ${importType === 'playlist' ? 'bg-purple-brand text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Playlist
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('video')}
                  className={`px-3 py-1 rounded-md transition-all ${importType === 'video' ? 'bg-purple-brand text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Single Video
                </button>
              </div>
            </div>

            {importType === 'playlist' ? (
              <form onSubmit={handleImportPlaylist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Course *
                  </label>
                  <select
                    value={playlistForm.courseId}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, courseId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.level} Level)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic Title *
                  </label>
                  <input
                    type="text"
                    value={playlistForm.topicTitle}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, topicTitle: e.target.value })}
                    required
                    placeholder="e.g., Differential Calculus"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Playlist URL *
                  </label>
                  <input
                    type="url"
                    value={playlistForm.playlistUrl}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, playlistUrl: e.target.value })}
                    required
                    placeholder="https://www.youtube.com/playlist?list=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic Description
                  </label>
                  <textarea
                    value={playlistForm.topicDescription}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, topicDescription: e.target.value })}
                    placeholder="Optional description..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={importing}
                  className="w-full py-2 btn-purple text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Playlist'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleImportVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Course *
                  </label>
                  <select
                    value={videoForm.courseId}
                    onChange={(e) => setVideoForm({ ...videoForm, courseId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.level} Level)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic Title *
                  </label>
                  <input
                    type="text"
                    value={videoForm.topicTitle}
                    onChange={(e) => setVideoForm({ ...videoForm, topicTitle: e.target.value })}
                    required
                    placeholder="e.g., Introduction to Derivatives"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Video URL *
                  </label>
                  <input
                    type="url"
                    value={videoForm.videoUrl}
                    onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic Description
                  </label>
                  <textarea
                    value={videoForm.topicDescription}
                    onChange={(e) => setVideoForm({ ...videoForm, topicDescription: e.target.value })}
                    placeholder="Optional description..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={importing}
                  className="w-full py-2 btn-purple text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Video'}
                </button>
              </form>
            )}
          </div>

          {/* Upload Material Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Upload Study Material</h2>
            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Topic *
                </label>
                <select
                  value={materialForm.topicId}
                  onChange={(e) => setMaterialForm({ ...materialForm, topicId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a topic</option>
                  {courseDetails?.topics?.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                {!selectedCourse && (
                  <p className="text-xs text-gray-500 mt-1">Select a course first to see topics</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Type *
                </label>
                <select
                  value={materialForm.materialType}
                  onChange={(e) => setMaterialForm({ ...materialForm, materialType: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="past-question">Past Question</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  required
                  placeholder="e.g., MTH 101 Past Questions 2020"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File * (Max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedCourse}
                className="w-full py-2 btn-purple text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </form>
          </div>
        </div>
        </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
