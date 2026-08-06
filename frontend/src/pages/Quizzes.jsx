import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import GuestRestrictionModal from '../components/GuestRestrictionModal'
import AskStudyBuddy from '../components/AskStudyBuddy'
import Pagination from '../components/Pagination'
import { academicQuestions, techQuestions } from '../utils/quizQuestions'
import toast from 'react-hot-toast'

const Quizzes = () => {
  const { user } = useAuth()
  const [viewState, setViewState] = useState('setup') // 'setup', 'exam', 'result'
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false)
  const [restrictAction, setRestrictAction] = useState('')

  // 1. CBT Setup Configs
  const [matricNo, setMatricNo] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [cbtHistory, setCbtHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const historyPerPage = 5

  // 2. Exam States
  const [questions, setQuestions] = useState([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(0)
  const [examActive, setExamActive] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTimeStr, setElapsedTimeStr] = useState('')

  // 3. Result States
  const [score, setScore] = useState(0)
  const [percentage, setPercentage] = useState(0)

  // 4. AI Ask Panel State
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiInitialQuery, setAiInitialQuery] = useState('')

  const answersRef = useRef(answers)
  const questionsRef = useRef(questions)
  const startTimeRef = useRef(startTime)
  const selectedCourseRef = useRef(selectedCourse)
  const userRef = useRef(user)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  useEffect(() => {
    startTimeRef.current = startTime
  }, [startTime])

  useEffect(() => {
    selectedCourseRef.current = selectedCourse
  }, [selectedCourse])

  useEffect(() => {
    userRef.current = user
  }, [user])

  // Load history from localStorage
  useEffect(() => {
    const key = user?.email ? `studyhub_cbt_history_${user.email}` : 'studyhub_cbt_history_guest'
    const saved = localStorage.getItem(key)
    if (saved) {
      setCbtHistory(JSON.parse(saved))
    } else {
      setCbtHistory([])
    }
  }, [user])

  const saveCbtAttempt = (attempt) => {
    const key = user?.email ? `studyhub_cbt_history_${user.email}` : 'studyhub_cbt_history_guest'
    const updated = [attempt, ...cbtHistory]
    localStorage.setItem(key, JSON.stringify(updated))
    setCbtHistory(updated)

    if (user?.isGuest) {
      const guestCounter = parseInt(localStorage.getItem('studyhub_guest_cbt_count') || '0')
      localStorage.setItem('studyhub_guest_cbt_count', (guestCounter + 1).toString())
    }
  }

  // Timer Effect
  useEffect(() => {
    if (!examActive || timeLeft <= 0) {
      if (examActive && timeLeft === 0) {
        handleExamSubmit(true)
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [examActive, timeLeft])

  const handleStartCbt = (e) => {
    e.preventDefault()

    if (!selectedCourse) {
      toast.error('Please select an examination course')
      return
    }

    // Guest Restriction Check
    if (user?.isGuest) {
      const guestCount = parseInt(localStorage.getItem('studyhub_guest_cbt_count') || '0')
      if (guestCount >= 1) {
        setRestrictAction('take unlimited CBT mock exams')
        setIsRestrictModalOpen(true)
        return
      }
    }

    let sourcePool = academicQuestions
    if (selectedCourse === 'tech-news') {
      sourcePool = techQuestions
    }

    // Shuffle and pick 10 questions for quick simulation
    const shuffled = [...sourcePool].sort(() => 0.5 - Math.random()).slice(0, 10)
    
    setQuestions(shuffled)
    setAnswers({})
    setCurrentQuestionIdx(0)
    setTimeLeft(10 * 60) // 10 Minutes default
    setStartTime(Date.now())
    setExamActive(true)
    setViewState('exam')
    toast.success('Exam session initialized! Timer started.')
  }

  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers({
      ...answers,
      [questionId]: optionIdx
    })
  }

  const handleExamSubmit = (isAuto = false) => {
    setExamActive(false)
    setShowSubmitConfirm(false)

    const currentStartTime = startTimeRef.current || Date.now()
    const currentQuestions = questionsRef.current
    const currentAnswers = answersRef.current
    const currentSelectedCourse = selectedCourseRef.current
    const currentUser = userRef.current

    const end = Date.now()
    const elapsedSeconds = Math.floor((end - currentStartTime) / 1000)
    const elapsedMins = Math.floor(elapsedSeconds / 60)
    const remainingSecs = elapsedSeconds % 60
    const timeSpent = `${elapsedMins}m ${remainingSecs}s`
    setElapsedTimeStr(timeSpent)

    let correctCount = 0
    currentQuestions.forEach(q => {
      if (currentAnswers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })

    const pct = Math.round((correctCount / currentQuestions.length) * 100)
    setScore(correctCount)
    setPercentage(pct)

    saveCbtAttempt({
      id: Date.now(),
      course: currentSelectedCourse === 'tech-news' ? `Tech Insights (${currentUser?.department || 'Tech'})` : currentSelectedCourse,
      score: `${correctCount}/${currentQuestions.length}`,
      percentage: pct,
      date: new Date().toLocaleDateString(),
      timeSpent
    })

    setViewState('result')
    if (isAuto) {
      toast.error('Time is up! Your exam has been automatically submitted.')
    } else {
      toast.success('Exam submitted successfully!')
    }
  }

  const handleAskBuddyAboutQuestion = (q, selectedOptIdx) => {
    let contextStr = `Question: "${q.question}"\n`
    q.options.forEach((opt, idx) => {
      contextStr += `${String.fromCharCode(65 + idx)}. ${opt}\n`
    })
    contextStr += `Correct Answer: ${String.fromCharCode(65 + q.correctAnswer)} (${q.options[q.correctAnswer]})\n`
    if (selectedOptIdx !== undefined) {
      contextStr += `My Selected Answer: ${String.fromCharCode(65 + selectedOptIdx)} (${q.options[selectedOptIdx]})\n`
    }
    contextStr += `Please explain why this answer is correct and break down the solution step-by-step.`

    setAiInitialQuery(contextStr)
    setIsAiOpen(true)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalHistoryPages = Math.ceil(cbtHistory.length / historyPerPage)
  const paginatedHistory = cbtHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        
        {/* VIEW 1: CBT LOGIN / SETUP SCREEN */}
        {viewState === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Simulation Login Card */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-205 border-t-8 border-purple-brand overflow-hidden">
              <div className="bg-purple-brand p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-sm sm:text-base">PRE-CBT PRACTICE SIMULATOR</span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-brand px-2 py-0.5 rounded font-bold">SIMULATION ENGINE</span>
              </div>

              <form onSubmit={handleStartCbt} className="p-6 space-y-5 bg-white">
                <div className="bg-purple-50 border-l-4 border-purple-brand p-4 text-sm text-purple-900">
                  <p className="font-semibold">Important Instruction:</p>
                  <p className="mt-1">Please enter your matriculation details and select a course below to simulate FUTA's CBT environment. Guest users are limited to 1 trial exam.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Matriculation Number / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. CPT/19/4021"
                    value={matricNo}
                    onChange={(e) => setMatricNo(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Optional for practice mode. Stored only in local session memory.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Select Examination Course *</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-semibold"
                    required
                  >
                    <option value="">-- Choose Course for Practice --</option>
                    <option value="MTH 101 – Calculus & Algebra">MTH 101 – Calculus & Algebra (100L)</option>
                    <option value="PHY 101 – General Physics I">PHY 101 – General Physics I (100L)</option>
                    <option value="CHM 101 – General Chemistry">CHM 101 – General Chemistry (100L)</option>
                    <option value="GST 111 – Use of English">GST 111 – Use of English (100L)</option>
                    <option value="EEE 201 – Circuit Theory I">EEE 201 – Circuit Theory I (200L)</option>
                    <option value="CSC 201 – Programming Fundamentals">CSC 201 – Programming Fundamentals (200L)</option>
                    <option value="tech-news">Special: Technology & CS General Knowledge</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-gray-500 font-medium">
                    <span>Format: </span>
                    <span className="font-bold text-gray-800">10 Questions • 10 Minutes</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 btn-purple text-white font-extrabold text-sm rounded-xl hover:bg-purple-700 transition-all shadow-md active:scale-95"
                  >
                    Launch Examination →
                  </button>
                </div>
              </form>
            </div>

            {/* Instructions Sidebar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-base">CBT Rules & Tips</h3>
                <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-brand font-bold">✓</span>
                    <span>All questions carry equal marks. No negative marking applied.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-brand font-bold">✓</span>
                    <span>You can navigate back and forth between questions before submitting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-brand font-bold">✓</span>
                    <span>The countdown timer starts immediately. Exams auto-submit upon expiry.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-brand font-bold">✓</span>
                    <span>Use the question grid numbers on the side to navigate non-sequentially.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                <span className="font-semibold block text-gray-500">STUDYHUB CBT CENTER</span>
                <span>Standardized Simulation Engine</span>
              </div>
            </div>

            {/* CBT Attempt History */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">CBT Exam Attendance & Score Log</h3>
              {cbtHistory.length > 0 ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                          <th className="py-2.5 px-4">Exam/Course</th>
                          <th className="py-2.5 px-4">Score</th>
                          <th className="py-2.5 px-4">Percentage</th>
                          <th className="py-2.5 px-4">Time Spent</th>
                          <th className="py-2.5 px-4">Date Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistory.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{item.course}</td>
                            <td className="py-2.5 px-4 font-bold text-purple-brand">{item.score}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-gray-600">{item.timeSpent}</td>
                            <td className="py-2.5 px-4 text-gray-500">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={historyPage}
                    totalPages={totalHistoryPages}
                    onPageChange={setHistoryPage}
                    totalItems={cbtHistory.length}
                    itemsPerPage={historyPerPage}
                    className="mt-4"
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No CBT attempts logged. Jump in to get your first practice score!
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: CBT EXAM INTERFACE SCREEN */}
        {viewState === 'exam' && (
          <div className="flex flex-col gap-4">
            
            {/* Purple Header Panel */}
            <div className="bg-purple-brand text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200 block">Current Exam Paper</span>
                <h2 className="text-xl sm:text-2xl font-black">{selectedCourse || 'General Academic Assessment'}</h2>
                <p className="text-xs text-purple-200 mt-0.5">Candidate: {matricNo || user?.name || 'Student Candidate'}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20">
                  <span className="text-[10px] uppercase font-extrabold text-purple-200 block">Time Remaining</span>
                  <span className={`text-xl sm:text-2xl font-mono font-black ${timeLeft < 120 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Submit Paper
                </button>
              </div>
            </div>

            {/* Exam Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Question Box */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[420px]">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <span className="text-xs font-black text-purple-brand uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {answers[questions[currentQuestionIdx]?.id] !== undefined ? '✓ Answered' : '○ Pending'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-relaxed font-sans mb-6">
                    {questions[currentQuestionIdx]?.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {questions[currentQuestionIdx]?.options.map((optText, optIdx) => {
                      const curQId = questions[currentQuestionIdx].id
                      const isSelected = answers[curQId] === optIdx

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(curQId, optIdx)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#4B2E83] bg-purple-50 text-[#4B2E83] shadow-sm'
                              : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-[#4B2E83] text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{optText}</span>
                          </span>
                          {isSelected && <span className="text-xs font-bold text-[#4B2E83]">Selected</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    ← Previous Question
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAskBuddyAboutQuestion(questions[currentQuestionIdx])}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-purple-200 text-purple-brand text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <span>Ask AI Clarification</span>
                    </button>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                        className="px-6 py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow-sm"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Submit Final Paper
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Navigation Grid */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Question Navigator</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                      const isAns = answers[q.id] !== undefined
                      const isCurrent = idx === currentQuestionIdx

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIdx(idx)}
                          className={`h-9 rounded-lg text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#4B2E83] text-white ring-2 ring-[#4B2E83]/40'
                              : isAns
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                    <span>Answered Question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gray-100" />
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#4B2E83]" />
                    <span>Active Screen</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Submit Exam Session?</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                You have answered <span className="font-bold text-[#4B2E83]">{Object.keys(answers).length}</span> out of{' '}
                <span className="font-bold text-gray-900">{questions.length}</span> questions. Once submitted, your score will be logged.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Return to Exam
                </button>
                <button
                  onClick={() => handleExamSubmit(false)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: RESULT & CORRECTIONS SCREEN */}
        {viewState === 'result' && (
          <div className="space-y-6">
            
            {/* Score Banner */}
            <div className="bg-gradient-to-r from-[#4B2E83] to-purple-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-purple-200">
                  <span>Exam Attempt Completed</span>
                </span>
                <h1 className="text-3xl sm:text-4xl font-black font-['Outfit',sans-serif]">
                  Score Report: {percentage}%
                </h1>
                <p className="text-xs text-purple-200 font-medium">
                  {selectedCourse || 'CBT Mock Session'} • Time Elapsed: {elapsedTimeStr}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[160px]">
                <span className="text-xs text-purple-200 font-bold uppercase tracking-wider block mb-1">Correct Answers</span>
                <span className="text-3xl font-black text-white">{score} / {questions.length}</span>
                <span className="block text-[11px] text-emerald-300 font-semibold mt-1">
                  {percentage >= 70 ? 'First Class Standing!' : percentage >= 50 ? 'Passed' : 'Needs Revision'}
                </span>
              </div>
            </div>

            {/* Corrections Dashboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Review & Corrections</h2>
              
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const selectedOpt = answers[q.id]
                  const isCorrect = selectedOpt === q.correctAnswer
                  
                  return (
                    <div key={q.id} className="p-5 border border-gray-200 rounded-2xl bg-white space-y-4">
                      {/* Correction Question Header */}
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs font-extrabold text-gray-500 uppercase">Question {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <button
                            onClick={() => handleAskBuddyAboutQuestion(q, selectedOpt)}
                            className="flex items-center gap-1.5 px-3 py-1 border border-purple-200 text-purple-brand text-xs font-bold rounded-lg bg-purple-50/50 hover:bg-purple-100 transition-colors"
                          >
                            Ask StudyBuddy
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="font-bold text-gray-800 leading-relaxed font-sans">{q.question}</p>

                      {/* Options with correctness styles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isCurSelected = selectedOpt === optIdx
                          const isCorrectOpt = q.correctAnswer === optIdx
                          
                          let cardBorder = 'border-gray-200'
                          let cardBg = 'bg-white'
                          let textStyle = 'text-gray-700'

                          if (isCorrectOpt) {
                            cardBorder = 'border-green-500'
                            cardBg = 'bg-green-50/50'
                            textStyle = 'text-green-900 font-semibold'
                          } else if (isCurSelected && !isCorrectOpt) {
                            cardBorder = 'border-red-500'
                            cardBg = 'bg-red-50/50'
                            textStyle = 'text-red-900 font-semibold'
                          }

                          return (
                            <div key={optIdx} className={`p-3 border rounded-xl text-xs flex items-center gap-2.5 ${cardBorder} ${cardBg}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] ${isCorrectOpt ? 'bg-green-500 text-white' : (isCurSelected ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500')}`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className={textStyle}>{opt}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Explanation box */}
                      {q.explanation && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                          <div>
                            <span className="font-bold text-gray-700 block mb-0.5">Solution / Derivation Key:</span>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bottom control */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <button
                  onClick={() => setViewState('setup')}
                  className="px-6 py-2.5 btn-purple text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                >
                  Return to CBT Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <GuestRestrictionModal
        isOpen={isRestrictModalOpen}
        onClose={() => setIsRestrictModalOpen(false)}
        actionName={restrictAction}
      />

      <AskStudyBuddy
        isOpen={isAiOpen}
        onClose={() => {
          setIsAiOpen(false)
          setAiInitialQuery('')
        }}
        initialQuery={aiInitialQuery}
      />
    </Layout>
  )
}

export default Quizzes
