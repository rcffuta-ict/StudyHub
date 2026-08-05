import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  const [scrolled, setScrolled] = useState(false)
  const [currentBgIndex, setCurrentBgIndex] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
    // 4107079290
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
      desc: 'Our curated library covers every course across 100L–500L with downloadable PDFs, past questions, and verified lecture notes.',
      link: '#library',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: '1-hour Exam Simulation',
      desc: 'Take timed CBT mock exams that mimic actual university question patterns and receive instant detailed score analysis.',
      link: '#cbt',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Tutoring',
      desc: 'StudyBuddy AI is trained to explain complex math derivations, science formulae, and assignment questions step-by-step.',
      link: '#ai',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'CGPA Calculator',
      desc: 'Instantly compute your current GPA and cumulative CGPA across all semesters. Plan ahead to hit your target grade.',
      link: '#cgpa',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: 'Discussion Boards',
      desc: 'Ask questions, share insights, and collaborate with peers in course-specific threads moderated by top students.',
      link: '#discuss',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      title: 'Offline Downloads',
      desc: 'Download any study material as a PDF and access it offline during long campus power cuts or without internet.',
      link: '#library',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col selection:bg-purple-200 selection:text-[#4B2E83] font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ─── HERO SECTION (navbar lives inside here) ─── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '620px' }}
      >
        {/* Full-bleed background images with smooth cross-fade slideshow */}
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out pointer-events-none ${
              idx === currentBgIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        {/* Dark + purple overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f30]/85 via-[#1a0f30]/75 to-[#4B2E83]/60 pointer-events-none z-1" />

        {/* ── FULL-WIDTH TOP FROSTED BLUR STRIP (from top of page to bottom of navbar) ── */}
        <div
          className="fixed top-0 inset-x-0 h-[72px] z-40 border-white/20 pointer-events-none transition-all duration-300"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        />

        {/* ── FLOATING FROSTED GLASS NAVBAR ── */}
        <header
          className="fixed top-3 left-4 right-4 py-3 sm:left-6 sm:right-6 lg:left-10 lg:right-10 max-w-7xl mx-auto z-50 rounded-full bg-white/50 border border-white/50 shadow-[0_8px_25px_rgba(107,70,193,0.18)] transition-all duration-300"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <div className="px-4 sm:px-6 lg:px-8 h-12 sm:h-13 flex items-center justify-between gap-4 sm:gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#4B2E83]/10 rounded-full flex items-center justify-center p-1.5">
                <img src={logo} alt="StudyHub" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm sm:text-base font-extrabold text-[#4B2E83] tracking-tight font-['Outfit',sans-serif]">StudyHub</span>
            </Link>

            {/* Desktop Nav — Purple links */}
            <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-bold text-[#4B2E83]">
              <a href="#features"  className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Features</a>
              <a href="#library"   className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">Library</a>
              <a href="#cbt"       className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">CBT Practice</a>
              <a href="#ai"        className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">AI Tutor</a>
              <a href="#cgpa"      className="px-3 py-1.5 rounded-full hover:bg-[#4B2E83]/10 transition-colors">CGPA Calc</a>
            </nav>

            {/* CTA Buttons */}
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
                    Register
                  </Link>
                </>
              )}
              {/* Mobile hamburger */}
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100/80 bg-white/90 rounded-b-3xl px-4 py-3 space-y-1">
              {[
                { label: 'Features',     href: '#features' },
                { label: 'Library',      href: '#library' },
                { label: 'CBT Practice', href: '#cbt' },
                { label: 'AI Tutor',     href: '#ai' },
                { label: 'CGPA Calc',    href: '#cgpa' },
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

        {/* Hero text content — Centered */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-20 lg:pt-40 lg:pb-28 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl mx-auto space-y-7 flex flex-col items-center text-center">

            <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-black text-white leading-[1.1] tracking-tight drop-shadow-md font-['Outfit',sans-serif]">
              Academic tools that{' '}
              <span className="text-purple-300">prepare you</span>{' '}
              for what's next.
            </h1>

            <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed font-medium max-w-xl mx-auto">
              Study smarter, not harder. Access 100+ curated materials, practice real CBT exams, calculate your CGPA, and get instant AI tutoring across all your university courses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
              <button
                onClick={() => navigate(user ? '/library' : '/signup')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4B2E83] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4B2E83]/25 hover:bg-[#3b2368] hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
              >
                <span>Explore Courses</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 border-2 border-white/40 text-white rounded-xl font-bold text-sm hover:bg-white/20 hover:border-white transition-all backdrop-blur-sm w-full sm:w-auto"
              >
                <span>View Resources</span>
              </button>
            </div>

            {/* Mini stats row — Centered */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                { value: '97%',    label: 'Success Rate' },
                { value: '5,000+', label: 'Practice Qs' },
                { value: '100+',   label: 'Study PDFs' },
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

      {/* ─── 3 FEATURE HIGHLIGHT CARDS ─── */}
      <section id="features" className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
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
                  More about this
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
      <section id="library" className="bg-[#faf9f6] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

          {/* Section Header */}
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-bold text-[#4B2E83] uppercase tracking-widest">📚 Popular Resources</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-['Outfit',sans-serif]">
              Find your perfect study material.
            </h2>
          </div>

          {/* Category Filter Tabs */}
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

          {/* Resource Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((res, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(user ? '/library' : '/signup')}
              >
                {/* Card image/banner */}
                <div className={`h-36 bg-gradient-to-br ${res.color} flex items-end justify-start p-4 relative`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTEyIDEydjZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6TTI0IDM0djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
                  <span className="relative z-10 text-xs font-extrabold text-white/80 uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md">
                    {res.type}
                  </span>
                  <span className="absolute top-4 right-4 text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                    {res.level}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#4B2E83] transition-colors">
                    {res.title}
                  </h4>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(user ? '/library' : '/signup') }}
                    className="w-full py-2.5 bg-[#4B2E83] text-white rounded-xl text-xs font-bold hover:bg-[#3b2368] transition-colors shadow-sm shadow-[#4B2E83]/20"
                  >
                    {user ? 'Access Material' : 'Get Access Free'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BANNER ─── */}
      <section className="bg-[#4B2E83] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { stat: '100+', label: 'Study PDFs' },
              { stat: '50+',  label: 'CBT Quizzes' },
              { stat: '5,000+', label: 'Practice Questions' },
              { stat: '24/7', label: 'AI Coach Access' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-white">{item.stat}</p>
                <p className="text-xs sm:text-sm text-purple-200 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#24133B] text-purple-200/80 py-5 text-xs border-t border-purple-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="StudyHub" className="w-7 h-7 object-contain" />
            <span className="text-sm font-extrabold text-white tracking-tight">StudyHub</span>
          </div>
          <p className="text-purple-300/60 text-center">© 2026 StudyHub Academic Workspace. All rights reserved.</p>
          <div className="flex items-center gap-5 font-semibold">
            <Link to="/login"  className="hover:text-white transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
