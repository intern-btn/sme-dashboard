'use client'

import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { useDataFetch } from '../hooks/useDataFetch'
import AppHeader from '../components/AppHeader'
import Dashboard from '../components/Dashboard'
import KanwilDetail from '../components/KanwilDetail'
import Realisasi from '../components/Realisasi'
import { useState, useEffect } from 'react'

const monitoringSubNav = [
  { href: '/monitoring', label: 'Credit Monitoring', exact: true },
  { href: '/monitoring/spbu', label: 'PRK SPBU' },
]

const KANWIL_TABS = [
  { id: -1, label: 'Realisasi' },
  { id: 0,  label: 'Overview' },
  { id: 1,  label: 'Jakarta I' },
  { id: 2,  label: 'Jakarta II' },
  { id: 3,  label: 'Jateng DIY' },
  { id: 4,  label: 'Jabanus' },
  { id: 5,  label: 'Jawa Barat' },
  { id: 6,  label: 'Kalimantan' },
  { id: 7,  label: 'Sulampua' },
  { id: 8,  label: 'Sumatera 1' },
  { id: 9,  label: 'Sumatera 2' },
]

export default function MonitoringPage() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  const { data: nplData, metadata: nplMetadata, loading: nplLoading } = useDataFetch('npl', null)
  const { data: kol2Data, metadata: kol2Metadata, loading: kol2Loading } = useDataFetch('kol2', null)
  const { data: realisasiData, loading: realisasiLoading, noData: realisasiNoData } = useDataFetch('realisasi', null)
  const { data: realisasiKreditData, metadata: realisasiKreditMetadata, loading: realisasiKreditLoading } = useDataFetch('realisasi_kredit', null)
  const { data: posisiKreditData, metadata: posisiKreditMetadata, loading: posisiKreditLoading } = useDataFetch('posisi_kredit', null)

  const { currentPage, goToPage } = useKeyboardNav()

  const renderContent = () => {
    if (currentPage === -1) {
      if (realisasiLoading) return <LoadingCard />
      if (realisasiNoData || !realisasiData) return <NoDataCard />
      return <Realisasi data={realisasiData} />
    }

    if (currentPage === 0) {
      if (nplLoading || kol2Loading || realisasiKreditLoading || posisiKreditLoading) return <LoadingCard />
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

    if (currentPage >= 1 && currentPage <= 9) {
      if (nplLoading || kol2Loading || realisasiKreditLoading || posisiKreditLoading) return <LoadingCard />
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

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} memoNavLinks={monitoringSubNav} />

      {/* Kanwil tab bar */}
      <div className="sticky top-[96px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {KANWIL_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToPage(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  currentPage === tab.id
                    ? 'bg-[#003d7a] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto pl-4 flex-shrink-0">
              <a
                href="/monitoring/tv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                TV Mode
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  )
}

function NoDataCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-700 font-semibold mb-1">Belum ada data</p>
      <p className="text-sm text-gray-500">
        Upload file Excel via{' '}
        <a href="/admin" className="text-blue-700 underline">Admin Portal</a>
      </p>
    </div>
  )
}
