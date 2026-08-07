import { useEffect } from 'react'

const LegalModal = ({ isOpen, onClose, type }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const isTerms = type === 'terms'
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isTerms ? (
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                Welcome to StudyHub! These terms and conditions outline the rules and regulations for the use of StudyHub's Platform.
              </p>
              <h3 className="text-base font-semibold text-gray-800">1. Acceptance of Terms</h3>
              <p>
                By accessing this platform, we assume you accept these terms and conditions. Do not continue to use StudyHub if you do not agree to take all of the terms and conditions stated on this page.
              </p>
              <h3 className="text-base font-semibold text-gray-800">2. User Accounts</h3>
              <p>
                To access most features of the platform, you must register for an account. You must provide accurate, current, and complete information during the registration process.
              </p>
              <h3 className="text-base font-semibold text-gray-800">3. Platform Rules</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Users must not use the platform to distribute harmful or malicious content.</li>
                <li>Users must not attempt to manipulate the system or cheat in interactive quizzes.</li>
                <li>Respectful communication is required in all forums and chats.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                At StudyHub, accessible from our platform, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by StudyHub and how we use it.
              </p>
              <h3 className="text-base font-semibold text-gray-800">1. Information We Collect</h3>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
              </p>
              <h3 className="text-base font-semibold text-gray-800">2. How We Use Your Information</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, operate, and maintain our platform.</li>
                <li>Improve, personalize, and expand our platform.</li>
                <li>Understand and analyze how you use our platform.</li>
                <li>Develop new products, services, features, and functionality.</li>
              </ul>
              <h3 className="text-base font-semibold text-gray-800">3. Log Files</h3>
              <p>
                StudyHub follows a standard procedure of using log files. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LegalModal
