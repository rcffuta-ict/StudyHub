import CbtQuestion from '../models/CbtQuestion.js'
import CbtSubmission from '../models/CbtSubmission.js'
import CbtSetting from '../models/CbtSetting.js'

// Helper: Get or initialize global config
const getGlobalConfig = async () => {
  let config = await CbtSetting.findOne({ key: 'global_cbt_config' })
  if (!config) {
    config = await CbtSetting.create({
      key: 'global_cbt_config',
      activeSet: 'Set A',
      durationMinutes: 45,
      isExamActive: true,
    })
  }
  return config
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
    const levelStr = String(user.level || '').trim()
    if (levelStr !== '100') {
      return res.json({
        eligible: false,
        isGuest: false,
        reason: 'non_100l',
        message: `This assessment is restricted to 100-Level students. Your profile level is set to ${levelStr || 'unspecified'}.`,
      })
    }

    const config = await getGlobalConfig()

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
        },
      })
    }

    // If submission is completed
    if (existingSubmission.status === 'completed') {
      return res.json({
        eligible: false,
        alreadyTaken: true,
        reason: 'completed',
        submission: existingSubmission,
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
      return res.json({
        eligible: false,
        alreadyTaken: true,
        reason: 'expired',
        submission: finalized,
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

    const levelStr = String(user.level || '').trim()
    if (levelStr !== '100') {
      return res.status(403).json({ message: 'Only 100-Level students can participate in this exam.' })
    }

    const { matricNumber, combination, surname, firstname } = req.body

    if (!matricNumber || !combination) {
      return res.status(400).json({ message: 'Matriculation number and subject combination are required.' })
    }

    const config = await getGlobalConfig()
    if (!config.isExamActive) {
      return res.status(400).json({ message: 'The scholarship examination is currently paused or inactive.' })
    }

    let submission = await CbtSubmission.findOne({ userId: user._id })

    if (submission && submission.status === 'completed') {
      return res.status(400).json({ message: 'You have already completed your examination attempt.' })
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
        matricNumber: matricNumber.toUpperCase().trim(),
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
  questions.forEach((q) => {
    const studentChoice = answersMap.get(String(q._id)) || answersMap.get(q._id)
    if (studentChoice && studentChoice.toUpperCase() === q.correct_option.toUpperCase()) {
      correctCount++
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

  await submission.save()
  return submission
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

    // Fetch review questions including explanations
    const subjectsMap = {
      MPC: ['Mathematics', 'Physics', 'Chemistry'],
      PCB: ['Physics', 'Chemistry', 'Biology'],
    }
    const chosenSubjects = subjectsMap[submission.combination] || subjectsMap.MPC
    const reviewQuestions = await CbtQuestion.find({
      subject: { $in: chosenSubjects },
      question_set: submission.questionSet,
    }).sort({ subject: 1, subsection_id: 1, _id: 1 })

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
    const { activeSet, durationMinutes, isExamActive } = req.body

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
