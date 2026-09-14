import CbtQuestion from '../models/CbtQuestion.js'
import CbtSubmission from '../models/CbtSubmission.js'
import CbtSetting from '../models/CbtSetting.js'

// Helper: Get or initialize global config (defaults to locked until admin enables)
const getGlobalConfig = async () => {
  let config = await CbtSetting.findOne({ key: 'global_cbt_config' })
  if (!config) {
    config = await CbtSetting.create({
      key: 'global_cbt_config',
      activeSet: 'Set A',
      durationMinutes: 45,
      isExamActive: false,
    })
  }
  return config
}

// Helper: Normalize + validate matric number (e.g. EEE/22/1001)
const normalizeMatric = (matric) => {
  return String(matric || '').trim().toUpperCase().replace(/\s+/g, '')
}

const MATRIC_REGEX = /^[A-Z]{2,4}\/\d{2}\/\d{3,4}$/

const isValidMatric = (matric) => MATRIC_REGEX.test(matric)

// Accounts allowed to retake the CBT exam as many times as they like, ignoring
// the one-attempt lock, the Exam Active toggle, and the scheduled exam window.
const UNLIMITED_RETAKE_EMAILS = ['ayanogift@gmail.com']
const hasUnlimitedAccess = (user) => UNLIMITED_RETAKE_EMAILS.includes(String(user?.email || '').toLowerCase())

// Helper: Determine whether "now" falls within the admin-scheduled exam window.
// Either bound may be unset, in which case that side is treated as open.
const getWindowState = (config) => {
  const now = new Date()
  if (config.examStartAt && now < new Date(config.examStartAt)) {
    return { withinWindow: false, reason: 'not_started' }
  }
  if (config.examEndAt && now > new Date(config.examEndAt)) {
    return { withinWindow: false, reason: 'ended' }
  }
  return { withinWindow: true, reason: null }
}

const windowStateMessage = (windowState, config) => {
  if (windowState.reason === 'not_started') {
    return `The scholarship examination has not opened yet. It opens on ${new Date(config.examStartAt).toLocaleString()}.`
  }
  if (windowState.reason === 'ended') {
    return `The scholarship examination window has closed. It ended on ${new Date(config.examEndAt).toLocaleString()}.`
  }
  return null
}

// @desc    Check student eligibility & session status
// @route   GET /api/cbt/status
// @access  Private
export const getStatus = async (req, res) => {
  try {
    const user = req.user

    // 1. Block guests
    if (user.isGuest) {
      return res.json({
        eligible: false,
        isGuest: true,
        reason: 'guest',
        message: 'This official scholarship exam is exclusively for registered 100L StudyHub students. Please sign up or log in to participate.',
      })
    }

    // 2. Check 100-Level eligibility
    const levelStr = String(user.level || '').trim().toLowerCase()
    const is100L = levelStr.includes('100')
    if (!is100L) {
      return res.json({
        eligible: false,
        isGuest: false,
        reason: 'non_100l',
        message: `This assessment is restricted to 100-Level students. Your profile level is set to ${user.level || 'unspecified'}.`,
      })
    }

    const config = await getGlobalConfig()
    const windowState = getWindowState(config)

    // 3. Check existing submission
    const existingSubmission = await CbtSubmission.findOne({ userId: user._id })

    if (!existingSubmission) {
      return res.json({
        eligible: true,
        alreadyTaken: false,
        hasActiveSession: false,
        config: {
          activeSet: config.activeSet,
          durationMinutes: config.durationMinutes,
          isExamActive: config.isExamActive,
          examStartAt: config.examStartAt,
          examEndAt: config.examEndAt,
          withinWindow: windowState.withinWindow,
          windowMessage: windowStateMessage(windowState, config),
        },
      })
    }

    // If submission is completed
    if (existingSubmission.status === 'completed') {
      const reviewQuestions = await getReviewQuestions(existingSubmission)
      return res.json({
        eligible: false,
        alreadyTaken: true,
        reason: 'completed',
        submission: existingSubmission,
        reviewQuestions,
        canRetake: hasUnlimitedAccess(user),
        config: {
          activeSet: config.activeSet,
          durationMinutes: config.durationMinutes,
        },
      })
    }

    // Check active session timer
    const now = new Date()
    const expiresAt = new Date(existingSubmission.expiresAt)
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))

    if (remainingSeconds <= 0) {
      // Auto-finalize expired submission
      await scoreSubmission(existingSubmission)
      const finalized = await CbtSubmission.findById(existingSubmission._id)
      const reviewQuestions = await getReviewQuestions(finalized)
      return res.json({
        eligible: false,
        alreadyTaken: true,
        reason: 'expired',
        submission: finalized,
        reviewQuestions,
        canRetake: hasUnlimitedAccess(user),
        config: {
          activeSet: config.activeSet,
          durationMinutes: config.durationMinutes,
        },
      })
    }

    // Has ongoing active session
    return res.json({
      eligible: true,
      alreadyTaken: false,
      hasActiveSession: true,
      remainingSeconds,
      submission: existingSubmission,
      config: {
        activeSet: config.activeSet,
        durationMinutes: config.durationMinutes,
      },
    })
  } catch (error) {
    console.error('CBT getStatus error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// @desc    Start / Resume CBT Examination Session
// @route   POST /api/cbt/start
// @access  Private
export const startExam = async (req, res) => {
  try {
    const user = req.user

    if (user.isGuest) {
      return res.status(403).json({ message: 'Guests cannot take the official scholarship exam.' })
    }

    const levelStr = String(user.level || '').trim().toLowerCase()
    const is100L = levelStr.includes('100')
    if (!is100L) {
      return res.status(403).json({ message: 'Only 100-Level students can participate in this exam.' })
    }

    const { matricNumber, combination, surname, firstname } = req.body

    if (!matricNumber || !combination) {
      return res.status(400).json({ message: 'Matriculation number and subject combination are required.' })
    }

    const cleanMatric = normalizeMatric(matricNumber)
    if (!isValidMatric(cleanMatric)) {
      return res.status(400).json({
        message: 'Enter a valid matriculation number (e.g., EEE/22/1001).',
      })
    }

    if (!['MPC', 'PCB'].includes(combination)) {
      return res.status(400).json({ message: 'Invalid subject combination. Choose MPC or PCB.' })
    }

    const config = await getGlobalConfig()
    const bypassAdminGates = hasUnlimitedAccess(user)

    if (!bypassAdminGates && !config.isExamActive) {
      return res.status(400).json({ message: 'The scholarship examination is currently paused or inactive.' })
    }

    // Only gate the START of a fresh attempt on the schedule window — a student
    // already mid-exam when the window ends should still be able to resume/submit.
    const existingSubmission = await CbtSubmission.findOne({ userId: user._id })
    if (!existingSubmission && !bypassAdminGates) {
      const windowState = getWindowState(config)
      if (!windowState.withinWindow) {
        return res.status(400).json({ message: windowStateMessage(windowState, config) })
      }
    }

    let submission = existingSubmission

    if (submission && submission.status === 'completed') {
      if (!bypassAdminGates) {
        return res.status(400).json({ message: 'You have already completed your examination attempt.' })
      }
      // Unlimited-access account: clear the previous attempt and start fresh.
      await CbtSubmission.deleteOne({ _id: submission._id })
      submission = null
    }

    // Server-side one-attempt enforcement: a matric number is a unique candidate
    // identifier and cannot be used for a second, separate official attempt.
    if (!submission) {
      const matricTaken = await CbtSubmission.findOne({
        matricNumber: cleanMatric,
        status: { $in: ['completed', 'expired'] },
      })
      if (matricTaken && String(matricTaken.userId) !== String(user._id)) {
        return res.status(400).json({
          message: 'This matriculation number has already completed the exam for another account.',
        })
      }
    }

    const userSurname = surname || user.fullName?.split(' ').slice(-1)[0] || 'Student'
    const userFirstname = firstname || user.fullName?.split(' ')[0] || '100L'

    const subjectsMap = {
      MPC: ['Mathematics', 'Physics', 'Chemistry'],
      PCB: ['Physics', 'Chemistry', 'Biology'],
    }

    const chosenSubjects = subjectsMap[combination] || subjectsMap.MPC

    if (!submission) {
      const durationMs = config.durationMinutes * 60 * 1000
      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + durationMs)

      submission = await CbtSubmission.create({
        userId: user._id,
        surname: userSurname,
        firstname: userFirstname,
        email: user.email,
        department: user.department || 'General Science',
        faculty: user.faculty || 'Science & Tech',
        matricNumber: cleanMatric,
        combination,
        questionSet: config.activeSet,
        startedAt,
        expiresAt,
        status: 'in-progress',
        answers: {},
      })
    }

    // Check timer
    const now = new Date()
    const remainingSeconds = Math.max(0, Math.floor((new Date(submission.expiresAt).getTime() - now.getTime()) / 1000))

    if (remainingSeconds <= 0) {
      await scoreSubmission(submission)
      const finalized = await CbtSubmission.findById(submission._id)
      return res.status(400).json({
        message: 'Your examination timer has expired.',
        submission: finalized,
      })
    }

    // Fetch questions for chosen subjects and active set
    const questions = await CbtQuestion.find({
      subject: { $in: chosenSubjects },
      question_set: submission.questionSet,
    }).sort({ subject: 1, subsection_id: 1, _id: 1 })

    // Secure questions (strip correct_option & explanation)
    const securedQuestions = questions.map((q) => ({
      _id: q._id,
      subject: q.subject,
      subsection_id: q.subsection_id,
      subsection_name: q.subsection_name,
      question_text: q.question_text,
      options: q.options,
    }))

    res.json({
      success: true,
      submission,
      durationMinutes: config.durationMinutes,
      remainingSeconds,
      questions: securedQuestions,
    })
  } catch (error) {
    console.error('CBT startExam error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// @desc    Sync draft answers periodically during exam
// @route   POST /api/cbt/sync-draft
// @access  Private
export const syncDraft = async (req, res) => {
  try {
    const user = req.user
    const { answers } = req.body

    const submission = await CbtSubmission.findOne({ userId: user._id, status: 'in-progress' })
    if (!submission) {
      return res.status(404).json({ message: 'No active exam session found.' })
    }

    const now = new Date()
    const remainingSeconds = Math.floor((new Date(submission.expiresAt).getTime() - now.getTime()) / 1000)

    if (remainingSeconds <= 0) {
      if (answers) submission.answers = answers
      await scoreSubmission(submission)
      return res.json({ expired: true, message: 'Time expired. Exam auto-submitted.' })
    }

    if (answers) {
      submission.answers = answers
      await submission.save()
    }

    res.json({ success: true, remainingSeconds })
  } catch (error) {
    console.error('CBT syncDraft error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// Helper: Score submission on server
const scoreSubmission = async (submission, finalAnswers = null) => {
  const answersToEvaluate = finalAnswers || submission.answers || new Map()
  const answersMap = answersToEvaluate instanceof Map ? answersToEvaluate : new Map(Object.entries(answersToEvaluate))

  const subjectsMap = {
    MPC: ['Mathematics', 'Physics', 'Chemistry'],
    PCB: ['Physics', 'Chemistry', 'Biology'],
  }

  const chosenSubjects = subjectsMap[submission.combination] || subjectsMap.MPC

  const questions = await CbtQuestion.find({
    subject: { $in: chosenSubjects },
    question_set: submission.questionSet,
  })

  let correctCount = 0
  const subjectCounts = {}
  questions.forEach((q) => {
    const subj = q.subject
    if (!subjectCounts[subj]) subjectCounts[subj] = { correct: 0, total: 0 }
    subjectCounts[subj].total++
    const studentChoice = answersMap.get(String(q._id)) || answersMap.get(q._id)
    if (studentChoice && studentChoice.toUpperCase() === q.correct_option.toUpperCase()) {
      correctCount++
      subjectCounts[subj].correct++
    }
  })

  const totalQuestions = questions.length || 75
  const percentage = Math.round((correctCount / totalQuestions) * 100)

  const startTime = new Date(submission.startedAt).getTime()
  const nowTime = Math.min(new Date().getTime(), new Date(submission.expiresAt).getTime())
  const timeSpentSeconds = Math.max(1, Math.floor((nowTime - startTime) / 1000))

  submission.status = 'completed'
  submission.submittedAt = new Date()
  submission.score = correctCount
  submission.totalQuestions = totalQuestions
  submission.percentage = percentage
  submission.timeSpentSeconds = timeSpentSeconds
  submission.answers = Object.fromEntries(answersMap)
  submission.subjectScores = subjectCounts

  await submission.save()
  return submission
}

// Helper: Fetch full question set (incl. correct_option & explanation) for a
// submission's combination/question set, for post-exam review.
const getReviewQuestions = async (submission) => {
  const subjectsMap = {
    MPC: ['Mathematics', 'Physics', 'Chemistry'],
    PCB: ['Physics', 'Chemistry', 'Biology'],
  }
  const chosenSubjects = subjectsMap[submission.combination] || subjectsMap.MPC
  return CbtQuestion.find({
    subject: { $in: chosenSubjects },
    question_set: submission.questionSet,
  }).sort({ subject: 1, subsection_id: 1, _id: 1 })
}

// @desc    Submit final CBT Exam
// @route   POST /api/cbt/submit
// @access  Private
export const submitExam = async (req, res) => {
  try {
    const user = req.user
    const { answers } = req.body

    const submission = await CbtSubmission.findOne({ userId: user._id })

    if (!submission) {
      return res.status(404).json({ message: 'No exam session found.' })
    }

    if (submission.status === 'completed') {
      return res.json({ success: true, submission, alreadySubmitted: true })
    }

    await scoreSubmission(submission, answers)

    const reviewQuestions = await getReviewQuestions(submission)

    res.json({
      success: true,
      submission,
      reviewQuestions,
    })
  } catch (error) {
    console.error('CBT submitExam error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// @desc    Get Candidate Leaderboard & Results (Admin)
// @route   GET /api/cbt/admin/leaderboard
// @access  Private/Admin
export const getLeaderboard = async (req, res) => {
  try {
    const submissions = await CbtSubmission.find()
      .populate('userId', 'fullName email level department faculty')
      .sort({ score: -1, percentage: -1, timeSpentSeconds: 1, createdAt: 1 })

    const config = await getGlobalConfig()

    res.json({
      success: true,
      config,
      totalSubmissions: submissions.length,
      submissions,
    })
  } catch (error) {
    console.error('CBT getLeaderboard error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// @desc    Update Global CBT Settings (Admin)
// @route   PUT /api/cbt/admin/settings
// @access  Private/Admin
export const adminUpdateSettings = async (req, res) => {
  try {
    const { activeSet, durationMinutes, isExamActive, examStartAt, examEndAt } = req.body

    const config = await getGlobalConfig()

    if (activeSet && ['Set A', 'Set B'].includes(activeSet)) {
      config.activeSet = activeSet
    }
    if (durationMinutes && typeof durationMinutes === 'number' && durationMinutes > 0) {
      config.durationMinutes = durationMinutes
    }
    if (typeof isExamActive === 'boolean') {
      config.isExamActive = isExamActive
    }

    // Scheduled exam window (both optional; pass null/'' to clear a bound)
    if (examStartAt !== undefined) {
      const parsed = examStartAt ? new Date(examStartAt) : null
      if (examStartAt && Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid exam start date/time.' })
      }
      config.examStartAt = parsed
    }
    if (examEndAt !== undefined) {
      const parsed = examEndAt ? new Date(examEndAt) : null
      if (examEndAt && Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid exam end date/time.' })
      }
      config.examEndAt = parsed
    }
    if (config.examStartAt && config.examEndAt && config.examStartAt >= config.examEndAt) {
      return res.status(400).json({ message: 'Exam start time must be before the end time.' })
    }

    await config.save()

    res.json({
      success: true,
      message: 'Global CBT settings updated successfully.',
      config,
    })
  } catch (error) {
    console.error('CBT adminUpdateSettings error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

// @desc    Reset a Candidate's Attempt for Retake (Admin)
// @route   DELETE /api/cbt/admin/reset-attempt/:id
// @access  Private/Admin
export const adminResetAttempt = async (req, res) => {
  try {
    const { id } = req.params

    const submission = await CbtSubmission.findByIdAndDelete(id)

    if (!submission) {
      return res.status(404).json({ message: 'Submission record not found.' })
    }

    res.json({
      success: true,
      message: `Attempt for student ${submission.firstname} ${submission.surname} (${submission.matricNumber}) reset successfully.`,
    })
  } catch (error) {
    console.error('CBT adminResetAttempt error:', error)
    res.status(500).json({ message: error.message || 'Server error' })
  }
}
