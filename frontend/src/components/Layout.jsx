import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import dashboardIcon from '../assets/dashboard-square-02.png'
import coursesIcon from '../assets/notebook-02.png'
import quizzesIcon from '../assets/quiz-02.png'
import calculatorIcon from '../assets/calculator-01.png'
import chatIcon from '../assets/chat.png'
import logoutIcon from '../assets/logout-square-01.png'
import sidebarIcon from '../assets/sidebar-left-01.png'
import FeedbackModal from './FeedbackModal'
import AskStudyBuddy from './AskStudyBuddy'
import toast from 'react-hot-toast'
import { faculties, levels } from '../utils/faculties'

const Layout = ({ children }) => {
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const features = [
    { name: 'Dashboard', keywords: ['home', 'dashboard', 'overview', 'stats', 'metrics', 'recent', 'watched', 'countdown'], action: () => navigate('/dashboard') },
    { name: 'Courses', keywords: ['study', 'courses', 'lectures', 'subjects', 'mth 101', 'mth 102', 'phy 101', 'phy 102', 'chm 101', 'chm 102', 'courses list'], action: () => navigate('/courses') },
    { name: 'Quizzes & CBT Simulator', keywords: ['quiz', 'test', 'exam', 'cbt', 'practice', 'simulator', 'mock exam', 'questions'], action: () => navigate('/quizzes') },
    { name: 'Library & Materials', keywords: ['library', 'books', 'past papers', 'materials', 'study materials', 'pdf', 'slides', 'read'], action: () => navigate('/library') },
    { name: 'CGPA Calculator', keywords: ['cgpa', 'gp', 'grades', 'calculator', 'results', 'units', 'calculate'], action: () => navigate('/cgpa-calculator') },
    { name: 'Motivation & Quotes', keywords: ['motivation', 'inspiration', 'morale', 'quotes', 'spark', 'encourage'], action: () => navigate('/motivation') },
    { name: 'Discussion Forum', keywords: ['forum', 'chat', 'discussion', 'groups', 'whatsapp', 'telegram', 'community', 'join'], action: () => navigate('/forum') },
    { name: 'Ask StudyBuddy AI Chatbot', keywords: ['ai', 'chatbot', 'studybuddy', 'buddy', 'helper', 'tutor', 'ask', 'question', 'bot', 'gemini'], action: () => setIsAiOpen(true) },
    { name: 'Logout session', keywords: ['signout', 'logout', 'exit', 'leave'], action: handleLogout }
  ]

  const filteredFeatures = searchQuery.trim() === ''
    ? []
    : features.filter(feat => 
        feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feat.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      )

  // User Profile Menu & Account Settings Modal State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    faculty: '',
    department: '',
    level: '',
    newPassword: '',
  })
  const [settingsDepartments, setSettingsDepartments] = useState([])

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!document.getElementById('search-feature-container')?.contains(e.target) &&
          !document.getElementById('search-feature-container-mobile')?.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (!document.getElementById('user-profile-menu-container')?.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  const openSettingsModal = () => {
    const userFaculty = user?.faculty || ''
    setProfileFormData({
      fullName: user?.fullName || '',
      faculty: userFaculty,
      department: user?.department || '',
      level: user?.level || '100',
      newPassword: '',
    })
    setSettingsDepartments(faculties[userFaculty] || [])
    setSettingsModalOpen(true)
  }

  const handleSettingsFacultyChange = (e) => {
    const selectedFaculty = e.target.value
    setProfileFormData(prev => ({
      ...prev,
      faculty: selectedFaculty,
      department: '',
    }))
    setSettingsDepartments(faculties[selectedFaculty] || [])
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setSettingsLoading(true)

    try {
      const result = await updateProfile({
        fullName: profileFormData.fullName,
        faculty: profileFormData.faculty,
        department: profileFormData.department,
        level: profileFormData.level,
        newPassword: profileFormData.newPassword,
      })

      if (result.success) {
        toast.success('Account profile updated successfully!')
        setSettingsModalOpen(false)
      } else {
        toast.error(result.message || 'Failed to update profile')
      }
    } catch (err) {
      toast.error('An error occurred updating profile.')
    } finally {
      setSettingsLoading(false)
    }
  }

  // Get the first name from fullName
  const getFirstName = () => {
    if (user?.fullName) {
      return user.fullName.split(' ')[0].toUpperCase()
    }
    if (user?.firstName) {
      return user.firstName.toUpperCase()
    }
    return 'USER'
  }

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: dashboardIcon, isImage: true },
    { name: 'Courses', path: '/courses', icon: coursesIcon, isImage: true },
    { name: 'Quizzes', path: '/quizzes', icon: quizzesIcon, isImage: true },
    { name: 'Library', path: '/library', icon: coursesIcon, isImage: true },
    { name: 'CGPA Calculator', path: '/cgpa-calculator', icon: calculatorIcon, isImage: true },
    { name: 'Motivation', path: '/motivation', icon: chatIcon, isImage: true },
    { name: 'Forum', path: '/forum', icon: chatIcon, isImage: true },
  ]

  const isActive = (path) => location.pathname === path

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname)
    return currentItem ? currentItem.name : 'Studyhub'
  }

  return (
    <div className="flex min-h-screen bg-[#faf9f6]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo with Collapse Toggle */}
          <div className={`flex ${sidebarCollapsed ? 'flex-col py-6 px-2 gap-4' : 'flex-row p-6 justify-between gap-3'} items-center border-b border-gray-200`}>
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Studyhub" className="w-10 h-10 object-contain" />
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-purple-brand">StudyHub</span>
              )}
            </Link>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <img src={sidebarIcon} alt="Collapse sidebar" className="w-5 h-5 object-contain" />
              </button>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg
                  transition-colors text-left
                  ${isActive(item.path)
                    ? 'bg-purple-100 text-purple-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title={sidebarCollapsed ? item.name : ''}
              >
                {item.isImage ? (
                  <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain" />
                ) : (
                  <span className="text-xl">{item.icon}</span>
                )}
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <img src={logoutIcon} alt="Logout" className="w-5 h-5 object-contain" />
              {!sidebarCollapsed && <span className="font-semibold text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-transparent px-4 md:px-8 pt-8 pb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors duration-150"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{getPageTitle()}</h1>

            {/* Right side controls: Search, Notifications, Profile */}
            <div className="flex items-center gap-4 md:gap-6 ml-auto">
              {/* Search Bar */}
              <div className="hidden md:block w-64 relative" id="search-feature-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search features (e.g. CGPA, AI)..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Search Feature Dropdown */}
                {dropdownOpen && searchQuery.trim() !== '' && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-155 rounded-2xl shadow-xl z-[90] overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Features & Tools
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredFeatures.length > 0 ? (
                        filteredFeatures.map((feat, idx) => (
                          <button
                            key={idx}
                            onMouseDown={() => {
                              feat.action()
                              setSearchQuery('')
                              setDropdownOpen(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-brand font-semibold transition-colors flex items-center justify-between"
                          >
                            <span>{feat.name}</span>
                            <svg className="w-3 h-3 text-purple-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
                          No matching features found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Search Toggle Button */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-full transition-all border border-transparent hover:border-gray-150"
                aria-label="Search features"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-full transition-all border border-transparent hover:border-gray-150">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* User Profile */}
              <div className="relative" id="user-profile-menu-container">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all focus:outline-none cursor-pointer"
                  aria-label="User menu"
                >
                  <span className="hidden md:block text-sm font-bold text-gray-800 uppercase tracking-wide pl-1">
                    {getFirstName()}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200 shadow-xs">
                    <span className="text-purple-brand font-black">
                      {getFirstName().charAt(0)}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden md:block ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-150 rounded-2xl shadow-2xl z-[90] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border-b border-gray-100">
                      <p className="font-extrabold text-sm text-gray-900 truncate">{user?.fullName || getFirstName()}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || 'student@university.edu'}</p>
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-brand uppercase tracking-wider">
                          {user?.isGuest ? 'Guest Account' : `${user?.level || '100'}L Student`}
                        </span>
                        {user?.department && (
                          <span className="text-[11px] font-medium text-gray-500 truncate max-w-[130px]">
                            • {user.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          openSettingsModal()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-brand rounded-xl transition-colors text-left"
                      >
                        <svg className="w-4 h-4 text-purple-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Account & Profile Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          navigate('/library')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-brand rounded-xl transition-colors text-left"
                      >
                        <svg className="w-4 h-4 text-purple-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Library & Notes</span>
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Floating Chatbot Toggle Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 z-[70] w-14 h-14 bg-purple-brand text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-200"
        title="Ask StudyBuddy"
        aria-label="Ask StudyBuddy"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <AskStudyBuddy
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-x-0 top-0 bg-[#faf9f6] z-[100] px-4 py-4 shadow-md border-b border-gray-200 flex items-center gap-3 animate-in slide-in-from-top duration-150">
          <div className="flex-1 relative" id="search-feature-container-mobile">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search features (e.g. CGPA, AI)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm"
              autoFocus
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Mobile Suggestions Dropdown */}
            {dropdownOpen && searchQuery.trim() !== '' && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-gray-155 rounded-2xl shadow-xl z-[110] overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Features & Tools
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredFeatures.length > 0 ? (
                    filteredFeatures.map((feat, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => {
                          feat.action()
                          setSearchQuery('')
                          setDropdownOpen(false)
                          setMobileSearchOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-brand font-semibold transition-colors flex items-center justify-between"
                      >
                        <span>{feat.name}</span>
                        <svg className="w-3 h-3 text-purple-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
                      No matching features found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setMobileSearchOpen(false)
              setSearchQuery('')
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Account Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsModalOpen(false)} />
          <div className="relative max-w-md w-full bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Account Settings</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Manage your profile and academic credentials</p>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {user?.isGuest ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-brand rounded-full flex items-center justify-center mx-auto text-xl font-black">
                  G
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Guest Student Account</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    You are currently using a temporary guest session. Create a free account to save your academic progress and settings permanently!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSettingsModalOpen(false)
                    navigate('/signup')
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold shadow-md shadow-[#4B2E83]/20 hover:shadow-lg transition-all text-xs"
                >
                  Create Permanent Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-name" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    required
                    value={profileFormData.fullName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                  />
                </div>

                {/* Email (Read only) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-email" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-100/70 text-sm text-gray-500 cursor-not-allowed select-none"
                  />
                </div>

                {/* Faculty Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-faculty" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Faculty
                  </label>
                  <select
                    id="settings-faculty"
                    required
                    value={profileFormData.faculty}
                    onChange={handleSettingsFacultyChange}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Faculty</option>
                    {Object.keys(faculties).map((fac) => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                {/* Department Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-dept" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    id="settings-dept"
                    required
                    value={profileFormData.department}
                    onChange={(e) => setProfileFormData({ ...profileFormData, department: e.target.value })}
                    disabled={!profileFormData.faculty || settingsDepartments.length === 0}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer disabled:bg-gray-100/70 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {profileFormData.faculty ? 'Select Department' : 'Select Faculty first'}
                    </option>
                    {settingsDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Level */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settings-level" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Academic Level
                  </label>
                  <select
                    id="settings-level"
                    required
                    value={profileFormData.level}
                    onChange={(e) => setProfileFormData({ ...profileFormData, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all appearance-none cursor-pointer"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}L</option>
                    ))}
                  </select>
                </div>

                {/* Change Password (Optional) */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                  <label htmlFor="settings-password" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    New Password <span className="text-gray-400 font-normal capitalize">(Optional)</span>
                  </label>
                  <input
                    id="settings-password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={profileFormData.newPassword}
                    onChange={(e) => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#4B2E83] focus:ring-4 focus:ring-[#4B2E83]/10 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSettingsModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white rounded-xl font-bold shadow-md shadow-[#4B2E83]/20 hover:shadow-lg transition-all text-xs disabled:opacity-60"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <FeedbackModal />
    </div>
  )
}

export default Layout

