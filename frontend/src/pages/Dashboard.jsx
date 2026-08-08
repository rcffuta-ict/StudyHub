import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import MetricsCard from '../components/MetricsCard'
import CountdownTimer from '../components/CountdownTimer'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'

const FIRST_SEM_DATE = new Date('2026-03-02T00:00:00.000Z')
const SECOND_SEM_DATE = new Date('2026-08-22T23:59:59.000Z')

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [academicSeason, setAcademicSeason] = useState('second-semester')
  const [dashboardData, setDashboardData] = useState({
    coursesEnrolled: 0,
    overallProgress: 0,
    studyHours: 0,
    upcomingExam: null,
    recentlyWatched: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAcademicSeason = async () => {
      try {
        const response = await dashboardAPI.getAcademicSeason()
        if (response.data?.season) {
          setAcademicSeason(response.data.season)
        }
      } catch (error) {
        console.error('Error fetching academic season:', error)
        let saved = localStorage.getItem('studyhub_academic_season')
        if (saved === 'first-semester' && new Date() > FIRST_SEM_DATE) {
          saved = 'second-semester'
        }
        setAcademicSeason(saved || 'second-semester')
      }
    }
    fetchAcademicSeason()
  }, [])

  const getExamDate = () => {
    return academicSeason === 'second-semester' ? SECOND_SEM_DATE : FIRST_SEM_DATE
  }

  const getDailySpark = () => {
    if (academicSeason === 'academic-break') {
      return {
        title: "Break Phase: Skill & Career Building",
        text: "Leverage this holiday to acquire practical software, engineering, or design skills. Build personal projects, participate in coding clubs, or study advanced math models. A few hours of consistent learning compounds over time!",
        quote: "Live as if you were to die tomorrow. Learn as if you were to live forever. — Mahatma Gandhi"
      }
    } else {
      return {
        title: "Semester Phase: Diligence & Focus",
        text: "With exams around the corner, practice active recall. Don't just re-read notes—test yourself. Review FUTA CBT simulators, outline essay answers, and maintain a spiritual balance to keep your mind centered.",
        quote: "Excellence is an art won by training and habituation. — Aristotle"
      }
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await dashboardAPI.getDashboard()
        setDashboardData(response.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        const target = getExamDate()
        const now = new Date()
        const daysRemaining = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
        setDashboardData({
          coursesEnrolled: 0,
          overallProgress: 0,
          studyHours: 0,
          upcomingExam: {
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
            examName: academicSeason === 'second-semester' ? 'Second Semester Exams' : 'First Semester Exams',
            startDate: target.toISOString()
          },
          recentlyWatched: []
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, academicSeason])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        
        {/* ── Metrics Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <MetricsCard
            title="Courses Enrolled"
            value={dashboardData.coursesEnrolled}
            description="Active tracked courses"
            colorClass="text-indigo-600 bg-indigo-50"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <MetricsCard
            title="Overall Progress"
            value={`${dashboardData.overallProgress}%`}
            description="Average syllabus completion"
            colorClass="text-emerald-600 bg-emerald-50"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <MetricsCard
            title="Study Hours"
            value={`${dashboardData.studyHours}h`}
            description="Total focused hours"
            colorClass="text-amber-600 bg-amber-50"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Countdown / Season Banner ── */}
        {academicSeason === 'academic-break' ? (
          <div className="bg-gradient-to-r from-[#2c1854] to-[#4B2E83] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xl font-bold font-heading mb-1.5">Academic Recess &amp; Skills Break</h2>
            <p className="text-purple-200 text-sm max-w-2xl leading-relaxed">
              Classes are currently on hold. Use this period to recharge, learn software tools, and read ahead. Academic excellence begins in the off-season!
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#2c1854] via-[#4B2E83] to-[#5e3da1] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Background decoration */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black font-heading tracking-tight">
                Semester Exams Period
              </h2>
              <p className="text-purple-200 mt-1.5 font-bold text-xs uppercase tracking-widest">
                {academicSeason === 'second-semester' ? 'Second Semester Exams' : 'First Semester Exams'} end in...
              </p>
            </div>
            <div className="w-full md:w-auto relative z-10">
              <CountdownTimer targetDate={getExamDate().toISOString()} />
            </div>
          </div>
        )}

        {/* ── Daily Spark Widget ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col lg:flex-row justify-between items-stretch gap-6 transition-all duration-300 hover:shadow-md">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 bg-purple-50 text-[#4B2E83] rounded-full uppercase tracking-wider">
                ⚡ Daily Academic Spark
              </span>
              <h3 className="font-bold text-gray-900 mt-3 text-lg">{getDailySpark().title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{getDailySpark().text}</p>
            </div>
          </div>
          
          <div className="lg:w-80 bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            {/* Quote icon background decoration */}
            <div className="absolute -right-2 -bottom-2 text-gray-200/50 pointer-events-none">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.748-9.762 9-10.361l.412.916c-3.268.722-5.416 2.768-5.416 5.742h5.163v11.094h-9.159zm-14 0v-7.391c0-5.704 3.748-9.762 9-10.361l.412.916c-3.268.722-5.416 2.768-5.416 5.742h5.163v11.094h-9.159z" />
              </svg>
            </div>
            
            <p className="text-sm italic text-gray-700 leading-relaxed relative z-10 mb-4">
              "{getDailySpark().quote.split(' — ')[0]}"
            </p>
            <span className="text-xs font-bold text-[#4B2E83] tracking-wide relative z-10 block">
              — {getDailySpark().quote.split(' — ')[1] || 'Author'}
            </span>
          </div>
        </div>

        {/* ── Recently Watched Section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-extrabold text-gray-900 mb-5 tracking-tight">Recently Watched</h2>
          {dashboardData.recentlyWatched && dashboardData.recentlyWatched.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dashboardData.recentlyWatched.map((item, index) => {
                const thumbnail = item.youtubeId 
                  ? `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`
                  : 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'
                
                return (
                  <div 
                    key={index} 
                    onClick={() => item.courseId && navigate(`/courses/${item.courseId}`)}
                    className={`group border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#4B2E83]/20 transition-all duration-300 bg-white ${item.courseId ? 'cursor-pointer' : ''}`}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black flex-shrink-0">
                      <img 
                        src={thumbnail} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-white/90 text-[#4B2E83] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Metadata */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[10px] font-bold text-[#4B2E83] uppercase tracking-wider block mb-1">
                          {item.course}
                        </span>
                        <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-[#4B2E83] transition-colors">
                          {item.title}
                        </h3>
                        {item.topic && (
                          <p className="text-xs text-gray-400 mt-1 leading-normal line-clamp-1">Topic: {item.topic}</p>
                        )}
                      </div>
                      
                      {item.watchedAt && (
                        <p className="text-[10px] text-gray-400 font-medium mt-3 border-t border-gray-50 pt-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Watched {new Date(item.watchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="font-bold text-sm text-gray-700">No recently watched content</p>
              <p className="text-xs mt-1 text-gray-400">Start watching course videos to track your progress here.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
