import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import GuestRestrictionModal from '../components/GuestRestrictionModal'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'
import { libraryAPI } from '../services/api'

const Library = () => {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialLevel = queryParams.get('level') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState(initialLevel)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Form State
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    yearRange: '',
    type: 'past-question',
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Seed data + User Uploads State
  const [materials, setMaterials] = useState([])

  const defaultMaterials = [
    {
      id: 'd1',
      courseCode: 'MTH 101',
      title: 'MTH 101 Calculus & Trigonometry Past Questions',
      yearRange: '2021/2022',
      type: 'past-question',
      description: 'Official first semester exam past questions for FUTA 100L students.',
      uploader: 'StudyHub Official',
      uploadedAt: '1/12/2025',
      fileSize: '1.2 MB'
    },
    {
      id: 'd2',
      courseCode: 'PHY 101',
      title: 'PHY 101 Mechanics Lecture Notes & Formulas',
      yearRange: '2022/2023',
      type: 'summary',
      description: 'Comprehensive review sheet of kinematics, vectors, and Newton laws.',
      uploader: 'Futa Alumnus',
      uploadedAt: '1/20/2025',
      fileSize: '840 KB'
    },
    {
      id: 'd3',
      courseCode: 'CHM 101',
      title: 'CHM 101 General Chemistry Practical Guide',
      yearRange: '2019-2023',
      type: 'summary',
      description: 'Detailed analysis of acid-base titrations and volumetric calculations.',
      uploader: 'Chemistry Rep',
      uploadedAt: '2/05/2025',
      fileSize: '2.1 MB'
    },
    {
      id: 'd4',
      courseCode: 'CSC 201',
      title: 'CSC 201 Programming Fundamentals Past Exam Papers',
      yearRange: '2022/2023',
      type: 'past-question',
      description: 'Set of programming theory questions and flowchart designs.',
      uploader: 'CSC President',
      uploadedAt: '2/10/2025',
      fileSize: '1.5 MB'
    },
    {
      id: 'd5',
      courseCode: 'GST 111',
      title: 'GST 111 Punctuation & Lexicon Exercises',
      yearRange: '2023/2024',
      type: 'past-question',
      description: 'English syntax practice worksheets compiled for FUTA tests.',
      uploader: 'StudyHub Official',
      uploadedAt: '2/15/2025',
      fileSize: '620 KB'
    }
  ]

  // Load materials from server & merge with defaults
  const loadMaterialsList = async () => {
    try {
      const response = await libraryAPI.getMaterials()
      const dbMaterials = response.data.map(item => ({
        id: item._id,
        courseCode: item.courseCode,
        title: item.title,
        yearRange: item.yearRange,
        type: item.type,
        description: item.description,
        uploader: item.uploader || 'Anonymous Student',
        uploadedAt: new Date(item.createdAt).toLocaleDateString(),
        fileSize: item.fileSize,
        fileUrl: item.fileUrl
      }))
      setMaterials([...dbMaterials, ...defaultMaterials])
    } catch (error) {
      console.error('Error loading materials:', error)
      setMaterials(defaultMaterials)
    }
  }

  useEffect(() => {
    loadMaterialsList()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, levelFilter])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setFileError('Only PDF files are supported.')
        setSelectedFile(null)
      } else {
        setFileError('')
        setSelectedFile(file)
      }
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()

    if (user?.isGuest) {
      setIsModalOpen(true)
      return
    }

    if (!formData.courseCode.trim() || !formData.title.trim() || !formData.yearRange.trim() || !selectedFile) {
      toast.error('Please fill in all required fields and select a PDF file')
      return
    }

    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setFileError('Only PDF files are allowed')
      toast.error('Only PDF files are allowed')
      return
    }

    setIsUploading(true)
    const uploadToast = toast.loading('Uploading study material...')

    try {
      const data = new FormData()
      data.append('courseCode', formData.courseCode)
      data.append('title', formData.title)
      data.append('yearRange', formData.yearRange)
      data.append('type', formData.type)
      data.append('description', formData.description)
      data.append('file', selectedFile)

      await libraryAPI.uploadMaterial(data)
      
      toast.dismiss(uploadToast)
      toast.success('Material contributed successfully!')
      
      await loadMaterialsList()
      
      setFormData({
        courseCode: '',
        title: '',
        yearRange: '',
        type: 'past-question',
        description: ''
      })
      setSelectedFile(null)
      setShowUploadForm(false)
    } catch (error) {
      toast.dismiss(uploadToast)
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.message || 'Failed to upload material. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = (item) => {
    if (!item.fileUrl) {
      toast.error('This sample resource item does not have a PDF file attached yet.')
      return
    }

    const filename = item._id || item.fileUrl.split('/').pop()
    const downloadUrl = libraryAPI.getDownloadUrl(filename)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', `${item.title || item.courseCode}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Downloading ${item.courseCode} ${item.title}...`)
  }

  // Filter Logic
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    
    let matchesLevel = true
    if (levelFilter !== 'all') {
      const matchNum = levelFilter.charAt(0)
      const match = item.courseCode.match(/\d/)
      matchesLevel = match && match[0] === matchNum
    }

    return matchesSearch && matchesType && matchesLevel
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage)
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Library</h1>
            <p className="text-gray-500 mt-1">Access or upload shared lecture notes, summary guides, and official past questions.</p>
          </div>
          <button
            onClick={() => {
              if (user?.isGuest) {
                setIsModalOpen(true)
              } else {
                setShowUploadForm(!showUploadForm)
              }
            }}
            className="px-5 py-2.5 btn-purple text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-sm self-start md:self-center"
          >
            {showUploadForm ? 'Cancel Contribution' : '＋ Contribute Material'}
          </button>
        </div>

        {/* Upload Form Modal / Toggle Panel */}
        {showUploadForm && (
          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-8 bg-gradient-to-b from-purple-50/40 to-white">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contribute a Study Material</h2>
            <p className="text-xs text-gray-500 mb-6">Upload verified lecture PDFs, course past questions, or study summaries to help fellow FUTA students.</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. MTH 101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Session / Year *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2023/2024"
                    value={formData.yearRange}
                    onChange={(e) => setFormData({ ...formData, yearRange: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Material Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="past-question">Past Question</option>
                    <option value="summary">Lecture Summary / PDF</option>
                    <option value="note">Other Material</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. MTH 101 Calculus & Algebra Past Exam Solutions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Briefly describe the contents of this document..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select PDF File * (Max 15MB)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  required
                />
                {fileError && <p className="text-xs text-red-500 font-semibold mt-1">{fileError}</p>}
                {selectedFile && <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Selected: {selectedFile.name}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 btn-purple text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Submit Material'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search course code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-[#4B2E83] transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 pt-1 sm:pt-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-xs font-bold text-gray-500">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-[#4B2E83] bg-white font-semibold transition-all"
              >
                <option value="all">All Types</option>
                <option value="past-question">Past Questions</option>
                <option value="summary">Summaries / PDFs</option>
                <option value="note">Notes</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-xs font-bold text-gray-500">Level:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-[#4B2E83] bg-white font-semibold transition-all"
              >
                <option value="all">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Cards Feed */}
        {filteredMaterials.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-4">
              {paginatedMaterials.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-brand flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase p-1">
                      {item.type === 'past-question' ? 'PQ' : item.type === 'summary' ? 'PDF' : 'DOC'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold px-2 py-0.5 bg-purple-100 text-purple-brand rounded">
                          {item.courseCode}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          Session: {item.yearRange}
                        </span>
                        <span className="text-xs text-gray-400">
                          Uploaded by {item.uploader}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mt-2 text-base leading-snug">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 gap-3">
                    <span className="text-xs font-bold text-gray-400">{item.fileSize}</span>
                    <button
                      onClick={() => handleDownload(item)}
                      className="px-4 py-2 border border-purple-200 text-purple-brand font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-xs"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredMaterials.length}
              itemsPerPage={itemsPerPage}
              className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500 font-semibold">No materials found matching your filters.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your keywords, levels, or resource types.</p>
          </div>
        )}
      </div>

      <GuestRestrictionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionName="contribute study materials"
      />
    </Layout>
  )
}

export default Library
