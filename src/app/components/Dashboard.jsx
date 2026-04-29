'use client'
import { useState } from 'react'
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
    { id: 'npl', label: 'NPL' },
    { id: 'kol2', label: 'KOL 2' },
    { id: 'realisasi_kredit', label: 'Realisasi Kredit' },
    { id: 'posisi_kredit', label: 'Posisi Kredit' },
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
    <>
      {/* Metric tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-[#003d7a] border-[#003d7a]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'npl' && <NPLContent data={data} metadata={metadata} />}
        {activeTab === 'kol2' && <KOL2Content data={data} metadata={metadata} />}
        {activeTab === 'realisasi_kredit' && <RealisasiKreditContent data={data} metadata={metadata} />}
        {activeTab === 'posisi_kredit' && <PosisiKreditContent data={data} metadata={metadata} />}
      </div>
    </>
  )
}

// ── NPL ──────────────────────────────────────────────────────────────────────

function NPLContent({ data, metadata }) {
  if (!data) {
    return <div className="py-12 text-center text-gray-500">Belum ada data NPL</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

  const handleExport = () => {
    if (!kanwilData?.length) throw new Error('Tidak ada data untuk diekspor')
    exportTableToPDF(formatNPLKanwilData(kanwilData, monthInfo))
  }

  return (
    <>
      {totalNasional && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Total Nasional NPL — {monthInfo.current.fullLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Total NPL (Jt)" accent="#003d7a">
              <div className="text-2xl font-bold text-gray-900">Rp {f(totalNasional.total_current)}</div>
              <div className="text-base font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.totalPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
            <StatCard label="KUMK (Jt)" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kumk_current)}</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.kumkPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
            <StatCard label="KUR (Jt)" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kur_current)}</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.kurPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
          </div>
        </div>
      )}

      {kanwilData?.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">NPL Per Kanwil</h2>
            <ExportButton onClick={handleExport} label="Export PDF" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr>
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
              <tbody>
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.kumk_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{f(k.kur_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{f(k.total_current)}</td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: '#003d7a' }}>{(k.totalPercent_current || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── KOL 2 ────────────────────────────────────────────────────────────────────

function KOL2Content({ data, metadata }) {
  if (!data) {
    return <div className="py-12 text-center text-gray-500">Belum ada data KOL 2</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

  const handleExport = () => {
    if (!kanwilData?.length) throw new Error('Tidak ada data untuk diekspor')
    exportTableToPDF(formatKOL2KanwilData(kanwilData, monthInfo))
  }

  return (
    <>
      {totalNasional && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Total Nasional KOL 2 — {monthInfo.current.fullLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Total KOL 2 (Jt)" accent="#003d7a">
              <div className="text-2xl font-bold text-gray-900">Rp {f(totalNasional.total_current)}</div>
              <div className="text-base font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.totalPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
            <StatCard label="KUMK (Jt)" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kumk_current)}</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.kumkPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
            <StatCard label="KUR (Jt)" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kur_current)}</div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: '#003d7a' }}>{(totalNasional.kurPercent_current || 0).toFixed(2)}%</div>
            </StatCard>
          </div>
        </div>
      )}

      {kanwilData?.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">KOL 2 Per Kanwil</h2>
            <ExportButton onClick={handleExport} label="Export PDF" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr>
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
              <tbody>
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.kumk_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{f(k.kur_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(k.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{f(k.total_current)}</td>
                    <td className="py-3 px-4 text-right font-bold" style={{ color: '#003d7a' }}>{(k.totalPercent_current || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── Realisasi Kredit ──────────────────────────────────────────────────────────

function RealisasiKreditContent({ data, metadata }) {
  if (!data) {
    return <div className="py-12 text-center text-gray-500">Belum ada data Realisasi Kredit</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

  const handleExport = () => {
    if (!kanwilData?.length) throw new Error('Tidak ada data untuk diekspor')
    exportTableToPDF(formatRealisasiKreditKanwilData(kanwilData, monthInfo))
  }

  return (
    <>
      {totalNasional && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Total Nasional Realisasi Kredit — {monthInfo.current.fullLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="KUMK (Jt)" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kumk_real_current)}</div>
              <div className="text-xs text-gray-500 mt-0.5">1–{monthInfo.current?.day || 26} {monthInfo.current?.shortName || ''}</div>
            </StatCard>
            <StatCard label="KUR (Jt)" accent="#e84e0f">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.kur_total_current)}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total KUR</div>
            </StatCard>
            <StatCard label="Total Realisasi (Jt)" accent="#003d7a">
              <div className="text-xl font-bold" style={{ color: '#003d7a' }}>Rp {f(totalNasional.umkm_real_current)}</div>
            </StatCard>
          </div>
        </div>
      )}

      {kanwilData?.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Realisasi Kredit Per Kanwil</h2>
            <ExportButton onClick={handleExport} label="Export PDF" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">No</th>
                  <th className="py-3 px-4 text-left font-semibold">Kanwil</th>
                  <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                  <th className="py-3 px-4 text-right font-semibold">Total Realisasi (Jt)</th>
                </tr>
              </thead>
              <tbody>
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.kumk_real_current)}</td>
                    <td className="py-3 px-4 text-right">{f(k.kur_total_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{f(k.umkm_real_current)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── Posisi Kredit ─────────────────────────────────────────────────────────────

function PosisiKreditContent({ data, metadata }) {
  if (!data) {
    return <div className="py-12 text-center text-gray-500">Belum ada data Posisi Kredit</div>
  }

  const { totalNasional, kanwilData, monthInfo: dataMonthInfo } = data
  const monthInfo = dataMonthInfo || metadata?.monthInfo || getMonthInfo()
  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)
  const gapColor = (value) => value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'

  const handleExport = () => {
    if (!kanwilData?.length) throw new Error('Tidak ada data untuk diekspor')
    exportTableToPDF(formatPosisiKreditKanwilData(kanwilData, monthInfo))
  }

  return (
    <>
      {totalNasional && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Total Nasional Posisi Kredit — {monthInfo.current.fullLabel}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Posisi Awal Jan" accent="#003d7a">
              <div className="text-xl font-bold text-gray-900">Rp {f(totalNasional.posisi_jan)}</div>
            </StatCard>
            <StatCard label="Posisi Current" accent="#003d7a">
              <div className="text-xl font-bold" style={{ color: '#003d7a' }}>Rp {f(totalNasional.posisi_current)}</div>
            </StatCard>
            <StatCard label="Gap MTD" accent="#003d7a">
              <div className={`text-xl font-bold ${gapColor(totalNasional.gap_mtd || 0)}`}>Rp {f(totalNasional.gap_mtd)}</div>
            </StatCard>
            <StatCard label="Gap YoY" accent="#003d7a">
              <div className={`text-xl font-bold ${gapColor(totalNasional.gap_yoy || 0)}`}>Rp {f(totalNasional.gap_yoy)}</div>
            </StatCard>
          </div>
        </div>
      )}

      {kanwilData?.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Posisi Kredit Per Kanwil</h2>
            <ExportButton onClick={handleExport} label="Export PDF" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-white" style={{ backgroundColor: '#003d7a' }}>
                <tr>
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
              <tbody>
                {kanwilData.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 text-right">{f(k.posisi_jan)}</td>
                    <td className="py-3 px-4 text-right">{f(k.realisasi)}</td>
                    <td className="py-3 px-4 text-right">{f(k.runoff)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{f(k.posisi_current)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapColor(k.gap_mtd || 0)}`}>{f(k.gap_mtd)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapColor(k.gap_yoy || 0)}`}>{f(k.gap_yoy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── Shared ───────────────────────────────────────────────────────────────────

function StatCard({ label, accent = '#003d7a', children }) {
  return (
    <div className="bg-gray-50 border-l-4 rounded-xl p-4" style={{ borderLeftColor: accent }}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">{label}</div>
      {children}
    </div>
  )
}
