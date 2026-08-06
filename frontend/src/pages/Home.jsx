import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { contactAPI } from '../services/api'
import logo from '../assets/logo.png'
import authBg from '../assets/authBg.png'
import studying from '../assets/studying.jpg'
import studying2 from '../assets/studying2.jpg'

const heroImages = [authBg, studying, studying2]

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All Resources')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentBgIndex, setCurrentBgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // ── Contact Form State ──
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactSubmitting, setContactSubmitting] = useState(false)

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields')
      return
    }
    try {
      setContactSubmitting(true)
      await contactAPI.submitMessage(contactForm)
      toast.success('Message sent successfully! Our team will get back to you shortly.')
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }

  // ── Interactive Teaser 1: Mini CGPA Calculator State ──
  const [teaserCourses, setTeaserCourses] = useState([
    { code: 'MTH 101', units: 3, grade: 'A' },
    { code: 'PHY 101', units: 4, grade: 'B' },
    { code: 'CHM 101', units: 3, grade: 'A' },
  ])
  const [calculatedGPA, setCalculatedGPA] = useState(null)

  const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

  const calculateTeaserGPA = () => {
    let totalPoints = 0
    let totalUnits = 0
    teaserCourses.forEach((c) => {
      const units = Number(c.units) || 0
      const pts = gradePoints[c.grade] ?? 0
      totalPoints += units * pts
      totalUnits += units
    })
    const gpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : '0.00'
    setCalculatedGPA(gpa)
  }

  // ── Interactive Teaser 2: CBT Sampler State ──
  const [cbtSelected, setCbtSelected] = useState(null)
  const [cbtSubmitted, setCbtSubmitted] = useState(false)

  const cbtQuestion = {
    course: 'PHY 101 – General Physics',
    text: 'A body of mass 5 kg accelerates from rest to a velocity of 20 m/s in 4 seconds. Calculate the net force acting on the body.',
    options: [
      { id: 'A', text: '15 N' },
      { id: 'B', text: '25 N', correct: true },
      { id: 'C', text: '50 N' },
      { id: 'D', text: '100 N' },
    ],
    explanation: 'Acceleration (a) = (v - u) / t = (20 - 0) / 4 = 5 m/s². Force (F) = m × a = 5 kg × 5 m/s² = 25 N.',
  }

  // ── Interactive Teaser 3: AI Tutor Showcase State ──
  const [aiActiveTab, setAiActiveTab] = useState('math')
  const aiDemos = {
    math: {
      question: 'How do I derive the derivative of f(x) = x · sin(x)?',
      response:
        'Use the Product Rule: (u · v)′ = u′v + uv′. Set u = x (u′ = 1) and v = sin(x) (v′ = cos(x)). Therefore, f′(x) = 1 · sin(x) + x · cos(x) = sin(x) + x · cos(x).',
    },
    physics: {
      question: 'What is Bernoulli’s Equation and when does it apply?',
      response:
        'P + ½ρv² + ρgh = Constant. Applies to incompressible, non-viscous fluid flow along a streamline. It expresses energy conservation per unit volume.',
    },
    chemistry: {
      question: 'Explain electrophilic addition in alkenes with an example.',
      response:
        'Alkenes contain an electron-rich C=C double bond that attacks an electrophile (e.g. H⁺ in HBr), forming a carbocation intermediate followed by bromide ion nucleophilic attack.',
    },
  }

  const faqs = [
    {
      q: 'Are FUTA past questions and study materials free to download?',
      a: 'Yes! All lecture notes, PDF summaries, and university past questions across 100L to 500L are 100% free to view and download for offline studying.',
    },
    {
      q: 'How closely does the CBT Exam Simulator match real university CBT exams?',
      a: 'Our CBT practice platform replicates official university computer-based testing interfaces, featuring 1-hour timed countdowns, instant scoring, and detailed step-by-step solution breakdowns.',
    },
    {
      q: 'Can I calculate both single semester GPA and cumulative CGPA?',
      a: 'Absolutely. The built-in CGPA Calculator supports multi-semester tracking, customizable credit units, grade scale options (5.0 scale), and target grade projections.',
    },
    {
      q: 'How does StudyBuddy AI help with difficult course assignments?',
      a: 'StudyBuddy AI is specially trained on university curricula to explain complex mathematical derivations, science formulae, and assignment questions clearly in simple terms.',
    },
    {
      q: 'Does StudyHub work offline during campus power cuts or network issues?',
      a: 'Yes! Once you download PDFs and past question packages, you can store them on your phone or laptop and access them offline anytime without active internet.',
    },
  ]

  const categories = ['All Resources', 'Past Questions', 'Lecture Notes', 'CBT Practice', 'Engineering', 'Sciences']

  const resources = [
    {
      title: 'MTH 101 – Calculus & Algebra',
      type: 'Past Questions',
      level: '100L',
      downloads: '2.4k',
      rating: 4.8,
      reviews: 312,
      color: 'from-purple-700 to-[#4B2E83]',
    },
    {
      title: 'PHY 101 – General Physics',
      type: 'Lecture Notes',
      level: '100L',
      downloads: '1.9k',
      rating: 4.6,
      reviews: 215,
      color: 'from-indigo-600 to-purple-700',
    },
    {
      title: 'CHM 101 – Organic Chemistry',
      type: 'Past Questions',
      level: '100L',
      downloads: '3.1k',
      rating: 4.9,
      reviews: 428,
      color: 'from-violet-600 to-[#4B2E83]',
    },
    {
      title: 'EEE 201 – Circuit Theory',
      type: 'CBT Practice',
      level: '200L',
      downloads: '1.6k',
      rating: 4.7,
      reviews: 183,
      color: 'from-purple-800 to-indigo-700',
    },
  ]

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: '100+ Study Materials',
      desc: 'Our curated library covers courses across 100L–500L with downloadable PDFs, past questions, and verified lecture notes.',
      link: '#library',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'Timed CBT Simulator',
      desc: 'Take timed CBT mock exams that mimic actual university question patterns and receive instant detailed score analysis.',
      link: '#demos',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'StudyBuddy AI Assistant',
      desc: 'Trained to explain complex math derivations, science formulae, and assignment questions step-by-step.',
      link: '#demos',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Multi-Semester CGPA Calc',
      desc: 'Instantly compute your GPA and cumulative CGPA across all semesters. Plan ahead to hit your target grade.',
      link: '#demos',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: 'Peer Forum & Discussions',
      desc: 'Ask questions, share insights, and collaborate with peers in course-specific threads moderated by top students.',
      link: '#community',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      title: 'Offline PDF Downloads',
      desc: 'Download any study material as a PDF and access it offline during campus power cuts or without internet.',
      link: '#library',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col selection:bg-purple-200 selection:text-[#4B2E83] font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden min-h-[620px]">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out pointer-events-none ${
              idx === currentBgIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f30]/85 via-[#1a0f30]/75 to-[#4B2E83]/60 pointer-events-none z-1" />

        {/* ── FLOATING FROSTED GLASS NAVBAR ── */}
        <header
          className="fixed top-4 sm:top-6 left-4 right-4 py-3 sm:left-6 sm:right-6 lg:left-10 lg:right-10 max-w-7xl mx-auto z-50 rounded-full bg-white/50 border border-white/50 shadow-[0_8px_25px_rgba(107,70,193,0.18)] transition-all duration-300"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <div className="px-4 sm:px-6 lg:px-8 h-12 sm:h-13 flex items-center justify-between gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#4B2E83]/10 rounded-full flex items-center justify-center p-1.5">
                <img src={logo} alt="StudyHub" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm sm:text-base font-extrabold text-[#4B2E83] tracking-tight font-['Outfit',sans-serif]">
                StudyHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-bold text-[#4B2E83]">
              <a href="#exam-hub" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Live Exam Hub</a>
              <a href="#demos" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Interactive Tools</a>
              <a href="#workflow" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">How It Works</a>
              <a href="#library" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Library</a>
              <a href="#faqs" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">FAQs</a>
              <a href="#contact" className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Contact Us</a>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-1.5 bg-[#4B2E83] text-white rounded-full font-bold text-xs sm:text-sm hover:bg-[#3b2368] transition-all shadow-md shadow-[#4B2E83]/20"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#4B2E83] hover:bg-[#4B2E83]/10 rounded-full transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-1.5 bg-[#4B2E83] text-white rounded-full font-bold text-xs sm:text-sm hover:bg-[#3b2368] transition-all shadow-md shadow-[#4B2E83]/20 whitespace-nowrap"
                  >
                    Register Free
                  </Link>
                </>
              )}
              <button
                className="md:hidden ml-1 p-1.5 rounded-full text-[#4B2E83] hover:bg-[#4B2E83]/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100/80 bg-white/90 rounded-b-3xl px-4 py-3 space-y-1">
              {[
                { label: 'Live Exam Hub', href: '#exam-hub' },
                { label: 'Interactive Tools', href: '#demos' },
                { label: 'How It Works', href: '#workflow' },
                { label: 'Library', href: '#library' },
                { label: 'FAQs', href: '#faqs' },
                { label: 'Contact Us', href: '#contact' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#4B2E83] hover:bg-[#4B2E83]/10 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* Hero text content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-20 lg:pt-40 lg:pb-28 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl mx-auto space-y-7 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All-In-One Academic Performance Suite</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-black text-white leading-[1.1] tracking-tight drop-shadow-md font-['Outfit',sans-serif]">
              Academic tools that{' '}
              <span className="text-purple-300">prepare you</span>{' '}
              for 5.0 CGPA success.
            </h1>

            <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed font-medium max-w-2xl mx-auto">
              Study smarter, not harder. Access 100+ verified materials, practice timed CBT exam mocks, calculate multi-semester CGPA, and get instant step-by-step AI tutoring.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
              <button
                onClick={() => navigate(user ? '/library' : '/signup')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4B2E83] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4B2E83]/25 hover:bg-[#3b2368] hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
              >
                <span>Start Preparing Free</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <a
                href="#demos"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 border-2 border-white/40 text-white rounded-xl font-bold text-sm hover:bg-white/20 hover:border-white transition-all backdrop-blur-sm w-full sm:w-auto"
              >
                <span>Try Live Demos</span>
              </a>
            </div>

            {/* Mini stats row */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                { value: '98.4%', label: 'Exam Success Rate' },
                { value: '5,000+', label: 'CBT Practice Qs' },
                { value: '100+', label: 'PDF Past Questions' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-4 py-2.5"
                >
                  <p className="text-xl font-black text-white leading-none">{s.value}</p>
                  <p className="text-[11px] text-purple-200 font-semibold leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Slideshow indicator dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBgIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentBgIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE EXAM SESSION REVISION HUB SECTION (Exams Currently Live) ─── */}
      <section id="exam-hub" className="bg-[#1e1035] text-white py-14 border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-gradient-to-r from-purple-900/90 via-[#4B2E83] to-indigo-950 p-6 sm:p-10 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="space-y-3 max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Exams Live in Session</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-['Outfit',sans-serif]">
                Semester Examinations Are Currently Live
              </h2>
              <p className="text-sm text-purple-200/90 leading-relaxed font-medium">
                Exams commenced this week! Stay sharp by practicing timed CBT mock questions, revising high-yield PDF summaries, and getting instant AI step-by-step solutions.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => navigate(user ? '/quizzes' : '/signup')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <span>Practice CBT Mock Exam</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate(user ? '/library' : '/signup')}
                  className="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs hover:bg-white/20 border border-white/20 transition-all"
                >
                  Download Past Question PDFs
                </button>
              </div>
            </div>

            {/* Live Exam Session Status Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
              {[
                { title: 'Exam Phase', val: 'Commenced', sub: 'Week 1 Active' },
                { title: 'CBT Mocks', val: '50+ Tests', sub: 'Real Time Pressure' },
                { title: 'Past Questions', val: '100L - 500L', sub: 'Verified Solutions' },
                { title: 'StudyBuddy AI', val: 'Online 24/7', sub: 'Step-by-Step AI' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[130px] sm:min-w-[150px] shadow-inner"
                >
                  <p className="text-[10px] font-extrabold uppercase text-purple-200 tracking-wider mb-1">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-xl font-black text-white leading-tight">{card.val}</p>
                  <p className="text-[10px] font-semibold text-emerald-300 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── 3-STEP STUDENT WORKFLOW SECTION ─── */}
      <section id="workflow" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Proven Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              How StudyHub Drives Academic Excellence
            </h2>
            <p className="text-sm text-gray-500 font-medium">Follow this 3-step strategy to boost your grades every semester.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Select Course & Level',
                desc: 'Pick your level (100L–500L) and department across Engineering, Sciences, and Technology to unlock tailored course content.',
                icon: (
                  <svg className="w-6 h-6 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Study Notes & AI Guidance',
                desc: 'Read verified lecture PDFs, watch targeted video topics, and ask StudyBuddy AI to clarify tough assignments step-by-step.',
                icon: (
                  <svg className="w-6 h-6 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Simulate CBT & Track CGPA',
                desc: 'Take timed 1-hour CBT mock exams under real test pressure, track score weak spots, and project your Target CGPA.',
                icon: (
                  <svg className="w-6 h-6 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((st, i) => (
              <div
                key={i}
                className="relative bg-[#faf9f6] p-8 rounded-3xl border border-gray-200/80 hover:border-[#4B2E83] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#4B2E83]/10 flex items-center justify-center">
                    {st.icon}
                  </div>
                  <span className="text-3xl font-black text-[#4B2E83]/20 group-hover:text-[#4B2E83] transition-colors font-['Outfit',sans-serif]">
                    {st.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2">{st.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE MICRO-DEMOS SECTION (CGPA + CBT + AI) ─── */}
      <section id="demos" className="py-20 bg-[#faf9f6] border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Experience It Live</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Try StudyHub Academic Micro-Tools
            </h2>
            <p className="text-sm text-gray-500 font-medium">Test our core features right here on the home page before signing up!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* DEMO 1: Mini CGPA Calculator */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#4B2E83] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Mini CGPA Estimator</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-medium">Enter course units and target grades to calculate your GPA:</p>

                <div className="space-y-2.5 mb-4">
                  {teaserCourses.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <span className="font-bold text-gray-800 w-20">{c.code}</span>
                      <select
                        value={c.units}
                        onChange={(e) => {
                          const updated = [...teaserCourses]
                          updated[idx].units = Number(e.target.value)
                          setTeaserCourses(updated)
                        }}
                        className="bg-white border border-gray-200 rounded px-2 py-1 font-bold text-gray-700 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6].map((u) => (
                          <option key={u} value={u}>{u} Units</option>
                        ))}
                      </select>
                      <select
                        value={c.grade}
                        onChange={(e) => {
                          const updated = [...teaserCourses]
                          updated[idx].grade = e.target.value
                          setTeaserCourses(updated)
                        }}
                        className="bg-white border border-gray-200 rounded px-2 py-1 font-bold text-[#4B2E83] focus:outline-none ml-auto"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={calculateTeaserGPA}
                  className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow"
                >
                  Calculate Test GPA
                </button>

                {calculatedGPA !== null && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                    <p className="text-xs text-purple-700 font-bold">Estimated GPA:</p>
                    <p className="text-2xl font-black text-[#4B2E83]">{calculatedGPA} / 5.00</p>
                    <p className="text-[10px] text-purple-700 font-bold flex items-center justify-center gap-1 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{Number(calculatedGPA) >= 4.5 ? 'First Class Standing!' : 'Upper Second Class'}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DEMO 2: Timed CBT Practice Sampler */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#4B2E83] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">CBT Exam Sampler</h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#4B2E83] bg-purple-100 px-2.5 py-1 rounded-full">PHY 101</span>
                </div>

                <p className="text-xs font-bold text-gray-800 mb-3 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {cbtQuestion.text}
                </p>

                <div className="space-y-2 mb-4">
                  {cbtQuestion.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setCbtSelected(opt.id)
                        setCbtSubmitted(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                        cbtSelected === opt.id
                          ? 'border-[#4B2E83] bg-purple-50 text-[#4B2E83]'
                          : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                      }`}
                    >
                      <span>
                        <span className="mr-2 font-black">{opt.id}.</span> {opt.text}
                      </span>
                      {cbtSelected === opt.id && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {!cbtSubmitted ? (
                  <button
                    disabled={!cbtSelected}
                    onClick={() => setCbtSubmitted(true)}
                    className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] disabled:opacity-50 transition-colors shadow"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <p className="font-extrabold text-emerald-800 mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{cbtSelected === 'B' ? 'Correct Answer!' : 'Incorrect. Correct Option is B'}</span>
                    </p>
                    <p className="text-[11px] text-emerald-900 leading-tight">{cbtQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* DEMO 3: StudyBuddy AI Assistant Showcase */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#4B2E83]/10 text-[#4B2E83] flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <h3 className="text-lg font-black text-gray-900">StudyBuddy AI Demo</h3>
                </div>

                <div className="flex gap-1 mb-3">
                  {[
                    { id: 'math', label: 'Calculus' },
                    { id: 'physics', label: 'Physics' },
                    { id: 'chemistry', label: 'Chemistry' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAiActiveTab(t.id)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        aiActiveTab === t.id ? 'bg-[#4B2E83] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-900 text-gray-100 p-3.5 rounded-2xl text-xs font-mono mb-3 space-y-2 border border-gray-800 shadow-inner">
                  <p className="text-purple-300 font-bold">User Prompt:</p>
                  <p className="text-gray-300 leading-snug">"{aiDemos[aiActiveTab].question}"</p>
                </div>

                <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs space-y-1">
                  <p className="text-[#4B2E83] font-black flex items-center gap-1">
                    <span className="text-sm">✨</span>
                    <span>AI Step-by-Step Solution:</span>
                  </p>
                  <p className="text-gray-800 leading-relaxed font-medium">
                    {aiDemos[aiActiveTab].response}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/signup')}
                  className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow"
                >
                  Ask StudyBuddy AI Anything →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FEATURE HIGHLIGHT CARDS ─── */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <p className="text-xs font-bold text-[#4B2E83] uppercase tracking-widest">Full Academic Suite</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Everything You Need to Excel
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <a
                key={i}
                href={feat.link}
                className="group flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-white hover:border-[#4B2E83]/30 hover:shadow-xl hover:shadow-[#4B2E83]/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#4B2E83]/10 text-[#4B2E83] flex items-center justify-center shrink-0 group-hover:bg-[#4B2E83] group-hover:text-white transition-colors duration-300">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{feat.desc}</p>
                </div>
                <span className="text-xs font-bold text-[#4B2E83] inline-flex items-center gap-1 group-hover:gap-2 transition-all mt-auto">
                  Learn more
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR COURSES / RESOURCES SECTION ─── */}
      <section id="library" className="bg-[#faf9f6] py-16 lg:py-24 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Popular Resources</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Find your course study materials.
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#4B2E83] text-white shadow-md shadow-[#4B2E83]/20'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#4B2E83] hover:text-[#4B2E83]'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => navigate(user ? '/library' : '/signup')}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-bold border border-[#4B2E83] text-[#4B2E83] hover:bg-[#4B2E83] hover:text-white transition-colors shrink-0"
            >
              View All Courses
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((res, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(user ? '/library' : '/signup')}
              >
                <div className={`h-36 bg-gradient-to-br ${res.color} flex items-end justify-start p-4 relative`}>
                  <span className="relative z-10 text-xs font-extrabold text-white/80 uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md">
                    {res.type}
                  </span>
                  <span className="absolute top-4 right-4 text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                    {res.level}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#4B2E83] transition-colors">
                    {res.title}
                  </h4>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(user ? '/library' : '/signup') }}
                    className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow-sm"
                  >
                    {user ? 'Access Material' : 'Get Free Access'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DAILY MOTIVATION & FORUM COMMUNITY SPOTLIGHT ─── */}
      <section id="community" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Daily Quote & Mindset */}
            <div className="bg-gradient-to-br from-[#4B2E83] to-purple-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-purple-200">
                  <svg className="w-3.5 h-3.5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Daily Academic Spark</span>
                </div>
                <blockquote className="text-xl sm:text-2xl font-bold leading-relaxed font-['Outfit',sans-serif] italic">
                  "Excellence is not a single exam result, but the habit of consistent daily practice."
                </blockquote>
                <p className="text-xs text-purple-200 font-semibold">— Academic Unit Motivation</p>
              </div>

              <div className="flex items-center justify-between border-t border-purple-700/50 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Study Streak Community</p>
                    <p className="text-[11px] text-purple-200">Over 1,200 students active today</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(user ? '/motivation' : '/signup')}
                  className="px-4 py-2 bg-white text-[#4B2E83] rounded-xl font-bold text-xs hover:bg-purple-50 transition-colors"
                >
                  View Motivation Hub
                </button>
              </div>
            </div>

            {/* Peer Forum Teaser */}
            <div className="bg-[#faf9f6] p-8 rounded-3xl border border-gray-200 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 font-['Outfit',sans-serif] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <span>Student Forum Discussions</span>
                  </h3>
                  <span className="text-xs font-bold text-[#4B2E83]">Active Threads</span>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Best strategy for answering MTH 101 integration questions under time pressure?', replies: 14, author: 'EngineeredMind' },
                    { title: 'PHY 101 vector mechanics summary notes download thread', replies: 28, author: 'FUTA_Techie' },
                    { title: 'How to prepare for CBT 1-hour 50 questions efficiently?', replies: 19, author: 'GradeASeeker' },
                  ].map((thread, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-2xl border border-gray-200/80 text-xs space-y-1 hover:border-purple-300 transition-colors">
                      <p className="font-bold text-gray-800 leading-snug">{thread.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                        <span>by @{thread.author}</span>
                        <span className="font-semibold text-purple-700">{thread.replies} replies</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate(user ? '/forum' : '/signup')}
                  className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow"
                >
                  Join Discussion Forum →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── STUDENT TESTIMONIALS & FACULTIES ─── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
              <svg className="w-4 h-4 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <span>Student Success</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Trusted by Top Performing Students
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: 'David O.',
                dept: 'Electrical Engineering (300L)',
                cgpa: '4.72 CGPA',
                text: 'The CBT Exam simulator was a game changer for me. Practicing past questions in real-time condition eliminated all exam anxiety.',
              },
              {
                name: 'Blessing A.',
                dept: 'Computer Science (200L)',
                cgpa: '4.85 CGPA',
                text: 'StudyBuddy AI helped me break down complex algorithm derivations whenever I got stuck late at night. Super reliable!',
              },
              {
                name: 'Emmanuel K.',
                dept: 'Mechanical Engineering (400L)',
                cgpa: '4.60 CGPA',
                text: 'Having all course PDFs, past question solutions, and CGPA projections in one platform made my semester revision seamless.',
              },
            ].map((t, i) => (
              <div key={i} className="bg-[#faf9f6] p-6 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{t.name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">{t.dept}</p>
                  </div>
                  <span className="text-xs font-black text-[#4B2E83] bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md">
                    {t.cgpa}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium italic">"{t.text}"</p>
              </div>
            ))}
          </div>

          {/* Faculty Coverage Badges */}
          <div className="text-center space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Covering All Academic Schools & Departments</p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-gray-600">
              {['SEET – Engineering', 'SOC – Computing', 'SAAT – Agriculture', 'SET – Environmental', 'Sciences', 'SLS – Life Sciences'].map((fac) => (
                <span key={fac} className="bg-gray-100 border border-gray-200 px-3.5 py-1.5 rounded-full">
                  {fac}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRADITIONAL HTML DROPDOWN FAQ SECTION ─── */}
      <section id="faqs" className="py-16 bg-[#faf9f6] border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
              <svg className="w-4 h-4 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 font-medium">Select a question from the dropdown menu below or click any item to expand:</p>
          </div>

          {/* Quick Select FAQ Dropdown */}
          {/* <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="faq-dropdown" className="text-xs font-extrabold text-gray-700 whitespace-nowrap">
              FAQ Dropdown Menu:
            </label>
            <select
              id="faq-dropdown"
              onChange={(e) => {
                const idx = e.target.value
                if (idx !== '') {
                  const el = document.getElementById(`faq-detail-${idx}`)
                  if (el) {
                    el.open = true
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }
              }}
              className="w-full bg-[#faf9f6] border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4B2E83] cursor-pointer"
            >
              <option value="">-- Choose a Question from Dropdown --</option>
              {faqs.map((f, i) => (
                <option key={i} value={i}>
                  {i + 1}. {f.q}
                </option>
              ))}
            </select>
          </div> */}

          {/* Traditional Native HTML <details> Dropdown Items */}
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                id={`faq-detail-${idx}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-[#4B2E83]/30 cursor-pointer"
              >
                <summary className="p-5 text-sm font-extrabold text-gray-900 flex items-center justify-between gap-4 select-none list-none [&::-webkit-details-marker]:hidden hover:text-[#4B2E83] focus:outline-none">
                  <span>{faq.q}</span>
                  <span className="w-7 h-7 rounded-xl bg-purple-50 text-[#4B2E83] border border-purple-200 flex items-center justify-center text-xs font-black shrink-0 transition-transform duration-300 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed font-medium border-t border-gray-100 pt-3 bg-[#faf9f6]/40">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT US SECTION ─── */}
      <section id="contact" className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B2E83] uppercase tracking-widest">
                <svg className="w-4 h-4 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Get In Touch</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
                Have Questions or Feedback?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Send a message directly to the StudyHub Academic Unit administrators. We are here to support your study journey and address your feedback!
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-700 bg-[#faf9f6] p-3.5 rounded-2xl border border-gray-200">
                  <div className="w-8 h-8 rounded-xl bg-[#4B2E83]/10 text-[#4B2E83] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900">Academic Support Desk</p>
                    <p className="text-gray-500 font-normal">Fast response within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#faf9f6] p-8 rounded-3xl border border-gray-200 shadow-md">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Ayano Gift"
                      required
                      className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2E83]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="name@student.futa.edu.ng"
                      required
                      className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2E83]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="e.g. Requesting MTH101 Past Question 2024 Solution"
                    required
                    className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2E83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">Message *</label>
                  <textarea
                    rows="4"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Write your message or inquiry here..."
                    required
                    className="w-full px-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2E83]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-3 bg-[#4B2E83] text-white font-bold rounded-xl text-xs hover:bg-[#3b2368] transition-colors shadow-md disabled:opacity-50"
                >
                  {contactSubmitting ? 'Sending Message...' : 'Send Message to Admin'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ─── HIGH-IMPACT PRE-FOOTER CTA BANNER ─── */}
      <section className="bg-[#4B2E83] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-['Outfit',sans-serif]">
            Ready to Ace Your Semester Exams?
          </h2>
          <p className="text-base text-purple-200 max-w-xl mx-auto leading-relaxed font-medium">
            Join thousands of university students using StudyHub for CBT practice, past question downloads, and CGPA growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="px-8 py-4 bg-white text-[#4B2E83] font-extrabold rounded-xl text-sm hover:bg-purple-50 transition-all shadow-xl active:scale-95 w-full sm:w-auto"
            >
              Get Free Instant Access Now
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-purple-900/60 text-white font-bold rounded-xl text-sm border border-purple-400/40 hover:bg-purple-900/90 transition-all w-full sm:w-auto"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* ─── COMPREHENSIVE MULTI-COLUMN FOOTER ─── */}
      <footer className="bg-[#190c2b] text-purple-200/80 pt-12 pb-6 text-xs border-t border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-purple-900/40">
            
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src={logo} alt="StudyHub" className="w-8 h-8 object-contain" />
                <span className="text-lg font-black text-white tracking-tight font-['Outfit',sans-serif]">
                  StudyHub
                </span>
              </div>
              <p className="text-purple-300/70 text-xs leading-relaxed">
                Empowering university students with centralized study materials, CBT exam simulators, StudyBuddy AI, and CGPA tracking tools.
              </p>
            </div>

            {/* Col 2: Platform Features */}
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-white tracking-wider">Platform Features</p>
              <ul className="space-y-4">
                <li><Link to="/library" className="hover:text-white transition-colors">Study Library & PDFs</Link></li>
                <li><Link to="/quizzes" className="hover:text-white transition-colors">CBT Exam Simulator</Link></li>
                <li><Link to="/cgpa-calculator" className="hover:text-white transition-colors">CGPA Calculator</Link></li>
                <li><Link to="/motivation" className="hover:text-white transition-colors">Daily Motivation Hub</Link></li>
                <li><Link to="/forum" className="hover:text-white transition-colors">Student Forum</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources & Academics */}
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-white tracking-wider">Resources</p>
              <ul className="space-y-4">
                <li><a href="#exam-hub" className="hover:text-white transition-colors">100L Past Questions</a></li>
                <li><a href="#exam-hub" className="hover:text-white transition-colors">200L Past Questions</a></li>
                <li><a href="#demos" className="hover:text-white transition-colors">Lecture Notes & Summaries</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Col 4: Portals & Access */}
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-white tracking-wider">Portals & Admin</p>
              <ul className="space-y-4">
                <li><Link to="/login" className="hover:text-white transition-colors">Student Portal Login</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Create Free Account</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">System Admin Login</Link></li>
                <li><Link to="/course-admin/login" className="hover:text-white transition-colors">Course Moderator Login</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-purple-400/60">
            <p>© 2026 StudyHub – Academic Unit, RCFFUTA. All rights reserved.</p>
            <div className="flex gap-4 font-semibold text-purple-300/80">
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/signup" className="hover:text-white">Register</Link>
              <a href="#contact" className="hover:text-white">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
