import { useNavigate } from 'react-router-dom'

const CourseCard = ({ course, onUnenroll, enrolling }) => {
  const navigate = useNavigate()

  const formatDate = (dateString) => {
    if (!dateString) return 'No activity yet'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleClick = () => {
    navigate(`/courses/${course._id || course.id}`)
  }

  const progress = course.progress || 0
  const isCompleted = progress === 100
  const progressColor = isCompleted
    ? 'from-purple-500 to-indigo-600'
    : progress > 50
    ? 'from-[#4B2E83] to-[#7c5cbf]'
    : 'from-[#4B2E83] to-[#9b7dd4]'

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-[#4B2E83]/20"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left accent bar */}
        <div className="w-full sm:w-1.5 h-1.5 sm:h-auto bg-gradient-to-b from-[#4B2E83] to-[#7c5cbf] flex-shrink-0 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl" />

        {/* Course Image */}
        <div className="w-full sm:w-44 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={course.image || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Course Details */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              {/* Topics & title */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#4B2E83]/60 uppercase tracking-wider mb-1">
                  {course.topics || 0} {course.topics === 1 ? 'Topic' : 'Topics'}
                </p>
                <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-[#4B2E83] transition-colors">
                  {course.title}
                </h3>
              </div>

              {/* Units badge */}
              <span className="flex-shrink-0 bg-[#4B2E83]/10 text-[#4B2E83] text-xs font-bold px-3 py-1 rounded-full">
                {course.units || 3} Units
              </span>
            </div>

            {/* Status badge */}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 border border-purple-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Completed
              </span>
            )}
          </div>

          {/* Progress Section */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600">Progress</span>
              <span className={`text-xs font-bold ${isCompleted ? 'text-purple-700' : 'text-[#4B2E83]'}`}>
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${progressColor} h-2.5 rounded-full transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.lastActivity ? `Active ${formatDate(course.lastActivity)}` : 'No activity yet'}
              </p>

              {onUnenroll && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnenroll(course._id || course.id)
                  }}
                  disabled={enrolling}
                  className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  Unenroll
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCard
