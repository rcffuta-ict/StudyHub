import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're not already on login/signup pages
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      localStorage.removeItem('token')
      localStorage.removeItem('isGuest')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('isGuest')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  googleLogin: (tokenData) => api.post('/auth/google', tokenData),
  getMe: () => api.get('/auth/me'),
  guestLogin: () => api.post('/auth/guest-login'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
}

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getAcademicSeason: () => api.get('/dashboard/academic-season'),
}

// Courses API
export const coursesAPI = {
  getMyCourses: () => api.get('/courses/my-courses'),
  getAllCourses: () => api.get('/courses'),
  getCourseDetails: (courseId) => api.get(`/courses/${courseId}`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
  unenrollCourse: (courseId) => api.delete(`/courses/${courseId}/enroll`),
}

// Progress API
export const progressAPI = {
  markVideoComplete: (courseId, topicId, videoId, watchTime) => 
    api.post('/progress/complete', { courseId, topicId, videoId, watchTime }),
  updateWatchTime: (courseId, topicId, videoId, watchTime) => 
    api.post('/progress/watch-time', { courseId, topicId, videoId, watchTime }),
  trackVideoWatch: (courseId, topicId, videoId) => 
    api.post('/progress/track', { courseId, topicId, videoId }),
  getCourseProgress: (courseId) => 
    api.get(`/progress/course/${courseId}`),
}

// Admin API
export const adminAPI = {
  importPlaylist: (data) => api.post('/admin/import-playlist', data),
  importSingleVideo: (data) => api.post('/admin/import-video', data),
  uploadMaterial: (formData) => api.post('/admin/upload-material', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllCourses: () => api.get('/admin/courses'),
  getCourseDetails: (courseId) => api.get(`/admin/courses/${courseId}`),
  deleteTopic: (topicId) => api.delete(`/admin/topics/${topicId}`),
  createCourse: (data) => api.post('/admin/courses', data),
  generateCourseAccessToken: (courseId) => api.post('/course-admin/generate-token', { courseId }),
  updateAcademicSeason: (season) => api.put('/admin/academic-season', { season }),
  getContactMessages: () => api.get('/admin/messages'),
  updateMessageStatus: (id, status) => api.patch(`/admin/messages/${id}/status`, { status }),
  deleteContactMessage: (id) => api.delete(`/admin/messages/${id}`),
}

// Course Admin API
export const courseAdminAPI = {
  login: (data) => api.post('/course-admin/login', data),
  getMyCourses: () => api.get('/course-admin/my-courses'),
  getCourseDetails: (courseId) => api.get(`/course-admin/courses/${courseId}`),
  importPlaylist: (data) => api.post('/course-admin/import-playlist', data),
  importSingleVideo: (data) => api.post('/course-admin/import-video', data),
  uploadMaterial: (formData) => api.post('/course-admin/upload-material', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addForumLink: (courseId, data) => api.post(`/course-admin/courses/${courseId}/forum-links`, data),
  updateForumLink: (courseId, linkId, data) => api.put(`/course-admin/courses/${courseId}/forum-links/${linkId}`, data),
  deleteForumLink: (courseId, linkId) => api.delete(`/course-admin/courses/${courseId}/forum-links/${linkId}`),
  updateCourse: (courseId, data) => api.put(`/course-admin/courses/${courseId}`, data),
}

// AI API
export const aiAPI = {
  askStudyBuddy: (prompt) => api.post('/ai/ask', { prompt }),
}

// Library API
export const libraryAPI = {
  getMaterials: () => api.get('/library'),
  uploadMaterial: (formData) => api.post('/library/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDownloadUrl: (filename) => `${API_URL}/library/download/${encodeURIComponent(filename)}`,
}

// Contact API
export const contactAPI = {
  submitMessage: (data) => api.post('/contact', data),
}

export default api
