'use client'

import { useState, useEffect } from 'react'

export function useKeyboardNav(totalPages = 11) {
  // Pages: -1 (Realisasi Harian), 0 (Overview Dashboard with tabs), 1-9 (Kanwil details with tabs)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault()
          setCurrentPage(prev => {
            // Realisasi (-1) → Overview Dashboard (0)
            if (prev === -1) return 0
            // Last Kanwil (9) → Realisasi (-1) to loop
            if (prev === 9) return -1
            return prev + 1
          })
          break

        case 'ArrowLeft':
          e.preventDefault()
          setCurrentPage(prev => {
            // Overview Dashboard (0) → Realisasi (-1)
            if (prev === 0) return -1
            // Realisasi (-1) → Last Kanwil (9)
            if (prev === -1) return 9
            return prev - 1
          })
          break

        // ArrowUp/ArrowDown left for default browser scrolling
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  const pageName = () => {
    const pages = [
      'Realisasi Harian',
      'Overview Dashboard',
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
    return pages[currentPage + 1]
  }

  const goToPage = (pageId) => {
    if (pageId >= -1 && pageId <= 9) {
      setCurrentPage(pageId)
    }
  }

  return { currentPage, pageName, goToPage }
}
