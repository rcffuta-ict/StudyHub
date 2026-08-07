import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <img src={logo} alt="StudyHub" className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        
        <div className="prose prose-indigo max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Information We Collect</h2>
          <p className="mb-4">We collect information you provide directly to us, such as when you create an account (email, faculty, department, level) or use our academic tools. We also collect usage data to improve our services.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, communicate with you, and personalize your academic experience on StudyHub.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. Information Sharing</h2>
          <p className="mb-4">We do not share your personal information with third parties except as described in this privacy policy, such as with your consent or for legal reasons.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Security</h2>
          <p className="mb-4">We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link to="/" className="text-[#4B2E83] hover:underline font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
