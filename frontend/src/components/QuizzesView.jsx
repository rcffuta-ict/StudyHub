import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from './Layout'
import { useAuth } from '../context/AuthContext'
import { cbtAPI } from '../services/api'
import AskStudyBuddy from './AskStudyBuddy'
import Pagination from './Pagination'
import toast from 'react-hot-toast'

// Small reusable Material Symbols icon helper — keeps icon usage consistent
// and dependency-free (see .icon-sym in index.css / Google Fonts in index.html).
const Icon = ({ name, className = '' }) => (
  <span className={`icon-sym ${className}`} aria-hidden="true">{name}</span>
)

// Shared by the /quizzes page (practice hub, direct=false) and the /quizzes/rfua
// deep link (direct=true skips straight past the practice hub + enroll gate so a
// shared scholarship link lands 100L candidates directly on the entry form).
const QuizzesView = ({ direct = false }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const is100LUser = Boolean(user && !user.isGuest && String(user.level || '').toLowerCase().includes('100'))

  // Kept in sync with backend/src/controllers/cbtController.js UNLIMITED_RETAKE_EMAILS —
  // this account can start/retake the exam regardless of the admin lock or schedule window.
  const isUnlimitedAccessUser = String(user?.email || '').toLowerCase() === 'ayanogift@gmail.com'

  // 1. Core CBT Scholarship States (For 100L)
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [config, setConfig] = useState({ activeSet: 'Set A', durationMinutes: 45, isExamActive: true, examStartAt: null, examEndAt: null })

  // 2. Pre-quiz Form States
  const [enrolled, setEnrolled] = useState(direct)
  const [matricNumber, setMatricNumber] = useState('')
  const [combination, setCombination] = useState('MPC')
  const [surname, setSurname] = useState('')
  const [firstname, setFirstname] = useState('')

  // 3. Active Exam States
  const [viewState, setViewState] = useState('setup') // 'setup', 'exam', 'result'
  const [examOpen, setExamOpen] = useState(direct)
  const [questions, setQuestions] = useState([])
  const [activeSubject, setActiveSubject] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  // Which subject's topic dropdown is currently expanded (null = none)
  const [openTopicSubject, setOpenTopicSubject] = useState(null)
  // Collapsed by default so the question card is visible without scrolling on
  // mobile (where nearly all candidates take this exam) — one tap re-expands it.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [comingSoon, setComingSoon] = useState(false)

  // 4. Results & Review States
  const [reviewQuestions, setReviewQuestions] = useState([])
  const [openReviewSubject, setOpenReviewSubject] = useState(null)
  const [canRetake, setCanRetake] = useState(false)

  // 5. Practice CBT States (For Non-100L / General Practice)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [cbtHistory, setCbtHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const historyPerPage = 5
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiInitialQuery, setAiInitialQuery] = useState('')

  const timerRef = useRef(null)
  const answersRef = useRef(answers)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Close an open topic dropdown when clicking anywhere outside the subject tabs row
  useEffect(() => {
    if (!openTopicSubject) return
    const handleOutsideClick = (e) => {
      if (!document.getElementById('subject-tabs-row')?.contains(e.target)) {
        setOpenTopicSubject(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [openTopicSubject])

  // Load practice CBT history from localStorage
  useEffect(() => {
    const key = user?.email ? `studyhub_cbt_history_${user.email}` : 'studyhub_cbt_history_guest'
    const saved = localStorage.getItem(key)
    if (saved) {
      setCbtHistory(JSON.parse(saved))
    } else {
      setCbtHistory([])
    }
  }, [user])

  // Initialize CBT Status
  useEffect(() => {
    fetchStatus()
  }, [user])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      if (!user) {
        setLoading(false)
        return
      }

      // Auto-populate names from user profile
      const names = (user.fullName || '').trim().split(' ')
      setFirstname(names[0] || '')
      setSurname(names.length > 1 ? names.slice(-1)[0] : '')

      // Auto-select subject combination based on department/faculty
      const deptLower = (user.department || '').toLowerCase()
      const facultyLower = (user.faculty || '').toLowerCase()

      const isBioField =
        deptLower.includes('bio') ||
        deptLower.includes('med') ||
        deptLower.includes('nurs') ||
        deptLower.includes('anatomy') ||
        deptLower.includes('physiol') ||
        facultyLower.includes('health') ||
        facultyLower.includes('life') ||
        facultyLower.includes('clinical')

      setCombination(isBioField ? 'PCB' : 'MPC')

      if (is100LUser) {
        const response = await cbtAPI.getStatus()
        const data = response.data

        setEligible(data.eligible)
        if (data.config) setConfig(data.config)

        if (data.alreadyTaken) {
          setAlreadyTaken(true)
          setSubmission(data.submission)
          if (data.reviewQuestions) setReviewQuestions(data.reviewQuestions)
          setCanRetake(Boolean(data.canRetake))
          setExamOpen(true)
          setViewState('result')
        } else if (data.hasActiveSession) {
          setExamOpen(true)
          setSubmission(data.submission)
          setCombination(data.submission.combination)
          setMatricNumber(data.submission.matricNumber)
          handleResumeExam(data.submission, data.remainingSeconds)
        }
      }
    } catch (error) {
      console.error('CBT Status error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Resume active exam session
  const handleResumeExam = async (subData, initialRemainingSecs) => {
    try {
      setLoading(true)
      const res = await cbtAPI.startExam({
        matricNumber: subData.matricNumber,
        combination: subData.combination,
        surname: subData.surname,
        firstname: subData.firstname,
      })

      if (res.data.success) {
        setQuestions(res.data.questions)
        const activeSubj = subData.combination === 'PCB' ? 'Physics' : 'Mathematics'
        setActiveSubject(activeSubj)

        const savedAnswers = subData.answers ? (subData.answers instanceof Map ? Object.fromEntries(subData.answers) : subData.answers) : {}
        setAnswers(savedAnswers)
        setTimeLeft(res.data.remainingSeconds || initialRemainingSecs)
        setCurrentQuestionIndex(firstIndexForSubject(res.data.questions, activeSubj, savedAnswers))

        setViewState('exam')
        toast.success('Resumed your active scholarship exam session!')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resume exam session.')
    } finally {
      setLoading(false)
    }
  }

  // Start fresh CBT exam session. When the admin has the exam paused (via the
  // Scholarship Exam controls in the admin dashboard), launching is blocked and
  // the "Coming Soon" notice is shown instead.
  const handleStartExam = async (e) => {
    e.preventDefault()

    if (examLocked) {
      setComingSoon(true)
      return
    }

    if (!matricTouched || !isMatricValid) {
      return toast.error('Please enter a valid Matriculation Number (e.g., EEE/22/1001) to begin.')
    }

    setLoading(true)
    try {
      const res = await cbtAPI.startExam({
        matricNumber: matricNumber.trim().toUpperCase(),
        combination,
        surname,
        firstname,
      })

      if (res.data.success) {
        setSubmission(res.data.submission)
        setQuestions(res.data.questions)

        const defaultSubj = combination === 'PCB' ? 'Physics' : 'Mathematics'
        setActiveSubject(defaultSubj)

        setAnswers({})
        setTimeLeft(res.data.remainingSeconds || (res.data.durationMinutes || 45) * 60)
        setCurrentQuestionIndex(0)
        setViewState('exam')
        toast.success('Scholarship Assessment Started! Good luck!')
      }
    } catch (error) {
      console.error('Start Exam error:', error)
      toast.error(error.response?.data?.message || 'Failed to launch examination.')
    } finally {
      setLoading(false)
    }
  }

  // Unlimited-access accounts only: drop back to the entry form for a fresh attempt.
  // The server clears the previous completed submission when startExam is called next.
  const handleRetakeExam = () => {
    setAlreadyTaken(false)
    setSubmission(null)
    setReviewQuestions([])
    setOpenReviewSubject(null)
    setMatricNumber('')
    setAnswers({})
    setViewState('setup')
    toast.success('Unlimited access — enter your details to start a fresh attempt.')
  }

  // Timer & Periodic Background Auto-Sync Effect
  useEffect(() => {
    if (viewState !== 'exam' || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleFinalSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    const syncInterval = setInterval(() => {
      cbtAPI.syncDraft(answersRef.current).catch((err) => console.error('Draft sync err:', err))
    }, 20000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(syncInterval)
    }
  }, [viewState, timeLeft])

  // Select Option for Question
  const handleSelectOption = (questionId, optionKey) => {
    const updated = { ...answers, [questionId]: optionKey }
    setAnswers(updated)
    cbtAPI.syncDraft(updated).catch(() => {})
  }

  // Final Exam Submission
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setShowSubmitModal(false)

    try {
      const res = await cbtAPI.submitExam(answersRef.current)
      if (res.data.success) {
        setSubmission(res.data.submission)
        if (res.data.reviewQuestions) {
          setReviewQuestions(res.data.reviewQuestions)
        }
        setAlreadyTaken(true)
        setViewState('result')

        if (isAuto) {
          toast.error('Time elapsed! Your exam was automatically submitted.', { duration: 6000 })
        } else {
          toast.success('Scholarship Assessment submitted successfully!', { duration: 5000 })
        }
      }
    } catch (error) {
      console.error('Submit exam error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit exam.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const MATRIC_REGEX = /^[A-Z]{2,4}\/\d{2}\/\d{3,4}$/
  const isMatricValid = MATRIC_REGEX.test(matricNumber.trim())
  const matricTouched = !matricNumber.trim() || isMatricValid

  // Admin-scheduled exam window (in addition to the isExamActive toggle)
  const examStart = config.examStartAt ? new Date(config.examStartAt) : null
  const examEnd = config.examEndAt ? new Date(config.examEndAt) : null
  const windowNotStarted = Boolean(examStart && new Date() < examStart)
  const windowEnded = Boolean(examEnd && new Date() > examEnd)
  const examLocked = !isUnlimitedAccessUser && (!config.isExamActive || windowNotStarted || windowEnded)
  const formatWindowDate = (d) => d?.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

  const getSubjectList = () => {
    return combination === 'PCB' ? ['Physics', 'Chemistry', 'Biology'] : ['Mathematics', 'Physics', 'Chemistry']
  }

  // Ordered question list (server returns subject → subsection → id sorted)
  const orderedQuestions = questions
  const activeQuestion = orderedQuestions[currentQuestionIndex] || null

  const firstIndexForSubject = (questionList, targetSubject, answerMap) => {
    const list = questionList || []
    const answerRef = answerMap || answers
    const firstUnanswered = list.findIndex((q) => q.subject === targetSubject && !answerRef[q._id])
    if (firstUnanswered !== -1) return firstUnanswered
    const any = list.findIndex((q) => q.subject === targetSubject)
    return any === -1 ? 0 : any
  }

  const goToSubject = (subj) => {
    setActiveSubject(subj)
    setCurrentQuestionIndex(firstIndexForSubject(orderedQuestions, subj, answers))
  }

  // Ordered, de-duplicated list of syllabus topics (subsections) within a subject
  const getTopicsForSubject = (subj) => {
    const topics = []
    questions.forEach((q) => {
      if (q.subject === subj && !topics.includes(q.subsection_name)) topics.push(q.subsection_name)
    })
    return topics
  }

  const countAnsweredForTopic = (subj, topic) => {
    const topicQs = questions.filter((q) => q.subject === subj && q.subsection_name === topic)
    return topicQs.filter((q) => answers[q._id]).length
  }

  const goToTopic = (subj, topic) => {
    setActiveSubject(subj)
    const firstUnanswered = orderedQuestions.findIndex((q) => q.subject === subj && q.subsection_name === topic && !answers[q._id])
    if (firstUnanswered !== -1) {
      setCurrentQuestionIndex(firstUnanswered)
    } else {
      const any = orderedQuestions.findIndex((q) => q.subject === subj && q.subsection_name === topic)
      if (any !== -1) setCurrentQuestionIndex(any)
    }
    setOpenTopicSubject(null)
  }

  const goPrevQuestion = () => setCurrentQuestionIndex((i) => Math.max(0, i - 1))
  const goNextQuestion = () => setCurrentQuestionIndex((i) => Math.min(orderedQuestions.length - 1, i + 1))

  const countAnsweredForSubject = (subj) => {
    const subjQs = questions.filter((q) => q.subject === subj)
    return subjQs.filter((q) => answers[q._id]).length
  }

  const totalAnsweredCount = Object.keys(answers).length

  // Practice Quiz Pagination
  const indexOfLastHistory = historyPage * historyPerPage
  const indexOfFirstHistory = indexOfLastHistory - historyPerPage
  const currentHistoryPageItems = cbtHistory.slice(indexOfFirstHistory, indexOfLastHistory)

  const openAiWithContext = (query) => {
    setAiInitialQuery(query)
    setIsAiOpen(true)
  }

  return (
    <Layout activePage="quizzes" hideAi={viewState === 'exam'} focusMode={viewState === 'exam'}>
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 ${viewState === 'exam' ? 'py-2 sm:py-4' : 'py-6'}`}>

        {/* ── LOADING STATE ── */}
        {loading && (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-sm">Loading Quiz Portal...</p>
          </div>
        )}

        {/* ── 100L SCHOLARSHIP EXAM VIEW (For 100L Students) ── */}
        {!loading && is100LUser && examOpen && (
          <>
            {/* SETUP VIEW FOR 100L */}
            {!alreadyTaken && viewState === 'setup' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#2c1854] via-[#4B2E83] to-[#5e3da1] rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="max-w-3xl relative z-10 space-y-2.5 sm:space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wide sm:tracking-wider text-purple-200 max-w-full">
                      <Icon name="school" className="text-sm shrink-0" />
                      <span className="truncate sm:whitespace-normal">
                        <span className="sm:hidden">100L Scholarship Exam</span>
                        <span className="hidden sm:inline">100-Level Fellowship Alumni Scholarship Exam</span>
                      </span>
                    </span>
                    <h1 className="text-xl sm:text-4xl font-black font-heading tracking-tight leading-snug">
                      RFUA 100L CBT Assessment Portal
                    </h1>
                    <p className="text-purple-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
                      Simulated JAMB Computer-Based Testing environment. High-stakes 45-minute timed examination covering 3 core subjects across 5 syllabus topics each (75 questions total).
                    </p>
                  </div>
                </div>

                {/* Registration Form Card */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
                  {!enrolled ? (
                    <div className="flex flex-col items-center text-center space-y-4 py-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 flex items-center justify-center shadow-xs ring-1 ring-purple-100">
                        <Icon name="how_to_reg" className="text-3xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 font-heading">Enroll into the RFUA Quiz</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 max-w-sm">
                          Enroll to verify your identity with your matriculation number and launch the official scholarship examination.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEnrolled(true); setComingSoon(false) }}
                        className="px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-700/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 text-sm"
                      >
                        <Icon name="person_add" className="text-lg" />
                        Enroll into the RFUA Quiz
                      </button>
                    </div>
                  ) : (
                  <div>
                    <div className="border-b border-gray-100 pb-5 mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 font-heading">Candidate Examination Entry</h3>
                        <p className="text-xs text-gray-500 font-medium">Verify your profile details and select your subject path to begin.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEnrolled(false); setComingSoon(false) }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Icon name="chevron_left" className="text-base" />
                        Back
                      </button>
                    </div>

                  <form onSubmit={handleStartExam} className="space-y-5">
                    {/* Autofilled Student Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">First Name</label>
                        <input
                          type="text"
                          disabled
                          value={firstname}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Surname</label>
                        <input
                          type="text"
                          disabled
                          value={surname}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Department</label>
                        <input
                          type="text"
                          disabled
                          value={user?.department || '100L Student'}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Subject Combination Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Subject Combination <span className="text-purple-600 font-normal lowercase">(Auto-selected based on department)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label
                          onClick={() => setCombination('MPC')}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            combination === 'MPC'
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-extrabold text-sm text-gray-900">MPC Combination</span>
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${combination === 'MPC' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                              {combination === 'MPC' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Mathematics • Physics • Chemistry</p>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md w-fit">
                            Engineering, Physical &amp; CS
                          </span>
                        </label>

                        <label
                          onClick={() => setCombination('PCB')}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            combination === 'PCB'
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-extrabold text-sm text-gray-900">PCB Combination</span>
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${combination === 'PCB' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                              {combination === 'PCB' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Physics • Chemistry • Biology</p>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md w-fit">
                            Life, Clinical &amp; Medical Sciences
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Matriculation Number Input */}
                    <div>
                      <label htmlFor="matricNo" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Matriculation Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="matricNo"
                        type="text"
                        required
                        placeholder="e.g. EEE/22/1001"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 uppercase tracking-wider ${
                          !matricTouched
                            ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-gray-300 focus:border-purple-600 focus:ring-purple-600/10'
                        }`}
                      />
                      <p className={`text-[11px] mt-1 font-semibold ${!matricTouched ? 'text-red-600' : 'text-gray-400'}`}>
                        {!matricTouched
                          ? 'Invalid format. Use e.g. EEE/22/1001 (dept code / 2-digit year / number).'
                          : 'Format: e.g. EEE/22/1001 (dept code / 2-digit year / number). This serves as your unique candidate identifier for official score ranking.'}
                      </p>
                    </div>

                    {/* Rules Summary */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Icon name="info" className="text-base text-amber-600" />
                        Important Examination Instructions:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 font-medium pl-1">
                        <li>Duration is strictly <strong>45:00 minutes</strong> (auto-submits on 00:00).</li>
                        <li>You have <strong>strictly 1 official attempt</strong> for this scholarship.</li>
                        <li>Answers automatically sync continuously. If your device reboots, you can resume seamlessly.</li>
                        {examEnd && !windowEnded && (
                          <li>You must <strong>start</strong> your attempt before {formatWindowDate(examEnd)}.</li>
                        )}
                      </ul>
                    </div>

                    {/* Submit Action */}
                    {isUnlimitedAccessUser && (!config.isExamActive || windowNotStarted || windowEnded) && (
                      <p className="text-center text-xs text-purple-700 font-semibold bg-purple-50 py-2 rounded-xl border border-purple-200/80 flex items-center justify-center gap-1.5">
                        <Icon name="lock_open" className="text-sm" />
                        Admin lock/schedule bypassed — unlimited access for this account.
                      </p>
                    )}
                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-base bg-purple-700 hover:bg-purple-800 shadow-lg shadow-purple-700/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <span>{!matricTouched ? 'Enter a valid Matriculation Number to Start' : 'Launch Official Scholarship Examination'}</span>
                        <Icon name="arrow_forward" className="text-lg" />
                      </button>
                      {comingSoon && (
                        <p className="text-center text-xs font-bold text-purple-700 bg-purple-50 py-2.5 rounded-xl border border-purple-200/80 flex items-center justify-center gap-1.5">
                          <Icon name="hourglass_top" className="text-sm" />
                          {windowNotStarted
                            ? `Coming Soon — This exam opens on ${formatWindowDate(examStart)}. Please check back then.`
                            : windowEnded
                              ? 'Coming Soon — This examination window has closed.'
                              : 'Coming Soon — The scholarship examination is not available yet. Please check back later.'}
                        </p>
                      )}
                    </div>
                  </form>
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIVE EXAM VIEW FOR 100L */}
            {viewState === 'exam' && (
              <div className="space-y-3 sm:space-y-5">
                {/* Top Fixed Control Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-2.5 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 sticky top-2 sm:top-4 z-40">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0">
                      100L
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-xs sm:text-base text-gray-900 leading-tight truncate">
                        RFUA Fellowship Scholarship Exam
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 font-semibold mt-0.5 truncate">
                        <span className="truncate">Candidate: {surname} {firstname}</span>
                        <span>•</span>
                        <span className="text-purple-700 font-bold uppercase">{combination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-mono text-sm sm:text-lg font-black border flex items-center justify-center gap-2 ${
                      timeLeft < 300
                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        : 'bg-gray-50 text-purple-900 border-purple-100'
                    }`}>
                      <Icon name="schedule" className="text-base sm:text-lg text-purple-700" />
                      <span>{formatTimer(timeLeft)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-4 sm:px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all whitespace-nowrap"
                    >
                      Submit ({totalAnsweredCount}/{orderedQuestions.length || 75})
                    </button>
                  </div>
                </div>

                {/* Level 1: Subject Tabs — each has a dropdown to jump straight to a topic */}
                <div id="subject-tabs-row" className="space-y-2">
                  <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
                    {getSubjectList().map((subj) => {
                      const ansCount = countAnsweredForSubject(subj)
                      const isActive = activeSubject === subj
                      const isDropdownOpen = openTopicSubject === subj
                      const hasTopics = getTopicsForSubject(subj).length > 0
                      return (
                        <div
                          key={subj}
                          className={`flex items-stretch rounded-2xl font-extrabold text-xs sm:text-sm transition-all shrink-0 overflow-hidden ${
                            isActive
                              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                              : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => goToSubject(subj)}
                            className={`px-3.5 py-2 sm:px-5 sm:py-3 flex items-center gap-1.5 sm:gap-2 transition-colors ${
                              isActive ? 'hover:bg-purple-800' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span>{subj}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {ansCount}/25
                            </span>
                          </button>
                          {hasTopics && (
                            <button
                              type="button"
                              onClick={() => setOpenTopicSubject(isDropdownOpen ? null : subj)}
                              aria-label={`View ${subj} topics`}
                              aria-expanded={isDropdownOpen}
                              className={`px-2 sm:px-2.5 flex items-center border-l transition-colors ${
                                isActive ? 'border-white/20 hover:bg-purple-800' : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <Icon name="expand_more" className={`text-base sm:text-lg transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Topic dropdown panel — sits below the tabs row so it never gets
                      clipped by the row's horizontal scroll container */}
                  {openTopicSubject && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 bg-gray-50/70">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{openTopicSubject} Topics</span>
                        <button
                          type="button"
                          onClick={() => setOpenTopicSubject(null)}
                          aria-label="Close topics list"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Icon name="close" className="text-base" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1.5 max-h-64 overflow-y-auto">
                        {getTopicsForSubject(openTopicSubject).map((topic) => {
                          const topicTotal = questions.filter((q) => q.subject === openTopicSubject && q.subsection_name === topic).length
                          const topicAnswered = countAnsweredForTopic(openTopicSubject, topic)
                          const isCurrentTopic = activeQuestion?.subject === openTopicSubject && activeQuestion?.subsection_name === topic
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => goToTopic(openTopicSubject, topic)}
                              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                                isCurrentTopic ? 'bg-purple-50 text-purple-800' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="truncate">{topic}</span>
                              <span className={`text-[10px] font-black shrink-0 ${isCurrentTopic ? 'text-purple-600' : 'text-gray-400'}`}>
                                {topicAnswered}/{topicTotal}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Active Question (One-at-a-Time, JAMB-Style) */}
                <div className="space-y-3 sm:space-y-4">
                  {!activeQuestion ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 font-medium">
                      Loading questions for this section...
                    </div>
                  ) : (
                    <>
                      {/* Topic Banner */}
                      <div className="bg-gradient-to-r from-[#2c1854] to-[#4B2E83] rounded-2xl px-3.5 sm:px-5 py-3 sm:py-3.5 text-white shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-purple-200 font-bold">Current Topic</p>
                            <p className="font-extrabold text-xs sm:text-sm leading-tight truncate">
                              {activeQuestion.subject} • {activeQuestion.subsection_name}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-white/15 border border-white/20 rounded-lg text-[11px] font-black whitespace-nowrap">
                          {currentQuestionIndex + 1}/{orderedQuestions.length}
                        </span>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:border-purple-200 transition-colors">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 leading-relaxed">
                          {activeQuestion.question_text}
                        </h4>

                        <div className="grid grid-cols-1 gap-2.5">
                          {['A', 'B', 'C', 'D'].map((optKey) => {
                            const optionText = activeQuestion.options?.[optKey]
                            if (!optionText) return null
                            const isSelected = answers[activeQuestion._id] === optKey
                            return (
                              <button
                                key={optKey}
                                type="button"
                                onClick={() => handleSelectOption(activeQuestion._id, optKey)}
                                className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold shadow-xs'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {optKey}
                                </span>
                                <span className="mt-0.5 leading-snug">{optionText}</span>
                              </button>
                            )
                          })}
                        </div>

                        {/* Question number under question */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="text-xs font-extrabold text-gray-500">
                            Q{currentQuestionIndex + 1}
                          </span>
                          {answers[activeQuestion._id] && (
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <Icon name="check_circle" className="text-sm" />
                              Answered ({answers[activeQuestion._id]})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prev / Next below question */}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goPrevQuestion}
                          disabled={currentQuestionIndex === 0}
                          className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                        >
                          <Icon name="chevron_left" className="text-base" />
                          Previous
                        </button>
                        <span className="text-[11px] sm:text-xs font-bold text-gray-400 sm:hidden">
                          {currentQuestionIndex + 1}/{orderedQuestions.length}
                        </span>
                        <button
                          type="button"
                          onClick={goNextQuestion}
                          disabled={currentQuestionIndex === orderedQuestions.length - 1}
                          className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                        >
                          Next
                          <Icon name="chevron_right" className="text-base" />
                        </button>
                      </div>

                      {/* Question Palette Grid (collapsible + compact) — below question nav */}
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPaletteOpen((o) => !o)}
                          className="w-full flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 hover:bg-gray-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="chevron_right" className={`text-base text-purple-700 transition-transform ${paletteOpen ? 'rotate-90' : ''}`} />
                            <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Question Palette</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> {totalAnsweredCount}</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block" /> {orderedQuestions.length - totalAnsweredCount}</span>
                          </div>
                        </button>

                        {paletteOpen && (
                          <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 pt-3">
                            <div className="grid grid-cols-10 sm:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(25,minmax(0,1fr))] gap-1">
                              {orderedQuestions.map((q, i) => {
                                const answered = Boolean(answers[q._id])
                                const isCurrent = i === currentQuestionIndex
                                return (
                                  <button
                                    key={q._id}
                                    type="button"
                                    onClick={() => setCurrentQuestionIndex(i)}
                                    title={`Q${i + 1}: ${q.subject} — ${answered ? 'Answered' : 'Unanswered'}`}
                                    className={`aspect-square rounded-md text-[9px] sm:text-[10px] font-black flex items-center justify-center border transition-all ${
                                      isCurrent
                                        ? 'bg-purple-700 text-white border-purple-800 shadow-sm shadow-purple-700/30'
                                        : answered
                                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-400 hover:text-purple-700'
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* RESULTS VIEW FOR 100L */}
            {(alreadyTaken || viewState === 'result') && submission && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-[#2c1854] to-[#4B2E83] rounded-3xl p-6 sm:p-10 text-white shadow-xl text-center relative overflow-hidden">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-extrabold uppercase tracking-wider text-purple-200 mb-3">
                    <Icon name="emoji_events" className="text-sm" />
                    Official Examination Result
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-heading mb-1">
                    {submission.firstname} {submission.surname}
                  </h2>
                  <p className="text-xs text-purple-200 font-semibold mb-6">
                    Matric: {submission.matricNumber} • Dept: {submission.department} ({submission.combination})
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 rounded-2xl">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-200">Score</span>
                      <span className="text-2xl sm:text-3xl font-black text-white">{submission.score} / {submission.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-200">Percentage</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400">{submission.percentage}%</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-200">Time Spent</span>
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {Math.floor((submission.timeSpentSeconds || 0) / 60)}m {(submission.timeSpentSeconds || 0) % 60}s
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 max-w-xl mx-auto bg-emerald-50/20 border border-emerald-300/30 rounded-2xl p-4">
                    <p className="text-sm font-bold text-emerald-200 flex items-center justify-center gap-1.5">
                      <Icon name="check_circle" className="text-base" />
                      You have completed the scholarship examination.
                    </p>
                    <p className="text-xs text-purple-100/80 font-medium mt-1">
                      {canRetake
                        ? 'Your official result has been recorded. Thanks for participating!'
                        : 'Your official result has been recorded and is not eligible for a retake. Thanks for participating!'}
                    </p>
                  </div>

                  {canRetake && (
                    <button
                      type="button"
                      onClick={handleRetakeExam}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-extrabold uppercase tracking-wide rounded-full transition-colors"
                    >
                      <Icon name="replay" className="text-base" />
                      Retake Exam (Unlimited Access)
                    </button>
                  )}
                </div>

                {/* Per-Subject Score Breakdown — click a subject to review its questions */}
                {submission.subjectScores && Object.keys(submission.subjectScores).length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    <div className="border-b border-gray-100 pb-4 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 flex items-center justify-center shrink-0 ring-1 ring-purple-100">
                        <Icon name="bar_chart" className="text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 font-heading">Score by Subject</h3>
                        <p className="text-xs text-gray-500 font-medium">Click a subject to review which questions you got right and which you missed.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(submission.subjectScores).map(([subj, s]) => {
                        const isOpen = openReviewSubject === subj
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => setOpenReviewSubject(isOpen ? null : subj)}
                            aria-expanded={isOpen}
                            className={`text-left p-4 rounded-2xl border transition-colors ${
                              isOpen ? 'border-purple-300 bg-purple-50/70 ring-1 ring-purple-200' : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/70'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1">
                                {subj}
                                <Icon name="expand_more" className={`text-base text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </span>
                              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                s.correct / s.total >= 0.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {s.correct}/{s.total}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.correct / s.total >= 0.5 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.round((s.correct / s.total) * 100)}%` }}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {openReviewSubject && (
                      <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-black text-gray-900 font-heading">
                          <Icon name="fact_check" className="text-lg text-purple-700" />
                          {openReviewSubject} — Question Review
                        </div>

                        {reviewQuestions.filter((q) => q.subject === openReviewSubject).length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                            Review data isn't available for this subject.
                          </p>
                        ) : (
                          reviewQuestions
                            .filter((q) => q.subject === openReviewSubject)
                            .map((q, idx) => {
                              const studentAns = submission.answers?.[q._id] || submission.answers?.get?.(q._id)
                              const isCorrect = studentAns && studentAns.toUpperCase() === q.correct_option.toUpperCase()

                              return (
                                <div key={q._id} className="p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3 bg-gray-50/50">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs font-extrabold text-purple-800 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-md">
                                      Q{idx + 1}. {q.subsection_name}
                                    </span>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      <Icon name={isCorrect ? 'check_circle' : 'cancel'} className="text-sm" />
                                      {isCorrect ? 'Correct' : `Incorrect (Selected: ${studentAns || 'None'})`}
                                    </span>
                                  </div>

                                  <p className="text-sm font-bold text-gray-900">{q.question_text}</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                                    {['A', 'B', 'C', 'D'].map((optKey) => {
                                      const isRight = q.correct_option === optKey
                                      const isChosen = studentAns === optKey
                                      return (
                                        <div
                                          key={optKey}
                                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                            isRight
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                              : isChosen
                                              ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                              : 'bg-white border-gray-200 text-gray-600'
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded text-[11px] font-black flex items-center justify-center ${
                                            isRight ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {optKey}
                                          </span>
                                          <span>{q.options[optKey]}</span>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {q.explanation && (
                                    <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-xl text-xs text-purple-950 space-y-1">
                                      <span className="font-extrabold uppercase text-[10px] text-purple-800 flex items-center gap-1">
                                        <Icon name="lightbulb" className="text-sm" />
                                        Explanation:
                                      </span>
                                      <p className="font-medium leading-relaxed">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STANDARD PRACTICE QUIZZES VIEW (For 200L-500L Students, Guests & 100L Landing) ── */}
        {!loading && !(is100LUser && examOpen) && (
          <div className="space-y-6">
            {/* Informative Banner */}
            {!is100LUser && (
              <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 flex items-center justify-center shrink-0 ring-1 ring-purple-100">
                    <Icon name="campaign" className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">RFUA 100L Scholarship Exam Active</h3>
                    <p className="text-xs text-gray-600 font-medium">The official Fellowship Scholarship assessment is currently live for 100-Level candidates. You can use this portal to practice course quizzes below!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-purple-brand to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="max-w-2xl space-y-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Icon name="bolt" className="text-sm" />
                  Interactive Study Tools
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
                  CBT Practice Quizzes &amp; AI Generator
                </h1>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                  Test your understanding across your registered courses, take timed mock assessments, or generate instant practice questions with AI.
                </p>
              </div>
            </div>

            {/* AI Generator Launcher */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-50 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4B2E83] to-[#5e3da1] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
                  <Icon name="auto_awesome" className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Need Custom Practice Questions?</h3>
                  <p className="text-xs text-gray-500">Ask StudyBuddy AI to generate instant multiple-choice questions on any topic in your syllabus.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openAiWithContext('Generate 5 multiple choice practice questions for my current level.')}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-brand to-purple-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all shrink-0 flex items-center gap-1.5 relative z-10"
              >
                <Icon name="auto_awesome" className="text-base" />
                Generate AI Practice Quiz
              </button>
            </div>

            {/* Practice History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Icon name="history" className="text-lg text-purple-700" />
                Your Practice Attempt History
              </h3>

              {cbtHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-2">
                  <Icon name="quiz" className="text-2xl text-gray-300" />
                  No practice attempt history recorded yet. Use the AI Practice Quiz generator above to get started!
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="p-3">Course / Topic</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Percentage</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                        {currentHistoryPageItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900">{item.course}</td>
                            <td className="p-3 font-mono">{item.score}</td>
                            <td className="p-3 font-bold text-purple-700">{item.percentage}%</td>
                            <td className="p-3 text-gray-400 font-normal">{new Date(item.id).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={historyPage}
                    totalItems={cbtHistory.length}
                    itemsPerPage={historyPerPage}
                    onPageChange={setHistoryPage}
                  />
                </>
              )}
            </div>

            {/* RFUA Scholarship Launch Button (100L Landing) */}
            {is100LUser && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setExamOpen(true)}
                  className="animate-oscillate px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#2c1854] via-[#4B2E83] to-[#5e3da1] text-white font-black rounded-2xl text-sm sm:text-base flex items-center gap-3 hover:from-[#351f66] hover:to-[#4B2E83] transition-colors"
                >
                  <Icon name="emoji_events" className="text-xl sm:text-2xl text-purple-200" />
                  RFUA Scholarship
                  <Icon name="arrow_forward" className="text-xl sm:text-2xl text-purple-200" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMIT CONFIRMATION MODAL ── */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 flex items-center justify-center mx-auto ring-1 ring-purple-100">
                <Icon name="task_alt" className="text-2xl" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-gray-900 font-heading">Submit Examination?</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  You have answered <strong>{totalAnsweredCount}</strong> out of <strong>{orderedQuestions.length || 75}</strong> questions. Are you sure you want to finish now?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors"
                >
                  Return to Exam
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-purple-700 text-white font-extrabold rounded-xl text-xs hover:bg-purple-800 shadow-md shadow-purple-700/20 transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Final Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI StudyBuddy Drawer */}
        <AskStudyBuddy
          isOpen={viewState !== 'exam' && isAiOpen}
          onClose={() => setIsAiOpen(false)}
          initialQuery={aiInitialQuery}
        />
      </div>
    </Layout>
  )
}

export default QuizzesView
