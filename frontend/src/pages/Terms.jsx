import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <img src={logo} alt="StudyHub" className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        
        <div className="prose prose-indigo max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing and using StudyHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Description of Service</h2>
          <p className="mb-4">StudyHub provides an academic workspace including study materials, quizzes, CGPA calculation, and student collaboration tools. We reserve the right to modify or discontinue any feature without notice.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. User Conduct</h2>
          <p className="mb-4">You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Academic integrity must be maintained when using our materials.</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Intellectual Property</h2>
          <p className="mb-4">All content provided on StudyHub, including course materials and quizzes, is protected by copyright and other intellectual property laws. You may not distribute or modify these materials without permission.</p>
          
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

export default Terms
