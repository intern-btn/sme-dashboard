'use client'

const KANWIL_NAMES = [
  'Jakarta I',
  'Jakarta II',
  'Jateng DIY',
  'Jabanus',
  'Jawa Barat',
  'Kalimantan',
  'Sulampua',
  'Sumatera 1',
  'Sumatera 2'
]

export default function Sidebar({ currentPage, onNavigate, metadata, isOpen, onClose }) {
  const menuItems = [
    { page: -1, label: 'Realisasi Harian', section: 'main' },
    { page: 0, label: 'Overview Dashboard', section: 'main' },
    ...KANWIL_NAMES.map((name, idx) => ({
      page: idx + 1,
      label: name,
      section: 'kanwil'
    }))
  ]

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleNavigate = (page) => {
    onNavigate(page)
    if (onClose) onClose() // Close sidebar on mobile after navigation
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 shadow-lg transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#003d7a' }}>
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/1280px-BTN_2024.svg.png" alt="BTN" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="font-bold text-white text-lg">SME Dashboard</h1>
            <p className="text-xs" style={{ color: '#cbd5e0' }}>Monitoring NPL & Kredit</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Main Section */}
        {menuItems.filter(i => i.section === 'main').map((item) => {
          const isActive = currentPage === item.page
          return (
            <button
              key={item.page}
              onClick={() => handleNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'text-white border-r-4'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={isActive ? { backgroundColor: '#003d7a', borderRightColor: '#e84e0f' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.page === -1 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                )}
              </svg>
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          )
        })}

        {/* Kanwil Details Section */}
        <div className="px-3 py-2 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200 pt-3">
          Kanwil Details
        </div>
        {menuItems.filter(i => i.section === 'kanwil').map((item) => {
          const isActive = currentPage === item.page
          return (
            <button
              key={item.page}
              onClick={() => handleNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'text-white border-r-4'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={isActive ? { backgroundColor: '#003d7a', borderRightColor: '#e84e0f' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer with metadata */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Last updated</span>
          </div>
          <div className="font-medium text-gray-700 truncate">
            {formatDate(metadata?.uploadDate)}
          </div>
        </div>
        <a
          href="/admin"
          className="mt-3 block text-center py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          Admin Portal
        </a>
      </div>
    </aside>
    </>
  )
}
