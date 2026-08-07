import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoadingSpinner from './components/LoadingSpinner'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Quizzes from './pages/Quizzes'
import Library from './pages/Library'
import CGPACalculator from './pages/CGPACalculator'
import Motivation from './pages/Motivation'
import Forum from './pages/Forum'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CourseAdminLogin from './pages/CourseAdminLogin'
import CourseAdminDashboard from './pages/CourseAdminDashboard'
import ForgotPassword from './pages/ForgotPassword'
import EnterOTP from './pages/EnterOTP'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Notifications from './pages/Notifications'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || ''
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (user) {
    if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      return <Navigate to="/admin/dashboard" />
    }
    return children
  }
  
  return <Navigate to="/login" />
}

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return user ? <Navigate to="/dashboard" /> : children
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || ''
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/admin/login" />
  }
  
  if (user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

// Course Admin Route Component
const CourseAdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/course-admin/login" />
  }
  
  return children
}

import { GoogleOAuthProvider } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
      <Router>
        <div className="w-full min-h-screen">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/courses" 
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/courses/:courseId" 
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quizzes" 
              element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cgpa-calculator" 
              element={
                <ProtectedRoute>
                  <CGPACalculator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/motivation" 
              element={
                <ProtectedRoute>
                  <Motivation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forum" 
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/login" 
              element={<AdminLogin />} 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route 
              path="/course-admin/login" 
              element={<CourseAdminLogin />} 
            />
            <Route 
              path="/course-admin/dashboard" 
              element={
                <CourseAdminRoute>
                  <CourseAdminDashboard />
                </CourseAdminRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/enter-otp" element={<EnterOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* 404 - Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App

