'use client'

import { useState, useEffect } from 'react'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { useAutoSlide } from './hooks/useAutoSlide'
import { useDataFetch } from './hooks/useDataFetch'
import Dashboard from './components/Dashboard'
import KanwilDetail from './components/KanwilDetail'
import Realisasi from './components/Realisasi'
import ProgressIndicator from './components/ProgressIndicator'
import AutoSlideIndicator from './components/AutoSlideIndicator'
import Sidebar from './components/Sidebar'
import ModeToggle from './components/ModeToggle'

export default function NPLDashboardPage() {
  // Mode state (tv or browser)
  const [mode, setMode] = useState('browser')

  // Load mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('dashboard_mode')
    if (savedMode === 'tv' || savedMode === 'browser') {
      setMode(savedMode)
    }
  }, [])

  const toggleMode = () => {
    const newMode = mode === 'tv' ? 'browser' : 'tv'
    setMode(newMode)
    localStorage.setItem('dashboard_mode', newMode)
  }

  // Fetch data with auto-refresh every 30 seconds
  const { data: nplData, metadata: nplMetadata, loading: nplLoading, noData: nplNoData } = useDataFetch('npl', 30000)
  const { data: realisasiData, loading: realisasiLoading, noData: realisasiNoData } = useDataFetch('realisasi', 30000)

  // Navigation state
  const { currentPage, pageName, goToPage } = useKeyboardNav()

  // Auto-slide with pause functionality (only active in TV mode)
  const handleNext = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
  }

  const { isEnabled, isPaused, countdown, toggleEnabled } = useAutoSlide({
    onNext: handleNext,
    interval: 30000,
    disabled: mode === 'browser' // Disable auto-slide in browser mode
  })

  // Render appropriate component based on current page
  const renderPage = () => {
    if (currentPage === -1) {
      if (realisasiLoading) {
        return <LoadingScreen text="Loading realisasi data..." />
      }
      if (realisasiNoData || !realisasiData) {
        return <NoDataScreen text="Belum ada data realisasi" />
      }
      return <Realisasi data={realisasiData} />
    }

    if (currentPage === 0) {
      if (nplLoading) {
        return <LoadingScreen text="Loading NPL data..." />
      }
      if (nplNoData || !nplData) {
        return <NoDataScreen text="Belum ada data NPL" />
      }
      return <Dashboard data={nplData} metadata={nplMetadata} />
    }

    // Kanwil detail pages (1-9)
    if (currentPage >= 1 && currentPage <= 9) {
      if (nplLoading) {
        return <LoadingScreen text="Loading kanwil data..." />
      }
      if (nplNoData || !nplData) {
        return <NoDataScreen text="Belum ada data NPL" />
      }
      return <KanwilDetail data={nplData} kanwilIndex={currentPage} metadata={nplMetadata} />
    }

    return <div className="min-h-screen flex items-center justify-center text-gray-400">Invalid page</div>
  }

  // TV Mode Layout
  if (mode === 'tv') {
    return (
      <main className="relative">
        <div className="transition-all duration-500">
          {renderPage()}
        </div>

        <ProgressIndicator currentPage={currentPage} pageName={pageName()} onNavigate={goToPage} />
        <AutoSlideIndicator isEnabled={isEnabled} isPaused={isPaused} countdown={countdown} onToggle={toggleEnabled} />
        <DataRefreshIndicator metadata={nplMetadata} />
        <ModeToggle mode={mode} onToggle={toggleMode} />
      </main>
    )
  }

  // Browser Mode Layout
  return (
    <main className="relative flex">
      <Sidebar currentPage={currentPage} onNavigate={goToPage} metadata={nplMetadata} />

      <div className="flex-1 ml-64 min-h-screen bg-gray-50">
        <div className="transition-all duration-300">
          {renderPage()}
        </div>
      </div>

      <ModeToggle mode={mode} onToggle={toggleMode} />
    </main>
  )
}

function LoadingScreen({ text }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">📊</span>
        </div>
      </div>
      <div className="mt-6 text-2xl text-gray-700">{text}</div>
    </div>
  )
}

function NoDataScreen({ text }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-8xl mb-6">📂</div>
      <div className="text-3xl text-gray-700 mb-4">{text}</div>
      <div className="text-gray-600 text-center max-w-md bg-gray-50 p-6 rounded-lg border">
        <p className="mb-4 font-semibold">Untuk menampilkan data:</p>
        <ol className="text-left list-decimal list-inside space-y-2">
          <li>Buka <a href="/admin" className="text-blue-600 hover:underline">Admin Portal</a></li>
          <li>Upload 3 file Excel (.xlsx)</li>
          <li>Tunggu proses selesai</li>
          <li>Dashboard akan auto-refresh</li>
        </ol>
      </div>
    </div>
  )
}

function DataRefreshIndicator({ metadata }) {
  if (!metadata) return null

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="fixed bottom-8 left-8 z-40 bg-white/95 backdrop-blur-sm border border-gray-300 px-3 py-2 rounded-lg text-xs shadow-lg">
      <div className="flex items-center gap-2 text-gray-700">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>Last update: {formatTime(metadata.uploadDate)}</span>
      </div>
    </div>
  )
}
