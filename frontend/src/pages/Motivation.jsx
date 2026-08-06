import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'

const Motivation = () => {
  const [activeTab, setActiveTab] = useState('morale') // 'morale', 'spiritual', 'insights'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 2

  const [activeQuote, setActiveQuote] = useState({
    text: "Education is not the learning of facts, but the training of the mind to think.",
    author: "Albert Einstein"
  })

  const boosters = [
    { text: "Your matric number is just a code, but your character determines your real destination. Keep studying!", author: "StudyHub Daily Spark" },
    { text: "The difference between a successful student and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.", author: "Vince Lombardi" },
    { text: "Don't study to pass; study to understand and build solutions. FUTA was founded on technology, build the future!", author: "Alumnus Quote" },
    { text: "A bad grade is a feedback loop, not a definition of your intelligence. Reset, adjust your strategy, and execute.", author: "Academic Advisor" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Whatever your hands find to do, do it with all your might. Excellence is a spiritual habit.", author: "Purpose Drive" },
    { text: "The software code you write today could automate water systems or medical diagnostics tomorrow. Take that class seriously.", author: "Tech Visionary" }
  ]

  const moraleFeeds = [
    {
      title: "Coping with Exam Anxiety",
      category: "Mental Prep",
      content: "Exam anxiety is normal. When cortisol spikes, it impairs active memory retrieval. To fight this: use the Pomodoro technique (25m study, 5m break) to build focus in chunks. Breathe deeply before opening the examination paper. Remember that preparation is the ultimate antidote to fear."
    },
    {
      title: "Consistency Over Intensity",
      category: "Study Habits",
      content: "Studying 10 hours straight the night before a test is far less effective than studying 1 hour daily for 10 days. The brain consolidates information during REM sleep. Distributed practice allows neural pathways to strengthen, turning short-term memory into permanent cognitive schemas."
    },
    {
      title: "The Art of Active Recall",
      category: "Learning Method",
      content: "Re-reading highlighted textbook sections is a passive illusion of competence. Instead, try self-testing. Close your notebook and write down everything you remember. This forces the brain to retrieve information, forming deeper synaptic links that make retrieval during exams effortless."
    }
  ]

  const spiritualFeeds = [
    {
      title: "Finding the 'Why' Behind Your Degree",
      category: "Life Purpose",
      content: "When studies get heavy, remember why you started. Education is not just about securing a salary grade; it is about equipping yourself to serve your community, solve complex engineering problems, and lift others up. Aligning your daily learning with a service-driven purpose makes the long hours meaningful."
    },
    {
      title: "Excellence as a Lifelong Virtue",
      category: "Virtue & Character",
      content: "Excellence is not an act, but a habit. Doing your assignments diligently, respecting deadlines, and researching beyond the syllabus are exercises in building character. The integrity you display in your 100L calculations is the same integrity you will carry into bridge constructions and software systems."
    },
    {
      title: "Quiet Time and Mental Rest",
      category: "Inner Peace",
      content: "Amidst academic pressure, protect your inner peace. Dedicate 15 minutes of quiet reflection, prayer, or meditation daily. Centering your mind away from GPA calculations reduces cortisol levels, resets cognitive resources, and aligns your thoughts back to what truly matters in life."
    }
  ]

  const globalInsights = [
    {
      title: "How Code is Reshaping African Agriculture",
      category: "Global Tech",
      content: "Students in engineering and computer science are building drone systems and low-cost sensor APIs that analyze soil moisture. These technologies help farmers in rural communities maximize crop yields by 40%. The programming syntax you learn in CSC 201 is the direct foundation for building these agricultural solutions."
    },
    {
      title: "The Transition to Renewable Energy Systems",
      category: "Tech Shift",
      content: "As global energy demands pivot towards sustainability, engineers are designing decentralized microgrids powered by machine learning algorithms. Learning thermodynamics, electrical circuits, and mechanics is not just passing theory—it is training you to lead the green energy transition across Nigeria and West Africa."
    },
    {
      title: "AI and the Future of Medical Diagnostics",
      category: "Scientific Breakthrough",
      content: "Deep learning models are now capable of detecting early-stage diabetic retinopathy and lung anomalies with accuracy matching top radiologists. This highlights the power of quantitative education. Mastering linear algebra, calculus (MTH 101), and coding opens doors to creating life-saving biological software."
    }
  ]

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const handleMoraleBoost = () => {
    const randomIdx = Math.floor(Math.random() * boosters.length)
    setActiveQuote(boosters[randomIdx])
  }

  const currentFeeds = activeTab === 'morale' ? moraleFeeds : activeTab === 'spiritual' ? spiritualFeeds : globalInsights
  const totalPages = Math.ceil(currentFeeds.length / itemsPerPage)
  const paginatedFeeds = currentFeeds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quote Booster Box */}
        <div className="bg-purple-brand rounded-lg p-6 text-white shadow-sm relative overflow-hidden mb-6 border border-purple-900">
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl font-serif pointer-events-none transform translate-y-8 select-none">“</div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full border border-white/10">
            Daily Academic Boost
          </span>
          <p className="text-lg font-bold mt-4 leading-relaxed italic">
            "{activeQuote.text}"
          </p>
          <div className="flex justify-between items-center mt-6 flex-wrap gap-4 border-t border-white/10 pt-4">
            <span className="text-xs text-purple-100 font-bold">— {activeQuote.author}</span>
            <button
              onClick={handleMoraleBoost}
              className="px-4 py-2 bg-white text-purple-brand hover:bg-purple-50 font-bold rounded-lg text-xs transition-colors shadow"
            >
              Get Another Boost
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('morale')}
              className={`px-4 py-2 font-medium border-b-2 text-sm transition-all whitespace-nowrap ${activeTab === 'morale' ? 'border-purple-brand text-purple-brand font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              Academic Morale
            </button>
            <button
              onClick={() => setActiveTab('spiritual')}
              className={`px-4 py-2 font-medium border-b-2 text-sm transition-all whitespace-nowrap ${activeTab === 'spiritual' ? 'border-purple-brand text-purple-brand font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              Spiritual & Purpose
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 font-medium border-b-2 text-sm transition-all whitespace-nowrap ${activeTab === 'insights' ? 'border-purple-brand text-purple-brand font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              Global Tech Insights
            </button>
          </div>
        </div>

        {/* Feeds List */}
        <div className="space-y-4">
          {paginatedFeeds.map((feed, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-purple-200 transition-colors">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                activeTab === 'morale' ? 'bg-purple-100 text-purple-brand' : activeTab === 'spiritual' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
              }`}>
                {feed.category}
              </span>
              <h3 className="font-extrabold text-gray-900 mt-2 text-lg">{feed.title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{feed.content}</p>
            </div>
          ))}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={currentFeeds.length}
            itemsPerPage={itemsPerPage}
            className="mt-6"
          />
        </div>
      </div>
    </Layout>
  )
}

export default Motivation
