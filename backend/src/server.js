import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import { verifyEmailConfig } from './utils/emailService.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import courseAdminRoutes from './routes/courseAdminRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import libraryRoutes from './routes/libraryRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import cbtRoutes from './routes/cbtRoutes.js'

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

// Verify email configuration on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  verifyEmailConfig().catch((error) => {
    console.warn('Email service not configured properly:', error.message)
  })
}

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // limit each IP to 100 requests per windowMs (10000 in dev)
})
app.use('/api/', limiter)

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/course-admin', courseAdminRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/cbt', cbtRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app
