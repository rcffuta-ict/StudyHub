import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { cbtAPI } from '../services/api'
import toast from 'react-hot-toast'

const Quizzes = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // 1. Core States
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [statusReason, setStatusReason] = useState('')
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [config, setConfig] = useState({ activeSet: 'Set A', durationMinutes: 45, isExamActive: true })

  // 2. Pre-quiz Form States
  const [matricNumber, setMatricNumber] = useState('')
  const [combination, setCombination] = useState('MPC') // 'MPC' or 'PCB'
  const [surname, setSurname] = useState('')
  const [firstname, setFirstname] = useState('')

  // 3. Active Exam States
  const [viewState, setViewState] = useState('setup') // 'setup', 'exam', 'result'
  const [questions, setQuestions] = useState([]) // All 75 secured questions
  const [activeSubject, setActiveSubject] = useState('') // e.g. 'Mathematics'
  const [activeSubtopicId, setActiveSubtopicId] = useState(1) // 1-5
  const [answers, setAnswers] = useState({}) // { questionId: 'A'|'B'|'C'|'D' }
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // 4. Results & Review States
  const [reviewQuestions, setReviewQuestions] = useState([])

  const timerRef = useRef(null)
  const answersRef = useRef(answers)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Initialize status check
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

      const response = await cbtAPI.getStatus()
      const data = response.data

      setEligible(data.eligible)
      setStatusReason(data.reason || '')
      if (data.config) setConfig(data.config)

      if (data.alreadyTaken) {
        setAlreadyTaken(true)
        setSubmission(data.submission)
        setViewState('result')
      } else if (data.hasActiveSession) {
        setSubmission(data.submission)
        setCombination(data.submission.combination)
        setMatricNumber(data.submission.matricNumber)
        // Resume session
        handleResumeExam(data.submission, data.remainingSeconds)
      }
    } catch (error) {
      console.error('CBT Status error:', error)
      toast.error('Failed to load scholarship examination status.')
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
        setActiveSubtopicId(1)

        // Load saved answers from submission
        const savedAnswers = subData.answers ? (subData.answers instanceof Map ? Object.fromEntries(subData.answers) : subData.answers) : {}
        setAnswers(savedAnswers)
        setTimeLeft(res.data.remainingSeconds || initialRemainingSecs)

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

    if (!matricNumber.trim()) {
      return toast.error('Please enter your Matriculation Number to begin.')
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
        setActiveSubtopicId(1)

        setAnswers({})
        setTimeLeft(res.data.remainingSeconds || (res.data.durationMinutes || 45) * 60)
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

    // Periodic draft sync every 20 seconds
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

  // Helper calculations for exam navigation
  const getSubjectList = () => {
    return combination === 'PCB' ? ['Physics', 'Chemistry', 'Biology'] : ['Mathematics', 'Physics', 'Chemistry']
  }

  const getSubtopicName = (subject, subId) => {
    const topics = {
      Mathematics: ['1. Geometry', '2. Algebra', '3. Set Theory', '4. Trigonometry', '5. Probability & Statistics'],
      Biology: ['1. Nutrition', '2. Genetics', '3. Ecology', '4. Animal Biology', '5. Plant Biology'],
      Physics: ['1. Classical Mechanics', '2. Heat & Energy', '3. Waves', '4. Electricity & Magnetism', '5. Modern Physics'],
      Chemistry: ['1. Basic Chemistry', '2. Inorganic Chemistry', '3. Physical Chemistry', '4. Organic Chemistry', '5. Radioactivity'],
    }
    return topics[subject]?.[subId - 1] || `Topic ${subId}`
  }

  const activeQuestions = questions.filter(
    (q) => q.subject === activeSubject && Number(q.subsection_id) === Number(activeSubtopicId)
  )

  const countAnsweredForSubject = (subj) => {
    const subjQs = questions.filter((q) => q.subject === subj)
    return subjQs.filter((q) => answers[q._id]).length
  }

  const countAnsweredForSubtopic = (subj, subId) => {
    const subQs = questions.filter((q) => q.subject === subj && Number(q.subsection_id) === Number(subId))
    return subQs.filter((q) => answers[q._id]).length
  }

  const totalAnsweredCount = Object.keys(answers).length

  return (
    <Layout activePage="quizzes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── 1. LOADING STATE ── */}
        {loading && (
          <div className="min-h-[450px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-sm">Loading Scholarship Assessment Portal...</p>
          </div>
        )}

        {/* ── 2. GUEST OR NON-100L RESTRICTION BANNER ── */}
        {!loading && !eligible && !alreadyTaken && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-sm my-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {statusReason === 'guest'
                ? 'This official RFUA Fellowship Alumni Scholarship examination is exclusively reserved for registered 100-Level StudyHub students. Please sign up or log in to participate.'
                : `This examination is restricted strictly to 100-Level students. Your account level is currently set to ${user?.level || 'unspecified'}L.`}
            </p>
            {statusReason === 'guest' ? (
              <div className="flex gap-4 justify-center">
                <Link to="/login" className="px-5 py-2.5 bg-gray-100 text-gray-800 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Log In
                </Link>
                <Link to="/signup" className="px-5 py-2.5 bg-purple-700 text-white font-bold rounded-xl text-sm hover:bg-purple-800 transition-colors shadow-md shadow-purple-700/20">
                  Create Free Account
                </Link>
              </div>
            ) : (
              <Link to="/dashboard" className="inline-flex px-5 py-2.5 bg-purple-700 text-white font-bold rounded-xl text-sm hover:bg-purple-800 transition-colors">
                Return to Dashboard
              </Link>
            )}
          </div>
        )}

        {/* ── 3. PRE-QUIZ SETUP VIEW ── */}
        {!loading && eligible && !alreadyTaken && viewState === 'setup' && (
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 uppercase tracking-wider"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">This serves as your unique candidate identifier for official score ranking.</p>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-700/25 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-base"
                >
                  <span>Launch Official Scholarship Examination</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── 4. ACTIVE CBT EXAM VIEW ── */}
        {!loading && viewState === 'exam' && (
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
                  Submit Exam ({totalAnsweredCount}/75)
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
                    onClick={() => {
                      setActiveSubject(subj)
                      setActiveSubtopicId(1)
                    }}
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

            {/* Level 2: Topic Subsection Sub-tabs (T1 - T5) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((subId) => {
                const subName = getSubtopicName(activeSubject, subId)
                const subAnsCount = countAnsweredForSubtopic(activeSubject, subId)
                const isActiveSub = Number(activeSubtopicId) === subId
                return (
                  <button
                    key={subId}
                    onClick={() => setActiveSubtopicId(subId)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isActiveSub
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActiveSub ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        T{subId}
                      </span>
                      <span className="text-[10px] font-extrabold text-gray-500">{subAnsCount}/5</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 truncate">{subName.split('. ')[1] || subName}</span>
                  </button>
                )
              })}
            </div>

            {/* Questions Container (5 questions for current active topic) */}
            <div className="space-y-4">
              {activeQuestions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 font-medium">
                  Loading questions for this section...
                </div>
              ) : (
                activeQuestions.map((q, idx) => {
                  const currentChoice = answers[q._id]
                  return (
                    <div key={q._id} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:border-purple-200 transition-colors">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <span className="inline-block px-3 py-1 bg-purple-50 text-purple-800 text-xs font-extrabold rounded-lg">
                          {q.subject} • {q.subsection_name} (Q{idx + 1} of 5)
                        </span>
                        {currentChoice && (
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            ✓ Answered ({currentChoice})
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-4 leading-relaxed">
                        {q.question_text}
                      </h4>

                      {/* Options Radio List */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {['A', 'B', 'C', 'D'].map((optKey) => {
                          const optionText = q.options?.[optKey]
                          if (!optionText) return null
                          const isSelected = currentChoice === optKey
                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() => handleSelectOption(q._id, optKey)}
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
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── 5. RESULTS & REVIEW VIEW ── */}
        {!loading && (alreadyTaken || viewState === 'result') && submission && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Score Overview Card */}
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
            </div>

            {/* Questions & Explanations Review Section */}
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
                  You have answered <strong>{totalAnsweredCount}</strong> out of <strong>75</strong> questions. Are you sure you want to finish now?
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

      </div>
    </Layout>
  )
}

export default Quizzes
