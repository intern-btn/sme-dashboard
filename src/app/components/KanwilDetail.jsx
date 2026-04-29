'use client'
import { useState } from 'react'
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
        <div className="ml-auto flex items-center pr-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Kanwil {currentKanwil}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'npl' && <NPLKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
        {activeTab === 'kol2' && <KOL2KanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
        {activeTab === 'realisasi_kredit' && <RealisasiKreditKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
        {activeTab === 'posisi_kredit' && <PosisiKreditKanwilContent data={data} metadata={metadata} kanwilName={currentKanwil} />}
      </div>
    </>
  )
}

// ── NPL ──────────────────────────────────────────────────────────────────────

function NPLKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="py-12 text-center text-gray-500">Belum ada data NPL untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const currentMonth = monthInfo.current
  const previousMonth = monthInfo.previous
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)
  const curLabel = currentMonth?.shortLabel || formatDateID(new Date(), 'short')
  const prevLabel = previousMonth?.shortLabel || ''

  const handleExport = () => {
    if (!cabangList.length) throw new Error('Tidak ada data cabang untuk diekspor')
    exportTableToPDF(formatNPLCabangData(cabangList, kanwilName, monthInfo))
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary NPL</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <CompareCard label="Total NPL (Jt)" accent="#003d7a"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.total_current)}`} curPct={`${(kanwilSummary.totalPercent_current || 0).toFixed(2)}%`} curAccent="#003d7a"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.total_previous)}`} prevPct={`${(kanwilSummary.totalPercent_previous || 0).toFixed(2)}%`}
          />
          <CompareCard label="KUMK (Jt)" accent="#16a34a"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.kumk_current)}`} curPct={`${(kanwilSummary.kumkPercent_current || 0).toFixed(2)}%`} curAccent="#16a34a"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.kumk_previous)}`} prevPct={`${(kanwilSummary.kumkPercent_previous || 0).toFixed(2)}%`}
          />
          <CompareCard label="KUR (Jt)" accent="#e84e0f"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.kur_current)}`} curPct={`${(kanwilSummary.kurPercent_current || 0).toFixed(2)}%`} curAccent="#e84e0f"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.kur_previous)}`} prevPct={`${(kanwilSummary.kurPercent_previous || 0).toFixed(2)}%`}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Detail NPL Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExport} label="Export PDF" />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr>
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
            <tbody>
              {sortedCabang.map((c, i) => {
                const gapColor = (v) => v > 0 ? 'text-red-600' : v < 0 ? 'text-green-600' : 'text-gray-400'
                const gapFmt = (v) => v !== 0 ? `${v > 0 ? '↑' : '↓'} ${f(Math.abs(v))}` : '—'
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-right">{f(c.total_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(c.totalPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapColor(c.gap_total || 0)}`}>{gapFmt(c.gap_total || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(c.kumk_current)}</td>
                    <td className="py-3 px-4 text-right text-green-700">{(c.kumkPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapColor(c.gap_kumk || 0)}`}>{gapFmt(c.gap_kumk || 0)}</td>
                    <td className="py-3 px-4 text-right">{f(c.kur_current)}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#e84e0f' }}>{(c.kurPercent_current || 0).toFixed(2)}%</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gapColor(c.gap_kur || 0)}`}>{gapFmt(c.gap_kur || 0)}</td>
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

// ── KOL 2 ────────────────────────────────────────────────────────────────────

function KOL2KanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="py-12 text-center text-gray-500">Belum ada data KOL 2 untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const currentMonth = monthInfo.current
  const previousMonth = monthInfo.previous
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)
  const curLabel = currentMonth?.shortLabel || formatDateID(new Date(), 'short')
  const prevLabel = previousMonth?.shortLabel || ''

  const handleExport = () => {
    if (!cabangList.length) throw new Error('Tidak ada data cabang untuk diekspor')
    exportTableToPDF(formatKOL2CabangData(cabangList, kanwilName, monthInfo))
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary KOL 2</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <CompareCard label="Total KOL 2 (Jt)" accent="#003d7a"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.total_current)}`} curPct={`${(kanwilSummary.totalPercent_current || 0).toFixed(2)}%`} curAccent="#003d7a"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.total_previous)}`} prevPct={`${(kanwilSummary.totalPercent_previous || 0).toFixed(2)}%`}
          />
          <CompareCard label="KUMK (Jt)" accent="#16a34a"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.kumk_current)}`} curPct={`${(kanwilSummary.kumkPercent_current || 0).toFixed(2)}%`} curAccent="#16a34a"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.kumk_previous)}`} prevPct={`${(kanwilSummary.kumkPercent_previous || 0).toFixed(2)}%`}
          />
          <CompareCard label="KUR (Jt)" accent="#e84e0f"
            curLabel={curLabel} curValue={`Rp ${f(kanwilSummary.kur_current)}`} curPct={`${(kanwilSummary.kurPercent_current || 0).toFixed(2)}%`} curAccent="#e84e0f"
            prevLabel={prevLabel} prevValue={`Rp ${f(kanwilSummary.kur_previous)}`} prevPct={`${(kanwilSummary.kurPercent_previous || 0).toFixed(2)}%`}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Detail KOL 2 Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExport} label="Export PDF" />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr>
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
            <tbody>
              {sortedCabang.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-right">{f(c.total_current)}</td>
                  <td className="py-3 px-4 text-right font-semibold" style={{ color: '#003d7a' }}>{(c.totalPercent_current || 0).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">{f(c.kumk_current)}</td>
                  <td className="py-3 px-4 text-right text-green-700">{(c.kumkPercent_current || 0).toFixed(2)}%</td>
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

// ── Realisasi Kredit ──────────────────────────────────────────────────────────

function RealisasiKreditKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="py-12 text-center text-gray-500">Belum ada data Realisasi Kredit untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.kumk_real_current || 0) - (a.kumk_real_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

  const handleExport = () => {
    if (!cabangList.length) throw new Error('Tidak ada data cabang untuk diekspor')
    exportTableToPDF(formatRealisasiKreditCabangData(cabangList, kanwilName, monthInfo))
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary Realisasi Kredit</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="KUMK (Jt)" accent="#003d7a">
            <div className="text-xl font-bold text-gray-900">Rp {f(kanwilSummary.kumk_real_current)}</div>
            <div className="text-xs text-gray-500 mt-0.5">1–{monthInfo.current?.day || 26} {monthInfo.current?.shortName || ''}</div>
          </StatCard>
          <StatCard label="KUR (Jt)" accent="#e84e0f">
            <div className="text-xl font-bold text-gray-900">Rp {f(kanwilSummary.kur_total_current)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total KUR</div>
          </StatCard>
          <StatCard label="Total Realisasi (Jt)" accent="#003d7a">
            <div className="text-xl font-bold" style={{ color: '#003d7a' }}>Rp {f(kanwilSummary.umkm_real_current)}</div>
          </StatCard>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Detail Realisasi Kredit Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExport} label="Export PDF" />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr>
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">KUR (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Total Realisasi (Jt)</th>
              </tr>
            </thead>
            <tbody>
              {sortedCabang.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-right">{f(c.kumk_real_current)}</td>
                  <td className="py-3 px-4 text-right">{f(c.kur_total_current)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{f(c.umkm_real_current)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Posisi Kredit ─────────────────────────────────────────────────────────────

function PosisiKreditKanwilContent({ data, metadata, kanwilName }) {
  if (!data?.kanwilData || !data?.cabangData) {
    return <div className="py-12 text-center text-gray-500">Belum ada data Posisi Kredit untuk kanwil ini</div>
  }

  const monthInfo = data.monthInfo || metadata?.monthInfo || getMonthInfo()
  const kanwilSummary = data.kanwilData.find(k => k.name === kanwilName) || {}
  const cabangList = data.cabangData.filter(c => c.kanwil === kanwilName)
  const sortedCabang = [...cabangList].sort((a, b) => (b.posisi_current || 0) - (a.posisi_current || 0))

  const f = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)
  const gapColor = (value) => value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'

  const handleExport = () => {
    if (!cabangList.length) throw new Error('Tidak ada data cabang untuk diekspor')
    exportTableToPDF(formatPosisiKreditCabangData(cabangList, kanwilName, monthInfo))
  }

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary Posisi Kredit</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Posisi Awal Jan" accent="#003d7a">
            <div className="text-lg font-bold text-gray-900">Rp {f(kanwilSummary.posisi_jan)}</div>
          </StatCard>
          <StatCard label="Realisasi" accent="#003d7a">
            <div className="text-lg font-bold text-gray-900">Rp {f(kanwilSummary.realisasi)}</div>
          </StatCard>
          <StatCard label="Run Off" accent="#ef4444">
            <div className="text-lg font-bold text-gray-900">Rp {f(kanwilSummary.runoff)}</div>
          </StatCard>
          <StatCard label="Posisi Current" accent="#003d7a">
            <div className="text-lg font-bold" style={{ color: '#003d7a' }}>Rp {f(kanwilSummary.posisi_current)}</div>
          </StatCard>
          <StatCard label="Gap YoY" accent="#003d7a">
            <div className={`text-lg font-bold ${gapColor(kanwilSummary.gap_yoy || 0)}`}>Rp {f(kanwilSummary.gap_yoy)}</div>
          </StatCard>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Detail Posisi Kredit Per Cabang ({sortedCabang.length})</h2>
          <ExportButton onClick={handleExport} label="Export PDF" />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr>
                <th className="py-3 px-4 text-left font-semibold">No</th>
                <th className="py-3 px-4 text-left font-semibold">Cabang</th>
                <th className="py-3 px-4 text-right font-semibold">Posisi Awal (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Posisi Current (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Gap MTD (Jt)</th>
                <th className="py-3 px-4 text-right font-semibold">Gap YoY (Jt)</th>
              </tr>
            </thead>
            <tbody>
              {sortedCabang.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-right">{f(c.posisi_jan)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{f(c.posisi_current)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${gapColor(c.gap_mtd || 0)}`}>{f(c.gap_mtd)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${gapColor(c.gap_yoy || 0)}`}>{f(c.gap_yoy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

function CompareCard({ label, accent, curLabel, curValue, curPct, curAccent, prevLabel, prevValue, prevPct }) {
  return (
    <div className="bg-gray-50 border-l-4 rounded-xl p-4" style={{ borderLeftColor: accent }}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{label}</div>
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-xs text-gray-400">{curLabel}</span>
        <span className="text-xl font-bold text-gray-900">{curValue}</span>
        <span className="text-sm font-semibold" style={{ color: curAccent }}>{curPct}</span>
      </div>
      {prevLabel && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-gray-400">{prevLabel}</span>
          <span className="text-sm text-gray-500">{prevValue}</span>
          <span className="text-xs text-gray-400">{prevPct}</span>
        </div>
      )}
    </div>
  )
}
