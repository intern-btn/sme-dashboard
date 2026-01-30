'use client'

export default function ProgressIndicator({ currentPage, pageName, onNavigate }) {
  // Determine which section to show dots for
  let pages = []
  let section = ''

  if (currentPage === -1) {
    // Realisasi - show just itself
    pages = [{ id: -1, name: 'Realisasi Harian' }]
    section = 'Realisasi'
  } else if (currentPage === 0) {
    // Overview - show just itself
    pages = [{ id: 0, name: 'Overview Dashboard' }]
    section = 'Overview'
  } else if (currentPage >= 1 && currentPage <= 9) {
    // Kanwil section
    pages = [
      { id: 1, name: 'Jakarta I' },
      { id: 2, name: 'Jakarta II' },
      { id: 3, name: 'Jateng DIY' },
      { id: 4, name: 'Jabanus' },
      { id: 5, name: 'Jawa Barat' },
      { id: 6, name: 'Kalimantan' },
      { id: 7, name: 'Sulampua' },
      { id: 8, name: 'Sumatera 1' },
      { id: 9, name: 'Sumatera 2' },
    ]
    section = 'Kanwil Detail'
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center z-50">
      <div className="bg-black/80 backdrop-blur-sm px-8 py-4 rounded-full shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Navigation dots */}
          <div className="flex items-center gap-2">
            {pages.map((page) => {
              const isActive = page.id === currentPage

              return (
                <button
                  key={page.id}
                  onClick={() => onNavigate && onNavigate(page.id)}
                  className={`
                    transition-all duration-300 rounded-full cursor-pointer
                    ${isActive
                      ? 'w-4 h-4 bg-primary scale-125 shadow-lg shadow-primary/50'
                      : 'w-2.5 h-2.5 bg-gray-500 hover:bg-gray-400 hover:scale-110'
                    }
                  `}
                  title={page.name}
                  aria-label={`Go to ${page.name}`}
                />
              )
            })}
          </div>

          {/* Current page info */}
          <div className="ml-4 flex items-center gap-3 border-l border-gray-600 pl-4">
            <span className="text-gray-400 text-sm">{section}:</span>
            <span className="text-white font-semibold text-lg">
              {pageName}
            </span>
            <span className="text-gray-500 text-sm">
              ({currentPage + 2}/11)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
