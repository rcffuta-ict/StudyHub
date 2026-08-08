import React, { createContext, useState, useEffect, useContext } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  })

  useEffect(() => {
    const isGuestSession = 
      localStorage.getItem('isGuest') === 'true' || 
      sessionStorage.getItem('isGuest') === 'true'
    if (isGuestSession) {
      const guestId = localStorage.getItem('guestId') || sessionStorage.getItem('guestId') || 'guest'
      setUser({
        _id: guestId,
        isGuest: true,
        fullName: 'Guest Student',
        email: 'guest@studyhub.com',
        level: '100',
        faculty: 'Science & Tech',
        department: 'Computer Science'
      })
      setLoading(false)
    } else if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data)
    } catch (error) {
      console.error('Error loading user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const loginAsGuest = async (rememberMe = false) => {
    try {
      const response = await authAPI.guestLogin()
      const { token: newToken, ...guestUser } = response.data
      setUser(guestUser)
      setToken(newToken)
      
      const guestId = guestUser._id || guestUser.id || 'guest'
      const currentCount = parseInt(localStorage.getItem(`loginCount_${guestId}`) || '0', 10)
      localStorage.setItem(`loginCount_${guestId}`, (currentCount + 1).toString())
      
      if (rememberMe) {
        localStorage.setItem('token', newToken)
        localStorage.setItem('isGuest', 'true')
        localStorage.setItem('guestId', guestId)
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('isGuest')
        sessionStorage.removeItem('guestId')
      } else {
        sessionStorage.setItem('token', newToken)
        sessionStorage.setItem('isGuest', 'true')
        sessionStorage.setItem('guestId', guestId)
        localStorage.removeItem('token')
        localStorage.removeItem('isGuest')
        localStorage.removeItem('guestId')
      }
      return { success: true }
    } catch (error) {
      console.error('Guest login failed:', error)
      return { success: false, message: error.response?.data?.message || 'Guest login failed' }
    }
  }

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login({ email, password })
      const { token: newToken, ...userData } = response.data
      setToken(newToken)
      
      if (rememberMe) {
        localStorage.setItem('token', newToken)
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('isGuest')
        localStorage.removeItem('isGuest')
      } else {
        sessionStorage.setItem('token', newToken)
        localStorage.removeItem('token')
        localStorage.removeItem('isGuest')
        sessionStorage.removeItem('isGuest')
      }
      
      setUser(userData)
      const userId = userData._id || userData.id || 'anonymous'
      const currentCount = parseInt(localStorage.getItem(`loginCount_${userId}`) || '0', 10)
      localStorage.setItem(`loginCount_${userId}`, (currentCount + 1).toString())

      return { success: true }
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0]
        return {
          success: false,
          message: firstError.msg || firstError.message || 'Login failed',
        }
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      }
    }
  }

  const register = async (userData) => {
    try {
      const payload = {
        ...userData,
        fullName: userData.fullName || userData.name,
      }
      const response = await authAPI.register(payload)
      const { token: newToken, ...userInfo } = response.data
      setToken(newToken)
      localStorage.setItem('token', newToken)
      setUser(userInfo)

      const userId = userInfo._id || userInfo.id || 'anonymous'
      const currentCount = parseInt(localStorage.getItem(`loginCount_${userId}`) || '0', 10)
      localStorage.setItem(`loginCount_${userId}`, (currentCount + 1).toString())

      return { success: true }
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0]
        return {
          success: false,
          message: firstError.msg || firstError.message || 'Registration failed',
        }
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      }
    }
  }

  const googleLogin = async (tokenData) => {
    try {
      const response = await authAPI.googleLogin(tokenData)
      
      // If backend needs registration info (faculty, department, level)
      if (response.data.needRegistrationInfo) {
        return {
          success: true,
          needRegistrationInfo: true,
          email: response.data.email,
          fullName: response.data.fullName,
        }
      }

      // If user was successfully authenticated (either logged in or registered)
      const { token: newToken, ...userData } = response.data
      setToken(newToken)
      
      localStorage.setItem('token', newToken)
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('isGuest')
      localStorage.removeItem('isGuest')

      setUser(userData)
      const userId = userData._id || userData.id || 'anonymous'
      const currentCount = parseInt(localStorage.getItem(`loginCount_${userId}`) || '0', 10)
      localStorage.setItem(`loginCount_${userId}`, (currentCount + 1).toString())

      return { success: true }
    } catch (error) {
      console.error('Google Auth login failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Google authentication failed',
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('isGuest')
    localStorage.removeItem('guestId')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('isGuest')
    sessionStorage.removeItem('guestId')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(prev => ({ ...prev, ...response.data }))
      return { success: true }
    } catch (error) {
      console.error('Update profile failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    googleLogin,
    register,
    loginAsGuest,
    updateProfile,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

