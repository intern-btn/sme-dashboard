'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getMonthInfo, formatDateID } from '../lib/dateUtils'
import ExportButton from './ExportButton'
import {
  exportTableToPDF,
  formatNPLKanwilData,
  formatKOL2KanwilData,
  formatRealisasiKreditKanwilData,
  formatPosisiKreditKanwilData
} from '../lib/pdfExport'

export default function Dashboard({
  nplData,
  kol2Data,
  realisasiKreditData,
  posisiKreditData,
  nplMetadata,
  kol2Metadata,
  realisasiKreditMetadata,
  posisiKreditMetadata
}) {
  const [activeTab, setActiveTab] = useState('npl')

  const tabs = [
    { id: 'npl', label: 'NPL', color: 'blue' },
    { id: 'kol2', label: 'KOL 2', color: 'blue' },
    { id: 'realisasi_kredit', label: 'Realisasi Kredit', color: 'blue' },
    { id: 'posisi_kredit', label: 'Posisi Kredit', color: 'blue' }
  ]

  const getActiveData = () => {
    switch (activeTab) {
      case 'npl': return { data: nplData, metadata: nplMetadata }
      case 'kol2': return { data: kol2Data, metadata: kol2Metadata }
      case 'realisasi_kredit': return { data: realisasiKreditData, metadata: realisasiKreditMetadata }
      case 'posisi_kredit': return { data: posisiKreditData, metadata: posisiKreditMetadata }
      default: return { data: null, metadata: null }
    }
  }

  const { data, metadata } = getActiveData()

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return formatDateID(dateString, 'short')
  }

  return (
    <div className="min-h-screen p-8 fade-in bg-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/1280px-BTN_2024.svg.png" alt="BTN" className="h-16 object-contain" />
          <img src="https://putrawijayakusumasakti.co.id/images/logo/danantara.webp" alt="Danantara" className="h-16 object-contain" />
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-bold mb-1" style={{ color: '#003d7a' }}>SME KREDIT UMKM DASHBOARD</h1>
          <div className="flex items-center justify-end gap-6 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Data: {formatDate(metadata?.uploadDate)}</span>
            </div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-green-600">Live</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id

            if (isActive) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 px-6 py-3 font-semibold transition-all text-white border-b-4"
                  style={{ backgroundColor: '#003d7a', borderBottomColor: '#e84e0f' }}
                >
                  {tab.label}
                </button>
              )
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 px-6 py-3 font-semibold transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'npl' && <NPLContent data={data} metadata={metadata} />}
      {activeTab === 'kol2' && <KOL2Content data={data} metadata={metadata} />}
      {activeTab === 'realisasi_kredit' && <RealisasiKreditContent data={data} metadata={metadata} />}
      {activeTab === 'posisi_kredit' && <PosisiKreditContent data={data} metadata={metadata} />}
    </div>
  )
}

// NPL Tab Content
function NPLContent({ data, metadata }) {
  if (!data) {
    return <div className="text-center py-12 text-gray-500">Belum ada data NPL</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportNPL = () => {
    if (!kanwilData || kanwilData.length === 0) {
      throw new Error('Tidak ada data untuk diekspor')
    }
    const pdfData = formatNPLKanwilData(kanwilData, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      {totalNasional && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>TOTAL NASIONAL NPL - {monthInfo.current.fullLabel}</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Total NPL</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.total_current)}</div>
              <div className="text-xl font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.totalPercent_current || 0).toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUMK</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kumk_current)}</div>
              <div className="text-lg font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.kumkPercent_current || 0).toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUR</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kur_current)}</div>
              <div className="text-lg font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.kurPercent_current || 0).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {kanwilData && kanwilData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>NPL PER KANWIL</h2>
            <ExportButton onClick={handleExportNPL} label="Export PDF" />
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr className="text-sm">
                  <th className="py-3 px-4 text-left font-semibold">No</th>
                  <th className="py-3 px-4 text-left font-semibold">Kanwil</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK %</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR %</th>
                  <th className="py-3 px-4 text-right font-semibold">Total (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Total %</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.kumk_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{f(k.kur_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{f(k.total_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: '#003d7a' }}>{(k.totalPercent_current || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
            <p>Klik navigasi untuk detail kanwil</p>
          </div>
        </div>
      )}
    </>
  )
}

// KOL2 Tab Content
function KOL2Content({ data, metadata }) {
  if (!data) {
    return <div className="text-center py-12 text-gray-500">Belum ada data KOL 2</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportKOL2 = () => {
    if (!kanwilData || kanwilData.length === 0) {
      throw new Error('Tidak ada data untuk diekspor')
    }
    const pdfData = formatKOL2KanwilData(kanwilData, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      {totalNasional && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>TOTAL NASIONAL KOL 2 - {monthInfo.current.fullLabel}</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Total KOL 2</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.total_current)}</div>
              <div className="text-xl font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.totalPercent_current || 0).toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUMK</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kumk_current)}</div>
              <div className="text-lg font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.kumkPercent_current || 0).toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUR</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kur_current)}</div>
              <div className="text-lg font-semibold" style={{ color: '#003d7a' }}>{(totalNasional.kurPercent_current || 0).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {kanwilData && kanwilData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>KOL 2 PER KANWIL</h2>
            <ExportButton onClick={handleExportKOL2} label="Export PDF" />
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr className="text-sm">
                  <th className="py-3 px-4 text-left font-semibold">No</th>
                  <th className="py-3 px-4 text-left font-semibold">Kanwil</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK %</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR %</th>
                  <th className="py-3 px-4 text-right font-semibold">Total (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Total %</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.kumk_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{f(k.kur_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{f(k.total_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: '#003d7a' }}>{(k.totalPercent_current || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
            <p>Klik navigasi untuk detail kanwil</p>
          </div>
        </div>
      )}
    </>
  )
}

// Realisasi Kredit Tab Content
function RealisasiKreditContent({ data, metadata }) {
  if (!data) {
    return <div className="text-center py-12 text-gray-500">Belum ada data Realisasi Kredit</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportRealisasiKredit = () => {
    if (!kanwilData || kanwilData.length === 0) {
      throw new Error('Tidak ada data untuk diekspor')
    }
    const pdfData = formatRealisasiKreditKanwilData(kanwilData, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      {totalNasional && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>TOTAL NASIONAL REALISASI KREDIT{monthInfo?.current?.fullLabel ? ` - ${monthInfo.current.fullLabel}` : ''}</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUMK</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kumk_real_current || 0)}</div>
              <div className="text-sm text-gray-500">1-{monthInfo.current?.day || 26} {monthInfo.current?.shortName || 'Jan'}'26</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#e84e0f' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">KUR</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.kur_total_current || 0)}</div>
              <div className="text-sm text-gray-500">Total KUR</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">UMKM</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Rp {f(totalNasional.umkm_real_current || 0)}</div>
              <div className="text-sm text-gray-500">Real UMKM</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Total Realisasi</div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#003d7a' }}>Rp {f((totalNasional.kumk_real_current || 0) + (totalNasional.kur_total_current || 0) + (totalNasional.umkm_real_current || 0))}</div>
              <div className="text-sm text-gray-500">KUMK + KUR + UMKM</div>
            </div>
          </div>
        </div>
      )}

      {kanwilData && kanwilData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>REALISASI KREDIT PER KANWIL</h2>
            <ExportButton onClick={handleExportRealisasiKredit} label="Export PDF" />
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr className="text-sm">
                  <th className="py-3 px-4 text-left font-semibold">No</th>
                  <th className="py-3 px-4 text-left font-semibold">Kanwil</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">UMKM (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Total (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">% Vs. RKAP</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {kanwilData.map((k, i) => {
                  const totalRealisasi = (k.kumk_real_current || 0) + (k.kur_total_current || 0) + (k.umkm_real_current || 0)
                  const avgPcpRkap = ((k.kumk_pcp_rkap || 0) + (k.kur_pcp_rkap || 0) + (k.umkm_pcp_rkap || 0)) / 3

                  return (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">{i + 1}</td>
                      <td className="py-3 px-4 font-medium">{k.name}</td>
                      <td className="py-3 px-4 text-right">{f(k.kumk_real_current || 0)}</td>
                      <td className="py-3 px-4 text-right">{f(k.kur_total_current || 0)}</td>
                      <td className="py-3 px-4 text-right">{f(k.umkm_real_current || 0)}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{f(totalRealisasi)}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{avgPcpRkap.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
            <p>Klik navigasi untuk detail kanwil</p>
          </div>
        </div>
      )}
    </>
  )
}

// Posisi Kredit Tab Content
function PosisiKreditContent({ data, metadata }) {
  if (!data) {
    return <div className="text-center py-12 text-gray-500">Belum ada data Posisi Kredit</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportPosisiKredit = () => {
    if (!kanwilData || kanwilData.length === 0) {
      throw new Error('Tidak ada data untuk diekspor')
    }
    const pdfData = formatPosisiKreditKanwilData(kanwilData, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      {totalNasional && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>TOTAL NASIONAL POSISI KREDIT{monthInfo?.current?.fullLabel ? ` - ${monthInfo.current.fullLabel}` : ''}</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Posisi Awal Jan</div>
              <div className="text-2xl font-bold text-gray-900">Rp {f(totalNasional.posisi_jan || 0)}</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Posisi Current</div>
              <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {f(totalNasional.posisi_current || 0)}</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Gap MTD</div>
              <div className="text-2xl font-bold text-gray-900">Rp {f(totalNasional.gap_mtd || 0)}</div>
            </div>
            <div className="bg-gray-50 border-l-4 rounded-lg p-5 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
              <div className="text-gray-600 text-sm mb-1 font-medium uppercase">Gap YoY</div>
              <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {f(totalNasional.gap_yoy || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {kanwilData && kanwilData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>POSISI KREDIT PER KANWIL</h2>
            <ExportButton onClick={handleExportPosisiKredit} label="Export PDF" />
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr className="text-sm">
                  <th className="py-3 px-4 text-left font-semibold">No</th>
                  <th className="py-3 px-4 text-left font-semibold">Kanwil</th>
                  <th className="py-3 px-4 text-right font-semibold">Posisi Awal Jan (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Realisasi (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Run Off (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Posisi Current (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Gap MTD (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Gap YoY (Jt)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.posisi_jan || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(k.realisasi || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(k.runoff || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{f(k.posisi_current || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(k.gap_mtd || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{f(k.gap_yoy || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
            <p>Klik navigasi untuk detail kanwil</p>
          </div>
        </div>
      )}
    </>
  )
}
