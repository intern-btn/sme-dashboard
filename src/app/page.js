'use client'

import { useState, useEffect } from 'react'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { useAutoSlide } from './hooks/useAutoSlide'
import { useDataFetch } from './hooks/useDataFetch'
import Dashboard from './components/Dashboard'
import KanwilDetail from './components/KanwilDetail'
import Realisasi from './components/Realisasi'
import KOL2Dashboard from './components/KOL2Dashboard'
import KOL2KanwilDetail from './components/KOL2KanwilDetail'
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

  // Fetch data once on load only (no auto-refresh since data is static until new upload)
  const { data: nplData, metadata: nplMetadata, loading: nplLoading, noData: nplNoData, refresh: refreshNpl } = useDataFetch('npl', null)
  const { data: kol2Data, metadata: kol2Metadata, loading: kol2Loading, noData: kol2NoData, refresh: refreshKol2 } = useDataFetch('kol2', null)
  const { data: realisasiData, loading: realisasiLoading, noData: realisasiNoData, refresh: refreshRealisasi } = useDataFetch('realisasi', null)
  const { data: realisasiKreditData, metadata: realisasiKreditMetadata, loading: realisasiKreditLoading, noData: realisasiKreditNoData } = useDataFetch('realisasi_kredit', null)
  const { data: posisiKreditData, metadata: posisiKreditMetadata, loading: posisiKreditLoading, noData: posisiKreditNoData } = useDataFetch('posisi_kredit', null)

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
      const isLoading = nplLoading || kol2Loading || realisasiKreditLoading || posisiKreditLoading
      if (isLoading) {
        return <LoadingScreen text="Loading dashboard data..." />
      }
      return (
        <Dashboard
          nplData={nplData}
          kol2Data={kol2Data}
          realisasiKreditData={realisasiKreditData}
          posisiKreditData={posisiKreditData}
          nplMetadata={nplMetadata}
          kol2Metadata={kol2Metadata}
          realisasiKreditMetadata={realisasiKreditMetadata}
          posisiKreditMetadata={posisiKreditMetadata}
        />
      )
    }

    // Kanwil detail pages (1-9) with tabs for all 4 data types
    if (currentPage >= 1 && currentPage <= 9) {
      const isLoading = nplLoading || kol2Loading || realisasiKreditLoading || posisiKreditLoading
      if (isLoading) {
        return <LoadingScreen text="Loading kanwil data..." />
      }
      return (
        <KanwilDetail
          nplData={nplData}
          kol2Data={kol2Data}
          realisasiKreditData={realisasiKreditData}
          posisiKreditData={posisiKreditData}
          kanwilIndex={currentPage}
          nplMetadata={nplMetadata}
          kol2Metadata={kol2Metadata}
          realisasiKreditMetadata={realisasiKreditMetadata}
          posisiKreditMetadata={posisiKreditMetadata}
        />
      )
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
        <div className="w-24 h-24 border-4 rounded-full animate-spin" style={{ borderColor: '#e5e7eb', borderTopColor: '#003d7a' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12" style={{ color: '#003d7a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      <div className="mt-6 text-2xl text-gray-700 font-semibold">{text}</div>
    </div>
  )
}

function NoDataScreen({ text }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <svg className="w-32 h-32 mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="text-3xl text-gray-700 mb-4 font-bold">{text}</div>
      <div className="text-gray-600 text-center max-w-md bg-gray-50 p-6 rounded-lg border border-gray-300">
        <p className="mb-4 font-semibold uppercase text-sm" style={{ color: '#003d7a' }}>Untuk menampilkan data:</p>
        <ol className="text-left list-decimal list-inside space-y-2">
          <li>Buka <a href="/admin" className="hover:underline font-medium" style={{ color: '#003d7a' }}>Admin Portal</a></li>
          <li>Upload 5 file Excel (.xlsx)</li>
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
