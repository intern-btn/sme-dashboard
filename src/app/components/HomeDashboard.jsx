'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Legend, LabelList,
} from 'recharts'

const KANWIL_COLORS = [
  '#003d7a', // BTN Navy
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#0d9488', // Teal
  '#16a34a', // Green
  '#7c3aed', // Violet
  '#be185d', // Pink
  '#dc2626', // Red
  '#6b7280', // Slate
]

// Conventional Kanwil order — used for fixed-position bars and stable per-Kanwil colors
const KANWIL_ORDER = [
  'Jakarta I', 'Jakarta II', 'Jateng DIY', 'Jabanus', 'Jawa Barat',
  'Kalimantan', 'Sulampua', 'Sumatera 1', 'Sumatera 2',
]
function kanwilColor(name) {
  const i = KANWIL_ORDER.indexOf(name)
  return KANWIL_COLORS[(i >= 0 ? i : KANWIL_ORDER.length) % KANWIL_COLORS.length]
}
function orderByKanwil(arr) {
  const rank = (n) => {
    const i = KANWIL_ORDER.indexOf(n)
    return i < 0 ? KANWIL_ORDER.length : i
  }
  return [...arr].sort((a, b) => rank(a.name) - rank(b.name))
}

const BTN_NAVY  = '#003d7a'
const BTN_RED   = '#E80025'
const BTN_AMBER = '#F59E0B'
const SLATE_400 = '#94A3B8'
const GRAY_200  = '#E5E7EB'
const BLUE_600  = '#1976D2'
const BLUE_300  = '#60A5FA'

function formatDateTime(dateString) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '-' }
}

function fmt(val) {
  if (val == null || isNaN(val)) return '–'
  return Number(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
}

function fmtJt(val) {
  if (val == null || isNaN(val)) return '–'
  return (val / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function fmtPct(val) {
  if (val == null || isNaN(val)) return '–'
  return `${Number(val).toFixed(2)}%`
}

// Milyar: stored values are in Juta, so Milyar = value / 1000 (0 decimals)
function fmtM(val) {
  if (val == null || isNaN(val)) return '–'
  return (val / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function fmtJtShort(val) {
  if (val == null || isNaN(val)) return ''
  const n = Number(val) / 1_000_000
  if (n >= 1000) return `${(n / 1000).toFixed(0)}T`
  if (n >= 1) return `${n.toFixed(0)}Jt`
  return `${(val / 1000).toFixed(0)}K`
}

function isLive(uploadDate) {
  if (!uploadDate) return null
  return (Date.now() - new Date(uploadDate).getTime()) / 36e5 < 24
}

function FreshnessDot({ uploadDate }) {
  const live = isLive(uploadDate)
  if (live === null) return <span className="inline-flex w-2 h-2 rounded-full bg-gray-300" />
  return (
    <span className={`inline-flex w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
  )
}

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
      <Link href={href} className="text-xs font-medium text-[#003d7a] hover:underline underline-offset-2">
        Lihat detail →
      </Link>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-gray-500 truncate">{label}</span>
      <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{value}</span>
    </div>
  )
}

function GapBadge({ label, value }) {
  const num = Number(value) || 0
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${num >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {num >= 0 ? '+' : ''}{fmt(num)} Jt
      </span>
    </div>
  )
}

function NoChartData({ height = 100 }) {
  return (
    <div style={{ height }} className="flex items-center justify-center text-[10px] text-gray-300">
      Tidak ada data
    </div>
  )
}

function TopKanwilMini({ kanwilData }) {
  const sorted = [...(kanwilData || [])].sort((a, b) => b.total_current - a.total_current)
  const top3 = sorted.slice(0, 3)
  const maxVal = top3[0]?.total_current || 1
  if (top3.length === 0) return null
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Top Kanwil</p>
      {top3.map((k) => (
        <div key={k.name}>
          <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
            <span className="truncate">{k.name}</span>
            <span className="ml-1 font-medium text-gray-800">{fmt(k.total_current)} Jt</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(k.total_current / maxVal) * 100}%`,
                backgroundColor: KANWIL_COLORS[
                  (kanwilData || []).findIndex((c) => c.name === k.name) % KANWIL_COLORS.length
                ],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, uploadDate, children, style }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#003d7a] transition-all duration-200 flex flex-col gap-3"
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <FreshnessDot uploadDate={uploadDate} />
      </div>
      <div className="flex-1">{children}</div>
      {uploadDate && (
        <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">{formatDateTime(uploadDate)}</p>
      )}
    </div>
  )
}

function SegToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
            value === o.value ? 'bg-white text-[#003d7a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const RADIAN = Math.PI / 180

// Excel-style data callout: leader line from the slice to "name / value M · share%"
function PieCallout({ cx, cy, midAngle, outerRadius, value, name, percent }) {
  const cos = Math.cos(-midAngle * RADIAN)
  const sin = Math.sin(-midAngle * RADIAN)
  const sx = cx + (outerRadius + 2) * cos
  const sy = cy + (outerRadius + 2) * sin
  const mx = cx + (outerRadius + 16) * cos
  const my = cy + (outerRadius + 16) * sin
  const dir = cos >= 0 ? 1 : -1
  const ex = mx + dir * 14
  const tx = ex + dir * 5
  const anchor = cos >= 0 ? 'start' : 'end'
  return (
    <g>
      <polyline points={`${sx},${sy} ${mx},${my} ${ex},${my}`} stroke="#cbd5e1" fill="none" strokeWidth={1} />
      <circle cx={ex} cy={my} r={1.6} fill="#cbd5e1" />
      <text x={tx} y={my} textAnchor={anchor} dominantBaseline="central">
        <tspan fontSize={10} fill="#64748b">{name}</tspan>
        <tspan x={tx} dy={13} fontSize={12} fontWeight={700} fill="#1f2937">{fmtM(value)} M</tspan>
        <tspan fontSize={10} fontWeight={600} fill="#94a3b8"> · {Math.round((percent || 0) * 100)}%</tspan>
      </text>
    </g>
  )
}

// Point 1: dual-view Kanwil distribution. Metric toggle (NPL | KOL 2) × view toggle (Pie | Bar).
// Pie = composition (share of the pile); Bar = quality (ratio %) in fixed Kanwil order.
function KanwilDistribution({ nplData, kol2Data }) {
  const [metric, setMetric] = useState('npl')

  const src = metric === 'npl' ? nplData : kol2Data
  const nasional = src?.totalNasional
  const metricLabel = metric === 'npl' ? 'NPL' : 'KOL 2'
  const accent = metric === 'npl' ? BTN_RED : BTN_AMBER

  const rows = orderByKanwil(
    (src?.kanwilData ?? []).map((k) => ({
      name: (k.name || '').replace('Kanwil ', ''),
      value: Number(k.total_current) || 0,
      ratio: Number(k.totalPercent_current) || 0,
    }))
  ).map((r) => ({ ...r, barLabel: `${r.ratio.toFixed(2)}% · ${fmtM(r.value)} M` }))

  const totalVal = rows.reduce((s, r) => s + r.value, 0)
  const hasData = rows.length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Distribusi per Kanwil
        </p>
        <SegToggle
          value={metric}
          onChange={setMetric}
          options={[{ value: 'npl', label: 'NPL' }, { value: 'kol2', label: 'KOL 2' }]}
        />
      </div>

      {!hasData ? (
        <NoChartData height={360} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

          {/* Pie — composition (share of the national pile) */}
          <div>
            <p className="text-[11px] text-center text-gray-400 mb-1">
              Komposisi · porsi dari total {metricLabel} nasional
            </p>
            <div style={{ position: 'relative', height: 420 }}>
              <ResponsiveContainer width="100%" height={420}>
                <PieChart margin={{ top: 28, right: 88, bottom: 28, left: 88 }}>
                  <Pie
                    data={rows}
                    cx="50%"
                    cy="50%"
                    innerRadius={86}
                    outerRadius={130}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={1}
                    stroke="#fff"
                    label={PieCallout}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {rows.map((r) => (
                      <Cell key={r.name} fill={kanwilColor(r.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n, item) => [
                      `${fmtM(v)} M · ${Math.round((v / totalVal) * 100)}% dari total ${metricLabel}`,
                      item?.payload?.name,
                    ]}
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${accent}` }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{metricLabel} Nasional</span>
                <span className="text-2xl font-bold text-[#003d7a] leading-tight">{fmtM(nasional?.total_current)} M</span>
                <span className="text-[11px] font-semibold text-gray-500">{fmtPct(nasional?.totalPercent_current)}</span>
              </div>
            </div>
          </div>

          {/* Bars — quality (ratio %), fixed Kanwil order */}
          <div>
            <p className="text-[11px] text-center text-gray-400 mb-1">
              Rasio {metricLabel} per Kanwil (% terhadap baki debet)
            </p>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 100, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v, n, item) => [
                    `${(item?.payload?.ratio ?? 0).toFixed(2)}% · ${fmtM(item?.payload?.value)} M`,
                    `${metricLabel} ${item?.payload?.name}`,
                  ]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${accent}` }}
                />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
                  {rows.map((r) => (
                    <Cell key={r.name} fill={kanwilColor(r.name)} />
                  ))}
                  <LabelList
                    dataKey="barLabel"
                    position="right"
                    style={{ fontSize: 10, fontWeight: 700, fill: '#1f2937' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  )
}

function RealisasiHarianSection({
  realHarianData, realHarianMeta,
  harianChartData, harianCumData,
  mtdCurrent, mtdPrevious, mtdGrowthPct,
  mounted,
}) {
  const [view, setView] = useState('harian')
  const chartData = view === 'harian' ? harianChartData : harianCumData
  const currentLabel = realHarianData?.monthInfo?.current?.fullLabel ?? 'Bulan Ini'
  const previousLabel = realHarianData?.monthInfo?.previous?.fullLabel ?? 'Bulan Lalu'

  return (
    <section
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.4s ease 280ms, transform 0.4s ease 280ms',
      }}
    >
      <SectionHeader title="Realisasi Harian" href="/monitoring" />
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#003d7a] transition-all duration-200">

        {/* Summary row */}
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3 mb-4">
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <FreshnessDot uploadDate={realHarianMeta?.uploadDate} />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">MTD Total</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 flex-1">
            <div>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(mtdCurrent)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{currentLabel}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-500 leading-none">
                {fmt(mtdPrevious)}
                <span className="text-xs font-normal text-gray-400 ml-1">Jt</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{previousLabel}</p>
            </div>
            {mtdGrowthPct !== null && (
              <div>
                <p className={`text-lg font-semibold leading-none ${parseFloat(mtdGrowthPct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(mtdGrowthPct) >= 0 ? '+' : ''}{mtdGrowthPct}%
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">vs bulan lalu</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {realHarianMeta?.uploadDate && (
              <p className="text-[10px] text-gray-400">{formatDateTime(realHarianMeta.uploadDate)}</p>
            )}
            <SegToggle
              value={view}
              onChange={setView}
              options={[{ value: 'harian', label: 'Harian' }, { value: 'kumulatif', label: 'Kumulatif' }]}
            />
          </div>
        </div>

        {/* Area chart */}
        {harianChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BTN_NAVY} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={BTN_NAVY} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtJtShort}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v, name) => [`${fmt(v)} Jt`, name]}
                labelFormatter={(l) => `Tgl ${l}`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BTN_NAVY}` }}
              />
              <Area
                type="monotone"
                dataKey="current"
                name={currentLabel}
                stroke={BTN_NAVY}
                strokeWidth={2.5}
                fill="url(#gradCurrent)"
                dot={false}
                activeDot={{ r: 4, fill: BTN_NAVY }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                name={previousLabel}
                stroke={SLATE_400}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: SLATE_400 }}
              />
              <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
            Belum ada data harian bulan ini
          </div>
        )}
      </div>
    </section>
  )
}

function RKAPTable({ rkapKurData, rkapKumkData, rkapPosisiData, realKreditData, posisiData, user }) {
  const hasRkap = rkapKurData || rkapKumkData || rkapPosisiData
  const monthInfo = realKreditData?.monthInfo?.current ?? posisiData?.monthInfo?.current
  const currentMonthIdx = monthInfo?.month ?? new Date().getMonth()
  const monthLabel = monthInfo?.shortLabel ?? ''

  function getRow(kanwilName) {
    const kurCumArr = rkapKurData?.kanwilData?.find(k => k.name === kanwilName)?.cumMonthly
    const kurTarget = kurCumArr?.[currentMonthIdx] ?? null
    const kumkTarget = rkapKumkData?.kanwilData?.find(k => k.name === kanwilName)?.cumMonthly?.[currentMonthIdx] ?? null
    const posisiKanwil = rkapPosisiData?.kanwilData?.find(k => k.name === kanwilName)
    const posTarget = posisiKanwil?.monthly?.[currentMonthIdx] ?? null
    const posKurTarget = posisiKanwil?.kurMonthly?.[currentMonthIdx] ?? null
    const realK = realKreditData?.kanwilData?.find(k => k.name === kanwilName)
    const kurAkt = realK?.kur_ytd_current ?? null
    const kumkAkt = realK?.kumk_ytd_current ?? null
    const posisiKanwilAkt = posisiData?.kanwilData?.find(k => k.name === kanwilName)
    const posAkt = posisiKanwilAkt?.kumk_posisi_current ?? null
    const posKurAkt = posisiKanwilAkt?.kur_posisi_current ?? null
    const kurGap = kurTarget !== null && kurAkt !== null ? kurAkt - kurTarget : null
    const kumkGap = kumkTarget !== null && kumkAkt !== null ? kumkAkt - kumkTarget : null
    const posGap = posTarget !== null && posAkt !== null ? posAkt - posTarget : null
    const posKurGap = posKurTarget !== null && posKurAkt !== null ? posKurAkt - posKurTarget : null
    return {
      kanwilName,
      kurTarget, kurAkt, kurGap, kurPct: kurTarget ? kurAkt / kurTarget * 100 : null,
      kumkTarget, kumkAkt, kumkGap, kumkPct: kumkTarget ? kumkAkt / kumkTarget * 100 : null,
      posTarget, posAkt, posGap, posPct: posTarget ? posAkt / posTarget * 100 : null,
      posKurTarget, posKurAkt, posKurGap, posKurPct: posKurTarget ? posKurAkt / posKurTarget * 100 : null,
    }
  }

  function getNationalRow() {
    const kurCumNat = rkapKurData?.national?.cumMonthly
    const kurTarget = kurCumNat?.[currentMonthIdx] ?? null
    const kumkTarget = rkapKumkData?.national?.cumMonthly?.[currentMonthIdx] ?? null
    const posTarget = rkapPosisiData?.national?.monthly?.[currentMonthIdx] ?? null
    const posKurTarget = rkapPosisiData?.national?.kurMonthly?.[currentMonthIdx] ?? null
    const natReal = realKreditData?.totalNasional
    const kurAkt = natReal?.kur_ytd_current ?? null
    const kumkAkt = natReal?.kumk_ytd_current ?? null
    const posisiNatAkt = posisiData?.totalNasional
    const posAkt = posisiNatAkt?.kumk_posisi_current ?? null
    const posKurAkt = posisiNatAkt?.kur_posisi_current ?? null
    const kurGap = kurTarget !== null && kurAkt !== null ? kurAkt - kurTarget : null
    const kumkGap = kumkTarget !== null && kumkAkt !== null ? kumkAkt - kumkTarget : null
    const posGap = posTarget !== null && posAkt !== null ? posAkt - posTarget : null
    const posKurGap = posKurTarget !== null && posKurAkt !== null ? posKurAkt - posKurTarget : null
    return {
      kanwilName: 'Total Nasional',
      kurTarget, kurAkt, kurGap, kurPct: kurTarget ? kurAkt / kurTarget * 100 : null,
      kumkTarget, kumkAkt, kumkGap, kumkPct: kumkTarget ? kumkAkt / kumkTarget * 100 : null,
      posTarget, posAkt, posGap, posPct: posTarget ? posAkt / posTarget * 100 : null,
      posKurTarget, posKurAkt, posKurGap, posKurPct: posKurTarget ? posKurAkt / posKurTarget * 100 : null,
    }
  }

  const fmtMVal = (v) => v !== null ? `${fmtM(v)} M` : '–'
  const fmtGap = (v) => v !== null ? `${v >= 0 ? '+' : ''}${fmtM(v)} M` : '–'
  const fmtPct1 = (v) => v !== null ? `${v.toFixed(1)}%` : '–'
  const gapCls = (v) => v === null ? 'text-gray-400' : v >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
  const pctCls = (v) => v === null ? 'text-gray-400' : v >= 100 ? 'text-green-600 font-semibold' : v >= 80 ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'

  const TH = ({ children, className = '', ...rest }) => (
    <th className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${className}`} {...rest}>{children}</th>
  )
  const TD = ({ children, className = '' }) => (
    <td className={`px-2 py-2 text-right text-[11px] tabular-nums ${className}`}>{children}</td>
  )

  const [rkapView, setRkapView] = useState('realisasi')
  const isScoped = user?.accessScope === 'kanwil' || user?.accessScope === 'cabang'
  const rows = hasRkap
    ? isScoped && user?.kanwil
      ? [getRow(user.kanwil)]
      : [...KANWIL_ORDER.map(getRow), getNationalRow()]
    : []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Parameter RKAP{monthLabel ? ` — ${monthLabel}` : ''}
        </p>
        {hasRkap && (
          <SegToggle
            options={[{ value: 'realisasi', label: 'Realisasi' }, { value: 'posisi', label: 'Posisi' }]}
            value={rkapView}
            onChange={setRkapView}
          />
        )}
      </div>
      {!hasRkap ? (
        <div className="h-16 flex items-center justify-center text-sm text-gray-400">
          Data RKAP belum tersedia — upload file yang memiliki sheet 44a3, 44a5, dan 47a
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                <TH className="text-left text-gray-400 sticky left-0 bg-white" rowSpan={2}>Kanwil</TH>
                {rkapView === 'realisasi' ? (
                  <>
                    <TH className="text-center text-[#003d7a] border-l border-gray-100" colSpan={4}>Realisasi KUR</TH>
                    <TH className="text-center text-[#003d7a] border-l border-gray-100" colSpan={4}>Realisasi KUMK</TH>
                  </>
                ) : (
                  <>
                    <TH className="text-center text-[#003d7a] border-l border-gray-100" colSpan={4}>Posisi KUR</TH>
                    <TH className="text-center text-[#003d7a] border-l border-gray-100" colSpan={4}>Posisi KUMK</TH>
                  </>
                )}
              </tr>
              <tr className="border-b border-gray-200">
                {(rkapView === 'realisasi' ? ['KUR', 'KUMK'] : ['KUR', 'KUMK']).flatMap((g, gi) =>
                  ['Target', 'Aktual', 'Gap', '%'].map((h, hi) => (
                    <TH key={`${g}-${h}`} className={`text-right text-gray-400 font-medium ${hi === 0 || gi === 0 ? 'border-l border-gray-100' : ''}`}>{h}</TH>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isTotal = idx === rows.length - 1
                const rowCls = isTotal
                  ? 'border-t-2 border-gray-300 font-semibold bg-gray-50'
                  : 'border-b border-gray-100 hover:bg-gray-50'
                return (
                  <tr key={row.kanwilName} className={rowCls}>
                    <td className={`px-2 py-2 text-left text-[11px] sticky left-0 ${isTotal ? 'bg-gray-50 font-semibold text-gray-700' : 'bg-white text-gray-600'}`}>
                      {row.kanwilName}
                    </td>
                    {rkapView === 'realisasi' ? (
                      <>
                        <TD className="border-l border-gray-100 text-gray-500">{fmtMVal(row.kurTarget)}</TD>
                        <TD className="text-gray-700">{fmtMVal(row.kurAkt)}</TD>
                        <TD className={gapCls(row.kurGap)}>{fmtGap(row.kurGap)}</TD>
                        <TD className={pctCls(row.kurPct)}>{fmtPct1(row.kurPct)}</TD>
                        <TD className="border-l border-gray-100 text-gray-500">{fmtMVal(row.kumkTarget)}</TD>
                        <TD className="text-gray-700">{fmtMVal(row.kumkAkt)}</TD>
                        <TD className={gapCls(row.kumkGap)}>{fmtGap(row.kumkGap)}</TD>
                        <TD className={pctCls(row.kumkPct)}>{fmtPct1(row.kumkPct)}</TD>
                      </>
                    ) : (
                      <>
                        <TD className="border-l border-gray-100 text-gray-500">{fmtMVal(row.posKurTarget)}</TD>
                        <TD className="text-gray-700">{fmtMVal(row.posKurAkt)}</TD>
                        <TD className={gapCls(row.posKurGap)}>{fmtGap(row.posKurGap)}</TD>
                        <TD className={pctCls(row.posKurPct)}>{fmtPct1(row.posKurPct)}</TD>
                        <TD className="border-l border-gray-100 text-gray-500">{fmtMVal(row.posTarget)}</TD>
                        <TD className="text-gray-700">{fmtMVal(row.posAkt)}</TD>
                        <TD className={gapCls(row.posGap)}>{fmtGap(row.posGap)}</TD>
                        <TD className={pctCls(row.posPct)}>{fmtPct1(row.posPct)}</TD>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function HomeDashboard({
  user,
  nplData, nplMeta,
  kol2Data, kol2Meta,
  realKreditData, realKreditMeta,
  posisiData, posisiMeta,
  realHarianData, realHarianMeta,
  rkapKurData, rkapKumkData, rkapPosisiData,
  productivityData, productivityMeta,
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  function cardStyle(i) {
    return {
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 0.4s ease ${i * 70}ms, transform 0.4s ease ${i * 70}ms`,
    }
  }

  // Section 1 data
  const realK = realKreditData?.totalNasional
  const realKChartData = realK ? [
    { name: 'KUMK', value: Number(realK.kumk_real_current) || 0 },
    { name: 'KUR',  value: Number(realK.kur_total_current)  || 0 },
    { name: 'UMKM', value: Number(realK.umkm_real_current)  || 0 },
  ] : []

  const npl = nplData?.totalNasional
  const kol2 = kol2Data?.totalNasional
  const posisi = posisiData?.totalNasional

  // Section 2 data
  const harianChartData = (realHarianData?.dailyData ?? []).map(d => ({
    date:     String(d.date),
    current:  Number(d.total) || 0,
    previous: Number(d.total_previous) || 0,
  }))
  let cumCurr = 0, cumPrev = 0
  const harianCumData = harianChartData.map(d => {
    cumCurr += d.current
    cumPrev += d.previous
    return { date: d.date, current: cumCurr, previous: cumPrev }
  })
  const mtdCurrent  = realHarianData?.monthlyTotals?.current
  const mtdPrevious = realHarianData?.monthlyTotals?.previous
  const mtdGrowthPct = mtdCurrent && mtdPrevious
    ? ((mtdCurrent - mtdPrevious) / mtdPrevious * 100).toFixed(2)
    : null

  // Productivity summary data
  const prodRows = Array.isArray(productivityData?.rows) ? productivityData.rows : []
  const prodTotal   = prodRows.length
  const prodSangat  = prodRows.filter(r => r.kategori === 'Sangat Produktif').length
  const prodKurang  = prodRows.filter(r => r.kategori === 'Kurang Produktif').length
  const prodTidak   = prodRows.filter(r => r.kategori === 'Tidak Produktif').length
  const achValues   = prodRows.map(r => r.pctAch).filter(v => v != null && !isNaN(v))
  const prodAvgAch  = achValues.length > 0
    ? (achValues.reduce((a, b) => a + b, 0) / achValues.length).toFixed(1)
    : null
  const prodPie = [
    { name: 'Sangat', value: prodSangat,  fill: '#16a34a' },
    { name: 'Kurang', value: prodKurang,  fill: '#d97706' },
    { name: 'Tidak',  value: prodTidak,   fill: '#dc2626' },
  ].filter(d => d.value > 0)

  const miniAxisProps = {
    tick: { fontSize: 8, fill: '#9CA3AF' },
    tickLine: false,
    axisLine: false,
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero banner */}
      <div style={{ backgroundColor: BTN_NAVY }}>
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-1">
            {user ? 'Selamat datang kembali' : 'Selamat datang'}
          </p>
          <h2 className="text-2xl font-bold text-white leading-none">
            {user?.name ?? 'SME Dashboard'}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {user?.accessScope === 'kanwil' && user?.kanwil
              ? user.kanwil
              : user?.accessScope === 'cabang' && user?.cabang
              ? user.cabang
              : 'Business Banking Division'}
          </p>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #E80025, transparent)' }} />
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-10">

        {/* ── Section 1: Kredit Monitoring ── */}
        <section>
          <SectionHeader title="Kredit Monitoring" href="/monitoring" />

          {/* Kanwil distribution — dual-view (NPL|KOL2 × Pie|Bar), above the 4 cards */}
          {((nplData?.kanwilData?.length ?? 0) > 0 || (kol2Data?.kanwilData?.length ?? 0) > 0) && (
            <KanwilDistribution nplData={nplData} kol2Data={kol2Data} />
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* NPL */}
            <StatCard label="NPL" uploadDate={nplMeta?.uploadDate} style={cardStyle(0)}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(npl?.total_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-1 space-y-0.5">
                <MetricRow label="KUMK" value={fmtPct(npl?.kumkPercent_current)} />
                <MetricRow label="KUR"  value={fmtPct(npl?.kurPercent_current)} />
                <MetricRow label="Total" value={fmtPct(npl?.totalPercent_current)} />
              </div>
              <TopKanwilMini kanwilData={nplData?.kanwilData} />
            </StatCard>

            {/* KOL 2 */}
            <StatCard label="KOL 2" uploadDate={kol2Meta?.uploadDate} style={cardStyle(1)}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(kol2?.total_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-1 space-y-0.5">
                <MetricRow label="KUMK" value={fmtPct(kol2?.kumkPercent_current)} />
                <MetricRow label="KUR"  value={fmtPct(kol2?.kurPercent_current)} />
                <MetricRow label="Total" value={fmtPct(kol2?.totalPercent_current)} />
              </div>
              <TopKanwilMini kanwilData={kol2Data?.kanwilData} />
            </StatCard>

            {/* Realisasi Kredit */}
            <StatCard label="Realisasi Kredit" uploadDate={realKreditMeta?.uploadDate} style={cardStyle(2)}>
              <div className="space-y-0.5">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">KUMK</p>
                  <p className="text-xl font-bold text-[#003d7a] leading-tight">
                    {fmt(realK?.kumk_real_current)}
                    <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
                  </p>
                </div>
                <MetricRow label="KUR"  value={`${fmt(realK?.kur_total_current)} Jt`} />
                <MetricRow label="UMKM" value={`${fmt(realK?.umkm_real_current)} Jt`} />
              </div>
              <div className="mt-2">
                {realKChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={realKChartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                      <XAxis dataKey="name" {...miniAxisProps} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v) => [`${fmt(v)} Jt`]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${BTN_NAVY}` }}
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
                        {realKChartData.map((_, i) => (
                          <Cell key={i} fill={[BTN_NAVY, BLUE_600, BLUE_300][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoChartData height={160} />
                )}
              </div>
            </StatCard>

            {/* Posisi Kredit */}
            <StatCard label="Posisi Kredit" uploadDate={posisiMeta?.uploadDate} style={cardStyle(3)}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(posisi?.posisi_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-3 space-y-2">
                <GapBadge label="Gap MTD" value={posisi?.gap_mtd} />
                <GapBadge label="Gap YoY" value={posisi?.gap_yoy} />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Posisi vs Target</p>
                {posisi?.posisi_current && posisi?.gap_mtd != null ? (() => {
                  const target = Number(posisi.posisi_current) - Number(posisi.gap_mtd)
                  const current = Number(posisi.posisi_current)
                  const pct = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0
                  return (
                    <div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 100 ? '#16a34a' : BTN_NAVY,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 text-right">{pct}% dari target</p>
                    </div>
                  )
                })() : <NoChartData height={32} />}
              </div>
            </StatCard>
          </div>
        </section>

        {/* ── Section 2: Realisasi Harian (Hero Chart) ── */}
        <RealisasiHarianSection
          realHarianData={realHarianData}
          realHarianMeta={realHarianMeta}
          harianChartData={harianChartData}
          harianCumData={harianCumData}
          mtdCurrent={mtdCurrent}
          mtdPrevious={mtdPrevious}
          mtdGrowthPct={mtdGrowthPct}
          mounted={mounted}
        />

        {/* ── RKAP Parameter Table ── */}
        <section
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease 350ms, transform 0.4s ease 350ms',
          }}
        >
          <SectionHeader title="Parameter RKAP" href="/monitoring" />
          <RKAPTable
            rkapKurData={rkapKurData}
            rkapKumkData={rkapKumkData}
            rkapPosisiData={rkapPosisiData}
            realKreditData={realKreditData}
            posisiData={posisiData}
            user={user}
          />
        </section>

        {/* ── Section 3: Productivity — national users only ── */}
        {(!user?.accessScope || user.accessScope === 'national') && <section>
          <SectionHeader title="Productivity" href="/monitoring/productivity" />
          {prodTotal > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Left: category metrics */}
              <StatCard label="Produktivitas RM" uploadDate={productivityMeta?.uploadedAt} style={cardStyle(5)}>
                <div className="flex flex-col gap-4">
                  <p className="text-3xl font-bold text-[#003d7a] leading-none">
                    {prodTotal.toLocaleString('id-ID')}
                    <span className="text-sm font-normal text-gray-500 ml-1.5">RM</span>
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: 'Sangat Produktif', count: prodSangat, color: '#16a34a', bg: 'bg-green-500' },
                      { label: 'Kurang Produktif', count: prodKurang, color: '#d97706', bg: 'bg-amber-500' },
                      { label: 'Tidak Produktif',  count: prodTidak,  color: '#dc2626', bg: 'bg-red-500'   },
                    ].map(({ label, count, color, bg }) => {
                      const pct = prodTotal > 0 ? (count / prodTotal) * 100 : 0
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold tabular-nums" style={{ color }}>
                              {count.toLocaleString('id-ID')}
                              <span className="text-gray-400 font-normal ml-1">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${bg} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {prodAvgAch != null && (
                    <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Avg Capaian</span>
                      <span className="font-bold text-[#003d7a]">{prodAvgAch}%</span>
                    </div>
                  )}
                </div>
              </StatCard>

              {/* Right: donut chart */}
              <StatCard label="Distribusi Kategori" uploadDate={productivityMeta?.uploadedAt} style={cardStyle(6)}>
                <div className="flex flex-col gap-3 h-full">
                  <div className="relative flex-1 min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prodPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {prodPie.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [v.toLocaleString('id-ID'), n]}
                          contentStyle={{ fontSize: 10, borderRadius: 6 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#003d7a]">
                          {prodTotal > 0 ? ((prodSangat / prodTotal) * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-[10px] text-gray-400">produktif</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {prodPie.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                          <span className="text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums text-gray-800">
                          {d.value.toLocaleString('id-ID')}
                          <span className="text-gray-400 font-normal ml-1">
                            ({prodTotal > 0 ? ((d.value / prodTotal) * 100).toFixed(0) : 0}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </StatCard>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-400" style={cardStyle(5)}>
              Belum ada data Productivity. Upload file PRD via{' '}
              <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.
            </div>
          )}
        </section>}

      </main>
    </div>
  )
}
