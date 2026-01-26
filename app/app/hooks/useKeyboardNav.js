'use client'

import { useState, useEffect } from 'react'

export function useKeyboardNav(totalPages = 11) {
  // Pages: -1 (Realisasi), 0 (Dashboard), 1-9 (Kanwil)
  const [currentPage, setCurrentPage] = useState(0)
  
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault()
          setCurrentPage(prev => {
            // From Dashboard (0) → Kanwil 1 (1)
            // From Kanwil 9 (9) → Dashboard (0)
            if (prev === -1) return 0
            if (prev === 9) return 0
            return prev + 1
          })
          break

        case 'ArrowLeft':
          e.preventDefault()
          setCurrentPage(prev => {
            // From Dashboard (0) → Realisasi (-1)
            // From Kanwil 1 (1) → Dashboard (0)
            if (prev === 0) return -1
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
      'Realisasi',
      'Dashboard',
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
