'use client'

const KANWIL_NAMES = [
  'Jakarta 1',
  'Jakarta 2',
  'Jakarta 3',
  'Bandung',
  'Semarang',
  'Surabaya',
  'Makassar',
  'Medan',
  'Palembang'
]

export default function Sidebar({ currentPage, onNavigate, metadata }) {
  const menuItems = [
    { page: -1, label: 'Realisasi Harian', icon: '📈' },
    { page: 0, label: 'NPL Overview', icon: '📊' },
    ...KANWIL_NAMES.map((name, idx) => ({
      page: idx + 1,
      label: `Kanwil ${name}`,
      icon: '🏢'
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

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h1 className="font-bold text-white text-lg">SME Dashboard</h1>
            <p className="text-blue-100 text-xs">Monitoring NPL & Kredit</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Menu
        </div>
        {menuItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              currentPage === item.page
                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium truncate">{item.label}</span>
          </button>
        ))}
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
  )
}
