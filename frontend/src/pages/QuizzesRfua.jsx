import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import QuizzesView from '../components/QuizzesView'

// Dedicated, shareable deep link (/quizzes/rfua) for the RFUA 100L scholarship exam.
// Skips the dashboard -> menu -> Quizzes -> scroll -> "RFUA Scholarship" click chain:
// a 100L candidate lands straight on the entry form. Anyone else who opens the link
// (after authenticating) is bounced back to the normal Quizzes hub with an explainer.
const QuizzesRfua = () => {
  const { user, loading } = useAuth()
  const notifiedRef = useRef(false)

  const is100LUser = Boolean(user && !user.isGuest && String(user.level || '').toLowerCase().includes('100'))

  useEffect(() => {
    if (!loading && user && !is100LUser && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error('The RFUA Scholarship Exam is only available to registered 100-Level students.', { duration: 6000 })
    }
  }, [loading, user, is100LUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (user && !is100LUser) {
    return <Navigate to="/quizzes" replace />
  }

  return <QuizzesView direct />
}

export default QuizzesRfua
