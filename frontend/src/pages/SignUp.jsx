import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
import authBg from '../assets/authBg.png'
import { useGoogleLogin } from '@react-oauth/google'
import { faculties, levels } from '../utils/faculties'

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    department: '',
    level: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [availableDepartments, setAvailableDepartments] = useState([])

  // Google Login and Registration States
  const [showGoogleRegisterModal, setShowGoogleRegisterModal] = useState(false)
  const [tempGoogleToken, setTempGoogleToken] = useState('')
  const [googleUserEmail, setGoogleUserEmail] = useState('')
  const [googleRegData, setGoogleRegData] = useState({
    faculty: '',
    department: '',
    level: '',
  })
  const [googleModalDepartments, setGoogleModalDepartments] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'faculty') {
      setFormData({
        ...formData,
        faculty: value,
        department: '', 
      })
      setAvailableDepartments(faculties[value] || [])
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleGoogleRegChange = (e) => {
    const { name, value } = e.target
    if (name === 'faculty') {
      setGoogleRegData({
        ...googleRegData,
        faculty: value,
        department: '',
      })
      setGoogleModalDepartments(faculties[value] || [])
    } else {
      setGoogleRegData({
        ...googleRegData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    if (!formData.faculty || !formData.department || !formData.level) {
      return toast.error('Please fill in all academic details')
    }

    setLoading(true)
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        faculty: formData.faculty,
        department: formData.department,
        level: formData.level,
      })

      if (result.success) {
        toast.success('Account created successfully! Check your email to verify your account.')
        navigate('/login')
      } else {
        toast.error(result.message || 'Registration failed')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Login Hook (Option B: Access Token Flow)
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const token = tokenResponse.access_token
        const result = await googleLogin({ token })

        if (result.success) {
          if (result.needRegistrationInfo) {
            // Open complete profile modal
            setTempGoogleToken(token)
            setGoogleUserEmail(result.email)
            setShowGoogleRegisterModal(true)
          } else {
            toast.success('Logged in successfully with Google!')
            navigate('/dashboard')
          }
        } else {
          toast.error(result.message || 'Google authentication failed')
        }
      } catch (error) {
        toast.error('An error occurred during Google sign-in.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      toast.error('Google Sign In was unsuccessful. Try again.')
    }
  })

  const handleGoogleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!googleRegData.faculty || !googleRegData.department || !googleRegData.level) {
      toast.error('Please select all registration fields')
      return
    }

    setLoading(true)
    try {
      const result = await googleLogin({
        token: tempGoogleToken,
        faculty: googleRegData.faculty,
        department: googleRegData.department,
        level: googleRegData.level,
      })

      if (result.success) {
        toast.success('Profile completed and logged in successfully!')
        setShowGoogleRegisterModal(false)
        navigate('/dashboard')
      } else {
        toast.error(result.message || 'Google registration failed')
      }
    } catch (error) {
      toast.error('An error occurred during profile setup.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full min-h-[100dvh] lg:h-screen lg:max-h-screen relative overflow-x-hidden">
      {/* Full-width background image with overlay */}
      <div className="absolute inset-0 select-none z-0">
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
      <div className="flex flex-col lg:flex-row w-full min-h-[100dvh] lg:h-screen z-20 relative">
        
        {/* Left Column: Teaser details (visible on desktop) */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-8 xl:p-12 text-white select-none h-full">
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition-opacity cursor-pointer group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <img src={logo} alt="Studyhub logo" className="h-6 w-auto" />
            </div>
            <span className="text-xl font-bold tracking-wider uppercase text-white">StudyHub</span>
          </Link>

          <div className="max-w-lg mb-6 xl:mb-10 space-y-5 animate-fade-in-up">
            <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              ✨ Academic Workspace
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold font-heading leading-tight">
              Create Your Free Account
            </h2>
            <p className="text-white/80 text-sm xl:text-base leading-relaxed">
              Unlock access to shared academic resources, calculate your CGPA, take interactive mock quizzes, and collaborate with your peers.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">Library &amp; Notes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">CGPA Tools</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">Interactive Quizzes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <span className="text-xs xl:text-sm font-medium text-white/90">Forums &amp; Chats</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/50">
            © 2026 StudyHub. All rights reserved.
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 min-h-[100dvh] lg:min-h-0 lg:h-full overflow-y-auto lg:overflow-hidden">
          <div className="max-w-[780px] w-full bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl shadow-black/25 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between animate-fade-in-up my-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight leading-none mb-1.5">
                  Join StudyHub
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Create an account to start your learning workspace.
                </p>
              </div>
              <Link 
                to="/login" 
                className="text-xs sm:text-sm font-bold text-[#4B2E83] hover:opacity-80 transition-opacity shrink-0 ml-4 mt-0.5"
              >
                Log In
              </Link>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col justify-center">
              <form className="flex flex-col gap-3 sm:gap-3.5" onSubmit={handleSubmit}>
                {/* Row 1: Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="name" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                        placeholder="name@university.edu"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Password
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
                        placeholder="Create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirmPassword" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Confirm Password
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
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Academic Details Selects (Faculty, Department, Level) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Faculty Select */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="faculty" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Faculty
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </span>
                      <select
                        id="faculty"
                        name="faculty"
                        required
                        value={formData.faculty}
                        onChange={handleChange}
                        className="w-full pl-9 pr-7 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer truncate"
                      >
                        <option value="">Select Faculty</option>
                        {Object.keys(faculties).map((faculty) => (
                          <option key={faculty} value={faculty}>
                            {faculty}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Department Select */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="department" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Department
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </span>
                      <select
                        id="department"
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        disabled={!formData.faculty || availableDepartments.length === 0}
                        className="w-full pl-9 pr-7 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer disabled:bg-gray-100/70 disabled:cursor-not-allowed disabled:opacity-60 truncate"
                      >
                        <option value="">
                          {formData.faculty ? 'Select Department' : 'Select Faculty first'}
                        </option>
                        {availableDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Level Select */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="level" className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Academic Level
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </span>
                      <select
                        id="level"
                        name="level"
                        required
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full pl-9 pr-7 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer truncate"
                      >
                        <option value="">Select Level</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}L
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold shadow-md shadow-[#4B2E83]/20 hover:shadow-lg hover:shadow-[#4B2E83]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex justify-center items-center gap-2 mt-1 sm:mt-1.5"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm">Creating Account...</span>
                    </>
                  ) : (
                    <span className="text-sm">Create Account</span>
                  )}
                </button>
              </form>

              {/* Separator */}
              <div className="flex items-center my-2.5 sm:my-3">
                <div className="flex-grow border-t border-gray-150" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 select-none">or authenticate with</span>
                <div className="flex-grow border-t border-gray-150" />
              </div>

              {/* Custom Google Sign-in Button */}
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex justify-center items-center gap-2.5 shadow-sm text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Terms */}
            <p className="text-[10px] sm:text-[11px] text-gray-400 text-center mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-gray-100/80 leading-relaxed font-semibold">
              By creating an account, you agree to our <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Google Complete Profile Modal */}
      {showGoogleRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoogleRegisterModal(false)} />
          <div className="relative max-w-md w-full bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl px-6 py-6 sm:p-8 z-10 animate-fade-in-up max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">
              To complete your registration for <strong className="text-gray-800">{googleUserEmail}</strong>, please select your academic details below.
            </p>
            
            <form onSubmit={handleGoogleRegisterSubmit} className="space-y-4">
              {/* Faculty Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modal-faculty" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Faculty
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
                    </svg>
                  </span>
                  <select
                    id="modal-faculty"
                    name="faculty"
                    required
                    value={googleRegData.faculty}
                    onChange={handleGoogleRegChange}
                    className="w-full pl-10 pr-9 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Faculty</option>
                    {Object.keys(faculties).map((faculty) => (
                      <option key={faculty} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Department Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modal-department" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Department
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <select
                    id="modal-department"
                    name="department"
                    required
                    value={googleRegData.department}
                    onChange={handleGoogleRegChange}
                    disabled={!googleRegData.faculty || googleModalDepartments.length === 0}
                    className="w-full pl-10 pr-9 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer disabled:bg-gray-100/70 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {googleRegData.faculty ? 'Select Department' : 'Select Faculty first'}
                    </option>
                    {googleModalDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Level Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modal-level" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Academic Level
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                  <select
                    id="modal-level"
                    name="level"
                    required
                    value={googleRegData.level}
                    onChange={handleGoogleRegChange}
                    className="w-full pl-10 pr-9 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Level</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}L
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoogleRegisterModal(false)}
                  className="flex-1 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold shadow-md shadow-[#4B2E83]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all text-sm"
                >
                  Complete Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignUp
