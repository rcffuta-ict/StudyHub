import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
import authBg from '../assets/authBg.png'
import api from '../services/api'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const email = location.state?.email || ''
  const token = location.state?.token || ''
  const redirectState = location.state?.from ? { from: location.state.from } : undefined
  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!email || !token) {
      toast.error('Invalid reset link. Please start over.')
      navigate('/forgot-password', { state: redirectState })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        token,
        password: formData.password,
      })

      if (response.data.success) {
        toast.success('Password reset successfully!')
        const loginResult = await login(email, formData.password)
        if (loginResult.success) {
          navigate(redirectTo)
        } else {
          navigate('/login', { state: redirectState })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full h-screen max-h-screen relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Full-width background image with overlay */}
      <div className="absolute inset-0 select-none z-0 overflow-hidden">
        <img
          src={authBg}
          alt="Students studying"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#2c1854]/95 via-[#4B2E83]/85 to-[#faf9f6]/20 mix-blend-multiply" />
      </div>

      {/* Background blobs for visual depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#4B2E83]/10 blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#4B2E83]/10 blur-[120px] pointer-events-none z-10" />

      {/* Two-column relative overlay */}
      <div className="flex flex-col lg:flex-row w-full h-full z-20 relative overflow-hidden">
        
        {/* Left Column: Branding Showcase */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-8 xl:p-12 text-white select-none h-full">
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition-opacity cursor-pointer group">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
              <img src={logo} alt="StudyHub logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight font-heading">StudyHub</span>
          </Link>

          <div className="max-w-md space-y-5 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-purple-200">
              🔑 New Password Setup
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold font-heading leading-tight">
              Create a Strong Password
            </h2>
            <p className="text-sm xl:text-base text-white/80 font-medium leading-relaxed">
              Choose a secure password of at least 6 characters to keep your academic profile and notes safe.
            </p>
          </div>

          <div className="text-xs text-white/50 font-medium">
            © 2026 StudyHub. All rights reserved.
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 h-full overflow-y-auto lg:overflow-hidden">
          <div className="max-w-[480px] w-full bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl shadow-black/25 rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col justify-between animate-fade-in-up my-auto">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="StudyHub" className="h-8 w-auto" />
                  <span className="text-lg font-bold text-[#4B2E83]">StudyHub</span>
                </Link>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight mb-1.5">
                Set New Password
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Create a new password for <span className="font-bold text-gray-800">{email}</span>
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showConfirmPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#4B2E83]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Reset Password &amp; Sign In</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Back Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link
                to="/login"
                state={redirectState}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#4B2E83] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
