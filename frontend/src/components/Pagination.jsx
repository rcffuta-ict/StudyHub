import React from 'react'

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 6,
  className = ''
}) => {
  if (totalPages <= 1) return null

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-gray-100 ${className}`}>
      {totalItems > 0 ? (
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{startIndex}</span> to{' '}
          <span className="font-bold text-gray-900">{endIndex}</span> of{' '}
          <span className="font-bold text-gray-900">{totalItems}</span> results
        </p>
      ) : <div />}

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:bg-purple-50 hover:text-[#4B2E83] hover:border-purple-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 disabled:hover:border-gray-200 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400 font-bold">
                ...
              </span>
            ) : (
              <button
                type="button"
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-[#4B2E83] text-white shadow-sm shadow-[#4B2E83]/30'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:bg-purple-50 hover:text-[#4B2E83] hover:border-purple-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 disabled:hover:border-gray-200 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination
