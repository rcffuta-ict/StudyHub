import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import Pagination from '../components/Pagination'
import { coursesAPI } from '../services/api'
import toast from 'react-hot-toast'

const Forum = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await coursesAPI.getAllCourses()
      // Filter courses that have forum links
      const coursesWithLinks = response.data.filter(
        course => course.forumLinks && course.forumLinks.length > 0
      )
      setCourses(coursesWithLinks)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load forum links')
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform) => {
    return null
  }

  const getPlatformColor = (platform) => {
    const colors = {
      WhatsApp: 'bg-green-100 text-green-700 border-green-300',
      Telegram: 'bg-blue-100 text-blue-700 border-blue-300',
      Discord: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      Facebook: 'bg-blue-100 text-blue-700 border-blue-300',
      Other: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.faculty?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Course Forums & Communities</h2>
            <p className="text-sm text-gray-600 mt-1">
              Join course-specific communities to connect with other students, ask questions, and discuss topics.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search forums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2E83]"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No forum links available</p>
            <p className="text-sm">
              {searchQuery ? 'No course forums match your search query.' : 'Course administrators will add community links here. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              {paginatedCourses.map((course) => (
                <div
                  key={course._id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.faculty} • {course.department} • Level {course.level}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.forumLinks?.length || 0} community link{course.forumLinks?.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedCourse === course._id ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedCourse === course._id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="space-y-3">
                        {course.forumLinks.map((link) => (
                          <div
                            key={link._id}
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getPlatformIcon(link.platform) && (
                                    <span className="text-xl">{getPlatformIcon(link.platform)}</span>
                                  )}
                                  <h4 className="font-semibold text-gray-900">{link.title}</h4>
                                  <span
                                    className={`px-2 py-1 text-xs rounded border ${getPlatformColor(link.platform)}`}
                                  >
                                    {link.platform}
                                  </span>
                                </div>
                                {link.description && (
                                  <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                                )}
                              </div>
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4B2E83] text-white rounded-lg hover:bg-purple-800 transition-colors text-sm font-medium"
                            >
                              <span>Join Community</span>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCourses.length}
              itemsPerPage={itemsPerPage}
              className="mt-6"
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Forum
