import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import dashboardIcon from '../assets/dashboard-square-02.png'
import logoutIcon from '../assets/logout-square-01.png'

// Small reusable Material Symbols icon helper (font already loaded globally, see index.html/index.css)
const Icon = ({ name, className = '' }) => (
  <span className={`icon-sym ${className}`} aria-hidden="true">{name}</span>
)

// Pass `sections` + `activeSection` + `onSectionChange` to render a real sidebar
// menu for a page with multiple internal views (e.g. AdminDashboard), instead of
// the single default "Admin Dashboard" scroll-to-top item.
const AdminLayout = ({ children, sections, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get the first name from fullName
  const getFirstName = () => {
    if (user?.fullName) {
      return user.fullName.split(' ')[0].toUpperCase()
    }
    if (user?.firstName) {
      return user.firstName.toUpperCase()
    }
    return 'ADMIN'
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const navigationItems = sections || [
    { key: 'dashboard', name: 'Admin Dashboard', path: '/admin/dashboard', icon: dashboardIcon, isImage: true, action: 'scroll' },
  ]

  const isActive = (item) => (sections ? item.key === activeSection : location.pathname === item.path)

  const getPageTitle = () => {
    if (sections) {
      return sections.find((s) => s.key === activeSection)?.name || 'Admin Dashboard'
    }
    if (location.pathname === '/admin/dashboard') {
      return 'Admin Dashboard'
    }
    return 'Admin'
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
          w-64 bg-[#faf9f6] border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <img src={logo} alt="Studyhub" className="w-10 h-10" />
            <span className="text-xl font-bold text-purple-brand">Studyhub Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.key || item.path}
                onClick={() => {
                  if (sections) {
                    onSectionChange?.(item.key)
                  } else if (item.action === 'scroll') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else if (item.path) {
                    navigate(item.path)
                  }
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors text-left
                  ${isActive(item)
                    ? 'bg-purple-100 text-purple-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.isImage ? (
                  <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain" />
                ) : sections ? (
                  <Icon name={item.icon} className="text-xl" />
                ) : (
                  <span className="text-xl">{item.icon}</span>
                )}
                <span className="flex-1">{item.name}</span>
                {Boolean(item.badge) && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive(item) ? 'bg-purple-brand/15 text-purple-brand' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <img src={logoutIcon} alt="Logout" className="w-5 h-5 object-contain" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getPageTitle()}</h1>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {getFirstName()}
              </span>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-brand font-semibold">
                  {getFirstName().charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

