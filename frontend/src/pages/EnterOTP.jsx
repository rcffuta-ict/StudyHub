import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
import authBg from '../assets/authBg.png'
import api from '../services/api'

const EnterOTP = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) {
      toast.error('Email not found. Please start over.')
      navigate('/forgot-password')
    }
  }, [email, navigate])

  const handleChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, '')
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    const newOtp = [...otp]
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit
      }
    })
    setOtp(newOtp)
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')

    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpString })
      if (response.data.success) {
        toast.success('OTP verified successfully!')
        navigate('/reset-password', { state: { email, token: response.data.token } })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
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
              ⚡ Verification Code
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold font-heading leading-tight">
              Verify Your Identity
            </h2>
            <p className="text-sm xl:text-base text-white/80 font-medium leading-relaxed">
              We sent a 6-digit security OTP code to <strong className="text-white underline">{email}</strong>. Enter it to confirm your identity.
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
                Enter OTP Code
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Code sent to <span className="font-bold text-gray-800">{email}</span>
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* 6 Digit Inputs */}
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl font-extrabold border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/15 transition-all shadow-xs"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#4B2E83]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Verify &amp; Continue</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#4B2E83] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Change Email Address</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnterOTP
