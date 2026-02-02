'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getMonthInfo, formatDateID } from '../lib/dateUtils'
import ExportButton from './ExportButton'
import {
  exportTableToPDF,
  formatNPLCabangData,
  formatKOL2CabangData,
  formatRealisasiKreditCabangData,
  formatPosisiKreditCabangData
} from '../lib/pdfExport'

const KANWIL_NAMES = ['Jakarta I', 'Jakarta II', 'Jateng DIY', 'Jabanus', 'Jawa Barat', 'Kalimantan', 'Sulampua', 'Sumatera 1', 'Sumatera 2']

export default function KanwilDetail({
  nplData,
  kol2Data,
  realisasiKreditData,
  posisiKreditData,
  kanwilIndex,
  nplMetadata,
  kol2Metadata,
  realisasiKreditMetadata,
  posisiKreditMetadata
}) {
  const [activeTab, setActiveTab] = useState('npl')

  const currentKanwil = KANWIL_NAMES[kanwilIndex - 1]

  const tabs = [
    { id: 'npl', label: 'NPL', color: 'blue' },
    { id: 'kol2', label: 'KOL 2', color: 'yellow' },
    { id: 'realisasi_kredit', label: 'Realisasi Kredit', color: 'green' },
    { id: 'posisi_kredit', label: 'Posisi Kredit', color: 'purple' }
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

  return (
    <div className="min-h-screen p-8 bg-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>KANWIL {currentKanwil?.toUpperCase()}</h1>

        {/* Tabs */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="flex">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              let bgColor = 'bg-gray-50'
              let textColor = 'text-gray-700'
              let borderColor = ''

              if (isActive) {
                if (tab.id === 'npl') {
                  bgColor = 'text-white'
                  textColor = 'text-white'
                  borderColor = 'border-b-4'
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-4 py-2 font-semibold text-sm transition-all ${bgColor} ${textColor} ${borderColor}`}
                      style={{ backgroundColor: '#003d7a', borderBottomColor: '#e84e0f' }}
                    >
                      {tab.label}
                    </button>
                  )
                }
                bgColor = `bg-${tab.color}-600`
                textColor = 'text-white'
                borderColor = 'border-b-4 border-orange-500'
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 font-semibold text-sm transition-all ${bgColor} ${textColor} ${borderColor} hover:bg-gray-100`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'npl' && <NPLKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
      {activeTab === 'kol2' && <KOL2KanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
      {activeTab === 'realisasi_kredit' && <RealisasiKreditKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
      {activeTab === 'posisi_kredit' && <PosisiKreditKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
    </div>
  )
}

// NPL Kanwil Content
function NPLKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="text-center py-12 text-gray-500">Belum ada data NPL untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const currentMonth = monthInfo.current
  const previousMonth = monthInfo.previous

  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const handleExportNPLCabang = () => {
    if (!cabangList || cabangList.length === 0) {
      throw new Error('Tidak ada data cabang untuk diekspor')
    }
    const pdfData = formatNPLCabangData(cabangList, kanwilName, monthInfo)
    exportTableToPDF(pdfData)
  }

  const comparisonData = [
    {
      month: previousMonth?.shortName || 'Prev',
      total: kanwilSummary.totalPercent_previous || 0,
      kumk: kanwilSummary.kumkPercent_previous || 0,
      kur: kanwilSummary.kurPercent_previous || 0
    },
    {
      month: currentMonth?.shortName || 'Curr',
      total: kanwilSummary.totalPercent_current || 0,
      kumk: kanwilSummary.kumkPercent_current || 0,
      kur: kanwilSummary.kurPercent_current || 0
    }
  ]

  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)
  const currentDateLabel = currentMonth?.shortLabel || formatDateID(new Date(), 'short')
  const previousDateLabel = previousMonth?.shortLabel || formatDateID(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'short')

  return (
    <>
      {/* Summary Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: '#003d7a' }}>Summary NPL {kanwilName}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Total NPL</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.total_current)}</span>
              <span className="font-semibold" style={{ color: '#003d7a' }}>{(kanwilSummary.totalPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.total_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.totalPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>

          <div className="border-l-4 border-green-500 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUMK</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.kumk_current)}</span>
              <span className="text-green-600 font-semibold">{(kanwilSummary.kumkPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.kumk_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.kumkPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#e84e0f' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUR</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.kur_current)}</span>
              <span className="font-semibold" style={{ color: '#e84e0f' }}>{(kanwilSummary.kurPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.kur_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.kurPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: '#003d7a' }}>Outstanding Portfolio Size</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 border-l-4 p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Total Outstanding</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-xl font-bold">Rp {f(kanwilSummary.outstanding_total_current || 0)} Jt</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-base text-gray-600">Rp {f(kanwilSummary.outstanding_total_previous || 0)} Jt</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">NPL Ratio: {(kanwilSummary.totalPercent_current || 0).toFixed(2)}%</div>
          </div>

          <div className="bg-gray-50 border-l-4 border-green-500 p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUMK Outstanding</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-xl font-bold">Rp {f(kanwilSummary.outstanding_kumk_current || 0)} Jt</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-base text-gray-600">Rp {f(kanwilSummary.outstanding_kumk_previous || 0)} Jt</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">NPL Ratio: {(kanwilSummary.kumkPercent_current || 0).toFixed(2)}%</div>
          </div>

          <div className="bg-gray-50 border-l-4 p-4 shadow-sm" style={{ borderLeftColor: '#e84e0f' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUR Outstanding</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-xl font-bold">Rp {f(kanwilSummary.outstanding_kur_current || 0)} Jt</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-base text-gray-600">Rp {f(kanwilSummary.outstanding_kur_previous || 0)} Jt</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">NPL Ratio: {(kanwilSummary.kurPercent_current || 0).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-5 mb-6">
        <h2 className="text-lg font-bold mb-4 uppercase" style={{ color: '#003d7a' }}>Perbandingan {previousMonth?.fullLabel || 'Bulan Lalu'} vs {currentMonth?.fullLabel || 'Bulan Ini'}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#1976D2" strokeWidth={2} name="Total NPL" />
            <Line type="monotone" dataKey="kumk" stroke="#22C55E" strokeWidth={2} name="KUMK" />
            <Line type="monotone" dataKey="kur" stroke="#F97316" strokeWidth={2} name="KUR" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cabang Table */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
          <h2 className="text-lg font-bold uppercase" style={{ color: '#003d7a' }}>Detail NPL Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExportNPLCabang} label="Export PDF" />
        </div>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr className="text-sm">
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">NPL (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
                <th className="py-3 px-4 text-right font-semibold">Gap</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
                <th className="py-3 px-4 text-right font-semibold">Gap</th>
                <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
                <th className="py-3 px-4 text-right font-semibold">Gap</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedCabang.map((c, i) => {
                const gapTotalColor = (c.gap_total || 0) > 0 ? 'text-red-600' : (c.gap_total || 0) < 0 ? 'text-green-600' : 'text-gray-500'
                const gapKumkColor = (c.gap_kumk || 0) > 0 ? 'text-red-600' : (c.gap_kumk || 0) < 0 ? 'text-green-600' : 'text-gray-500'
                const gapKurColor = (c.gap_kur || 0) > 0 ? 'text-red-600' : (c.gap_kur || 0) < 0 ? 'text-green-600' : 'text-gray-500'

                return (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-right">{f(c.total_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(c.totalPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapTotalColor}`}>
                      {(c.gap_total || 0) !== 0 ? ((c.gap_total || 0) > 0 ? '↑' : '↓') + ' ' + f(Math.abs(c.gap_total || 0)) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">{f(c.kumk_current)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{(c.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapKumkColor}`}>
                      {(c.gap_kumk || 0) !== 0 ? ((c.gap_kumk || 0) > 0 ? '↑' : '↓') + ' ' + f(Math.abs(c.gap_kumk || 0)) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">{f(c.kur_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#e84e0f' }}>{(c.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapKurColor}`}>
                      {(c.gap_kur || 0) !== 0 ? ((c.gap_kur || 0) > 0 ? '↑' : '↓') + ' ' + f(Math.abs(c.gap_kur || 0)) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// KOL2 Kanwil Content (similar structure to NPL)
function KOL2KanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="text-center py-12 text-gray-500">Belum ada data KOL 2 untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const currentMonth = monthInfo.current
  const previousMonth = monthInfo.previous

  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)
  const currentDateLabel = currentMonth?.shortLabel || formatDateID(new Date(), 'short')
  const previousDateLabel = previousMonth?.shortLabel || formatDateID(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'short')

  const handleExportKOL2Cabang = () => {
    if (!cabangList || cabangList.length === 0) {
      throw new Error('Tidak ada data cabang untuk diekspor')
    }
    const pdfData = formatKOL2CabangData(cabangList, kanwilName, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: '#003d7a' }}>Summary KOL 2 {kanwilName}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Total KOL 2</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.total_current)}</span>
              <span className="font-semibold" style={{ color: '#003d7a' }}>{(kanwilSummary.totalPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.total_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.totalPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>

          <div className="border-l-4 border-green-500 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUMK</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.kumk_current)}</span>
              <span className="text-green-600 font-semibold">{(kanwilSummary.kumkPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.kumk_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.kumkPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#e84e0f' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUR</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">{currentDateLabel}</span>
              <span className="text-2xl font-bold">Rp {f(kanwilSummary.kur_current)}</span>
              <span className="font-semibold" style={{ color: '#e84e0f' }}>{(kanwilSummary.kurPercent_current || 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{previousDateLabel}</span>
              <span className="text-lg text-gray-600">Rp {f(kanwilSummary.kur_previous)}</span>
              <span className="text-gray-500">{(kanwilSummary.kurPercent_previous || 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
          <h2 className="text-lg font-bold uppercase" style={{ color: '#003d7a' }}>Detail KOL 2 Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExportKOL2Cabang} label="Export PDF" />
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr className="text-sm">
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">KOL 2 (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
                <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedCabang.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-right">{f(c.total_current)}</td>
                  <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(c.totalPercent_current || 0).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">{f(c.kumk_current)}</td>
                  <td className="py-3 px-4 text-right text-green-600">{(c.kumkPercent_current || 0).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">{f(c.kur_current)}</td>
                  <td className="py-3 px-4 text-right font-semibold" style={{ color: '#e84e0f' }}>{(c.kurPercent_current || 0).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Realisasi Kredit Kanwil Content
function RealisasiKreditKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="text-center py-12 text-gray-500">Belum ada data Realisasi Kredit untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.kumk_real_current || 0) - (a.kumk_real_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportRealisasiKreditCabang = () => {
    if (!cabangList || cabangList.length === 0) {
      throw new Error('Tidak ada data cabang untuk diekspor')
    }
    const pdfData = formatRealisasiKreditCabangData(cabangList, kanwilName, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: '#003d7a' }}>Summary Realisasi Kredit {kanwilName}</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUMK</div>
            <div className="text-2xl font-bold">Rp {f(kanwilSummary.kumk_real_current || 0)}</div>
            <div className="text-xs text-gray-500 mt-1">1-{monthInfo.current?.day || 26} {monthInfo.current?.shortName || 'Jan'}'26</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#e84e0f' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">KUR</div>
            <div className="text-2xl font-bold">Rp {f(kanwilSummary.kur_total_current || 0)}</div>
            <div className="text-xs text-gray-500 mt-1">Total KUR</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">UMKM</div>
            <div className="text-2xl font-bold">Rp {f(kanwilSummary.umkm_real_current || 0)}</div>
            <div className="text-xs text-gray-500 mt-1">Real UMKM</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Total Realisasi</div>
            <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {f((kanwilSummary.kumk_real_current || 0) + (kanwilSummary.kur_total_current || 0) + (kanwilSummary.umkm_real_current || 0))}</div>
            <div className="text-xs text-gray-500 mt-1">KUMK + KUR + UMKM</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
          <h2 className="text-lg font-bold uppercase" style={{ color: '#003d7a' }}>Detail Realisasi Kredit Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExportRealisasiKreditCabang} label="Export PDF" />
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr className="text-sm">
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">UMKM (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Total (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Gap (Jt)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedCabang.map((c, i) => {
                const totalRealisasi = (c.kumk_real_current || 0) + (c.kur_total_current || 0) + (c.umkm_real_current || 0)
                const totalGap = (c.kumk_gap_prev || 0) + (c.kur_gap_prev || 0) + (c.umkm_gap_prev || 0)

                return (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-right">{f(c.kumk_real_current || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(c.kur_total_current || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(c.umkm_real_current || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{f(totalRealisasi)}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{f(totalGap)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Posisi Kredit Kanwil Content
function PosisiKreditKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="text-center py-12 text-gray-500">Belum ada data Posisi Kredit untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.posisi_current || 0) - (a.posisi_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  const handleExportPosisiKreditCabang = () => {
    if (!cabangList || cabangList.length === 0) {
      throw new Error('Tidak ada data cabang untuk diekspor')
    }
    const pdfData = formatPosisiKreditCabangData(cabangList, kanwilName, monthInfo)
    exportTableToPDF(pdfData)
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: '#003d7a' }}>Summary Posisi Kredit {kanwilName}</h2>
        <div className="grid grid-cols-5 gap-3">
          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Posisi Awal Jan</div>
            <div className="text-xl font-bold">Rp {f(kanwilSummary.posisi_jan || 0)}</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Realisasi</div>
            <div className="text-xl font-bold">Rp {f(kanwilSummary.realisasi || 0)}</div>
          </div>

          <div className="border-l-4 border-red-500 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Run Off</div>
            <div className="text-xl font-bold">Rp {f(kanwilSummary.runoff || 0)}</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Posisi Current</div>
            <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {f(kanwilSummary.posisi_current || 0)}</div>
          </div>

          <div className="border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#003d7a' }}>
            <div className="text-sm text-gray-600 mb-1 uppercase font-medium">Gap YoY</div>
            <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {f(kanwilSummary.gap_yoy || 0)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
          <h2 className="text-lg font-bold uppercase" style={{ color: '#003d7a' }}>Detail Posisi Kredit Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExportPosisiKreditCabang} label="Export PDF" />
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-purple-600 text-white">
              <tr className="text-sm">
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">Posisi Awal (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Posisi Current (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Gap MTD (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Gap YoY (Jt)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedCabang.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-right">{f(c.posisi_jan || 0)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{f(c.posisi_current || 0)}</td>
                  <td className="py-3 px-4 text-right">{f(c.gap_mtd || 0)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-purple-600">{f(c.gap_yoy || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
