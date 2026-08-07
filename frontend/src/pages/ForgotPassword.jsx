import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
import authBg from '../assets/authBg.png'
import api from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password', { email })
      if (response.data.success) {
        toast.success('OTP verification code sent to your email!')
        navigate('/enter-otp', { state: { email } })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.')
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
              🔐 Account Security
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold font-heading leading-tight">
              Trouble Logging In?
            </h2>
            <p className="text-sm xl:text-base text-white/80 font-medium leading-relaxed">
              Don't worry! Enter your registered university email and we will send you a 6-digit OTP code to safely reset your password.
            </p>

            <div className="pt-4 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">Instant OTP Security Code</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">Protected Account Access</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/50 font-medium">
            © 2026 StudyHub. All rights reserved.
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 h-full overflow-y-auto lg:overflow-hidden">
          <div className="max-w-[460px] w-full bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl shadow-black/25 rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col justify-between animate-fade-in-up my-auto">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="StudyHub" className="h-8 w-auto" />
                  <span className="text-lg font-bold text-[#4B2E83]">StudyHub</span>
                </Link>
                <Link to="/login" className="text-xs font-bold text-[#4B2E83]">
                  Log In
                </Link>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight mb-1.5">
                Forgot Password?
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Enter your account email address below to receive a 6-digit OTP verification code.
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#4B2E83]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send OTP Code</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Back Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link
                to="/login"
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

export default ForgotPassword
