import React from 'react'
import Layout from '../components/Layout'

const Notifications = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#4B2E83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No notification for now</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            You're all caught up! In the future, you'll receive timed reminders for course tutorials and fellowship events here.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Notifications
