import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { cbtAPI } from '../services/api'
import AskStudyBuddy from '../components/AskStudyBuddy'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'

const Quizzes = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const is100LUser = Boolean(user && !user.isGuest && String(user.level || '').toLowerCase().includes('100'))

  // 1. Core CBT Scholarship States (For 100L)
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [config, setConfig] = useState({ activeSet: 'Set A', durationMinutes: 45, isExamActive: true })

  // 2. Pre-quiz Form States
  const [matricNumber, setMatricNumber] = useState('')
  const [combination, setCombination] = useState('MPC')
  const [surname, setSurname] = useState('')
  const [firstname, setFirstname] = useState('')

  // 3. Active Exam States
  const [viewState, setViewState] = useState('setup') // 'setup', 'exam', 'result'
  const [questions, setQuestions] = useState([])
  const [activeSubject, setActiveSubject] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // 4. Results & Review States
  const [reviewQuestions, setReviewQuestions] = useState([])

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
          setViewState('result')
        } else if (data.hasActiveSession) {
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

  // Start fresh CBT exam session
  const handleStartExam = async (e) => {
    e.preventDefault()

    if (!matricTouched || !isMatricValid) {
      return toast.error('Please enter a valid Matriculation Number (e.g., EEE/2026/1001) to begin.')
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

  const MATRIC_REGEX = /^[A-Z]{2,4}\/\d{4}\/\d{3,4}$/
  const isMatricValid = MATRIC_REGEX.test(matricNumber.trim())
  const matricTouched = !matricNumber.trim() || isMatricValid

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
    <Layout activePage="quizzes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── LOADING STATE ── */}
        {loading && (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-sm">Loading Quiz Portal...</p>
          </div>
        )}

        {/* ── 100L SCHOLARSHIP EXAM VIEW (For 100L Students) ── */}
        {!loading && is100LUser && (
          <>
            {/* SETUP VIEW FOR 100L */}
            {!alreadyTaken && viewState === 'setup' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#2c1854] via-[#4B2E83] to-[#5e3da1] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="max-w-3xl relative z-10 space-y-3">
                    <span className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-xs font-extrabold uppercase tracking-wider text-purple-200">
                      🎓 100-Level Fellowship Alumni Scholarship Exam
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight leading-snug">
                      RFUA 100L CBT Assessment Portal
                    </h1>
                    <p className="text-purple-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
                      Simulated JAMB Computer-Based Testing environment. High-stakes 45-minute timed examination covering 3 core subjects across 5 syllabus topics each (75 questions total).
                    </p>
                  </div>
                </div>

                {/* Registration Form Card */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h3 className="text-lg font-black text-gray-900 font-heading">Candidate Examination Entry</h3>
                    <p className="text-xs text-gray-500 font-medium">Verify your profile details and select your subject path to begin.</p>
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
                        placeholder="e.g. EEE/2026/1001"
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
                          ? 'Invalid format. Use e.g. EEE/2026/1001 (dept code / year / number).'
                          : 'Format: e.g. EEE/2026/1001. This serves as your unique candidate identifier for official score ranking.'}
                      </p>
                    </div>

                    {/* Rules Summary */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Important Examination Instructions:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 font-medium pl-1">
                        <li>Duration is strictly <strong>45:00 minutes</strong> (auto-submits on 00:00).</li>
                        <li>You have <strong>strictly 1 official attempt</strong> for this scholarship.</li>
                        <li>Answers automatically sync continuously. If your device reboots, you can resume seamlessly.</li>
                      </ul>
                    </div>

                    {/* Submit Action */}
                    {!config.isExamActive ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="w-full py-4 bg-gray-200 text-gray-400 font-extrabold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-none"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Examination Currently Locked (Coming Soon)</span>
                        </button>
                        <p className="text-center text-xs text-amber-700 font-semibold bg-amber-50 py-2 rounded-xl border border-amber-200/80">
                          🔒 The 100L Scholarship Examination is currently locked by the administrator. Development will resume soon!
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading || !matricTouched}
                        className={`w-full py-4 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-base ${
                          loading || !matricTouched
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-purple-700 hover:bg-purple-800 shadow-lg shadow-purple-700/25 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        <span>{!matricTouched ? 'Enter a valid Matriculation Number to Start' : 'Launch Official Scholarship Examination'}</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* ACTIVE EXAM VIEW FOR 100L */}
            {viewState === 'exam' && (
              <div className="space-y-5">
                {/* Top Fixed Control Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-sm shadow-xs">
                      100L
                    </div>
                    <div>
                      <h2 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                        RFUA Fellowship Scholarship Exam
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-0.5">
                        <span>Candidate: {surname} {firstname}</span>
                        <span>•</span>
                        <span className="text-purple-700 font-bold uppercase">{combination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl font-mono text-base sm:text-lg font-black border flex items-center gap-2 ${
                      timeLeft < 300
                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        : 'bg-gray-50 text-purple-900 border-purple-100'
                    }`}>
                      <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTimer(timeLeft)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                    >
                      Submit Exam ({totalAnsweredCount}/{orderedQuestions.length || 75})
                    </button>
                  </div>
                </div>

                {/* Level 1: Subject Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {getSubjectList().map((subj) => {
                    const ansCount = countAnsweredForSubject(subj)
                    const isActive = activeSubject === subj
                    return (
                      <button
                        key={subj}
                        onClick={() => goToSubject(subj)}
                        className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shrink-0 flex items-center gap-2 ${
                          isActive
                            ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span>{subj}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ansCount}/25
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Question Palette Grid (Answered vs Unanswered) */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Question Palette</h3>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Answered ({totalAnsweredCount})</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Current</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block" /> Unanswered ({orderedQuestions.length - totalAnsweredCount})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
                    {orderedQuestions.map((q, i) => {
                      const answered = Boolean(answers[q._id])
                      const isCurrent = i === currentQuestionIndex
                      return (
                        <button
                          key={q._id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(i)}
                          title={`Q${i + 1}: ${q.subject} — ${answered ? 'Answered' : 'Unanswered'}`}
                          className={`aspect-square rounded-lg text-[11px] font-black flex items-center justify-center border transition-all ${
                            isCurrent
                              ? 'bg-purple-700 text-white border-purple-800 scale-105 shadow-md shadow-purple-700/30'
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

                {/* Single Active Question (One-at-a-Time, JAMB-Style) */}
                <div className="space-y-4">
                  {!activeQuestion ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 font-medium">
                      Loading questions for this section...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={goPrevQuestion}
                          disabled={currentQuestionIndex === 0}
                          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ← Previous
                        </button>
                        <span className="text-xs sm:text-sm font-extrabold text-gray-800 bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl">
                          Question {currentQuestionIndex + 1} of {orderedQuestions.length}
                        </span>
                        <button
                          type="button"
                          onClick={goNextQuestion}
                          disabled={currentQuestionIndex === orderedQuestions.length - 1}
                          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Next →
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start mb-3 gap-3">
                          <span className="inline-block px-3 py-1 bg-purple-50 text-purple-800 text-xs font-extrabold rounded-lg">
                            {activeQuestion.subject} • {activeQuestion.subsection_name}
                          </span>
                          {answers[activeQuestion._id] && (
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              ✓ Answered ({answers[activeQuestion._id]})
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-4 leading-relaxed">
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
                  <span className="inline-block px-3.5 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-extrabold uppercase tracking-wider text-purple-200 mb-3">
                    🏆 Official Examination Result
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
                    <p className="text-sm font-bold text-emerald-200">
                      ✓ You have completed the scholarship examination.
                    </p>
                    <p className="text-xs text-purple-100/80 font-medium mt-1">
                      Your official result has been recorded and is not eligible for a retake. Thanks for participating!
                    </p>
                  </div>
                </div>

                {/* Per-Subject Score Breakdown */}
                {submission.subjectScores && Object.keys(submission.subjectScores).length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <h3 className="text-lg font-black text-gray-900 font-heading">Score by Subject</h3>
                      <p className="text-xs text-gray-500 font-medium">Your performance broken down across each subject in your combination.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(submission.subjectScores).map(([subj, s]) => (
                        <div key={subj} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-sm text-gray-900">{subj}</span>
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reviewQuestions.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-lg font-black text-gray-900 font-heading">Assessment Performance Review</h3>
                      <p className="text-xs text-gray-500 font-medium">Review correct options and detailed explanations for all questions.</p>
                    </div>

                    <div className="space-y-4">
                      {reviewQuestions.map((q, idx) => {
                        const studentAns = submission.answers?.[q._id] || submission.answers?.get?.(q._id)
                        const isCorrect = studentAns && studentAns.toUpperCase() === q.correct_option.toUpperCase()

                        return (
                          <div key={q._id} className="p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3 bg-gray-50/50">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-extrabold text-purple-800 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-md">
                                Q{idx + 1}. {q.subject} • {q.subsection_name}
                              </span>
                              <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                                isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isCorrect ? '✓ Correct' : `✗ Incorrect (Selected: ${studentAns || 'None'})`}
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
                                <span className="font-extrabold uppercase text-[10px] text-purple-800">Explanation:</span>
                                <p className="font-medium leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STANDARD PRACTICE QUIZZES VIEW (For 200L-500L Students & Guests) ── */}
        {!loading && !is100LUser && (
          <div className="space-y-6">
            {/* Informative Banner */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">RFUA 100L Scholarship Exam Active</h3>
                  <p className="text-xs text-gray-600 font-medium">The official Fellowship Scholarship assessment is currently live for 100-Level candidates. You can use this portal to practice course quizzes below!</p>
                </div>
              </div>
            </div>

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-purple-brand to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="max-w-2xl space-y-3 relative z-10">
                <span className="inline-block px-3 py-1 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider">
                  ⚡ Interactive Study Tools
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-gray-900">Need Custom Practice Questions?</h3>
                <p className="text-xs text-gray-500">Ask StudyBuddy AI to generate instant multiple-choice questions on any topic in your syllabus.</p>
              </div>
              <button
                type="button"
                onClick={() => openAiWithContext('Generate 5 multiple choice practice questions for my current level.')}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-brand to-purple-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all shrink-0"
              >
                🤖 Generate AI Practice Quiz
              </button>
            </div>

            {/* Practice History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-gray-900">Your Practice Attempt History</h3>

              {cbtHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
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
          </div>
        )}

        {/* ── SUBMIT CONFIRMATION MODAL ── */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          initialQuery={aiInitialQuery}
        />
      </div>
    </Layout>
  )
}

export default Quizzes
