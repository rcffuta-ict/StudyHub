import { useNavigate } from 'react-router-dom'

const BrowseCourseCard = ({ course, isEnrolled, onEnroll, onUnenroll, enrolling }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (isEnrolled) navigate(`/courses/${course._id || course.id}`)
  }

  const handleEnrollClick = (e) => {
    e.stopPropagation()
    if (!isEnrolled && onEnroll) onEnroll(course._id || course.id)
  }

  const handleUnenrollClick = (e) => {
    e.stopPropagation()
    if (isEnrolled && onUnenroll) onUnenroll(course._id || course.id)
  }

  const levelColors = {
    '100': 'bg-emerald-500',
    '200': 'bg-blue-500',
    '300': 'bg-amber-500',
    '400': 'bg-rose-500',
    '500': 'bg-purple-600',
  }
  const levelBg = levelColors[String(course.level)] || 'bg-gray-500'

  return (
    <div
      onClick={isEnrolled ? handleClick : undefined}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#4B2E83]/20 ${isEnrolled ? 'cursor-pointer' : ''}`}
    >
      {/* Image */}
      <div className="relative w-full h-44 overflow-hidden flex-shrink-0">
        <img
          src={course.image || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop'}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex gap-2">
          {course.level && (
            <span className={`${levelBg} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
              {course.level}L
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-[#4B2E83] text-xs font-bold px-2.5 py-1 rounded-full shadow">
            {course.units || 3} Units
          </span>
        </div>

        {/* Enrolled ribbon */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#4B2E83]/90 py-1.5 text-center">
            <span className="text-white text-xs font-semibold tracking-wide">✓ Enrolled</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Topics count */}
        <p className="text-xs font-semibold text-[#4B2E83]/70 uppercase tracking-wider mb-1.5">
          {course.topics || 0} {course.topics === 1 ? 'Topic' : 'Topics'}
        </p>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-[#4B2E83] transition-colors">
          {course.title}
        </h3>

        {/* Faculty / Dept */}
        <div className="flex-1 mb-4">
          {course.faculty && (
            <p className="text-xs text-gray-500 leading-relaxed">{course.faculty}</p>
          )}
          {course.department && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">{course.department}</p>
          )}
        </div>

        {/* CTA Button */}
        {isEnrolled ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClick}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#4B2E83] to-[#5e3da1] text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-[#4B2E83]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              View Course →
            </button>
            {onUnenroll && (
              <button
                onClick={handleUnenrollClick}
                disabled={enrolling}
                title="Terminate Enrollment"
                className="px-3 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                Drop
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleEnrollClick}
            disabled={enrolling}
            className="w-full py-2.5 border-2 border-[#4B2E83] text-[#4B2E83] text-sm font-bold rounded-xl hover:bg-[#4B2E83] hover:text-white hover:shadow-lg hover:shadow-[#4B2E83]/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {enrolling ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enrolling...
              </span>
            ) : 'Enroll Now'}
          </button>
        )}
      </div>
    </div>
  )
}

export default BrowseCourseCard
