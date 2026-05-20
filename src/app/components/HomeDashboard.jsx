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
  Legend,
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
  return Number(val).toLocaleString('id-ID')
}

function fmtJt(val) {
  if (val == null || isNaN(val)) return '–'
  return (val / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function fmtPct(val) {
  if (val == null || isNaN(val)) return '–'
  return `${Number(val).toFixed(2)}%`
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

export default function HomeDashboard({
  user,
  nplData, nplMeta,
  kol2Data, kol2Meta,
  realKreditData, realKreditMeta,
  posisiData, posisiMeta,
  realHarianData, realHarianMeta,
  spbuStats, spbuMeta, spbuTrend,
  bpjsStats, bpjsMeta, bpjsTrend,
  indomaretStats, indomaretMeta, indomaretTrend,
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
  const nplKanwilPieData = (nplData?.kanwilData ?? []).map(k => ({
    name: k.name.replace('Kanwil ', ''),
    value: Number(k.total_current) || 0,
  }))

  const kol2KanwilPieData = (kol2Data?.kanwilData ?? []).map(k => ({
    name: k.name.replace('Kanwil ', ''),
    value: Number(k.total_current) || 0,
  }))

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
  const mtdCurrent  = realHarianData?.monthlyTotals?.current
  const mtdPrevious = realHarianData?.monthlyTotals?.previous
  const mtdGrowthPct = mtdCurrent && mtdPrevious
    ? ((mtdCurrent - mtdPrevious) / mtdPrevious * 100).toFixed(2)
    : null

  // Section 3 data
  function buildDonut(stats) {
    if (!stats || !stats.masterTotal) return { pct: 0, data: [] }
    const pct = Math.round(stats.idasFound / stats.masterTotal * 100)
    return {
      pct,
      data: [
        { value: stats.idasFound },
        { value: stats.masterTotal - stats.idasFound },
      ],
    }
  }

  function buildTrend(trend) {
    return (trend?.points ?? []).map(p => ({
      date:  String(p.date).slice(5),
      value: p.totalBakiDebet,
    }))
  }

  const spbuDonut     = buildDonut(spbuStats)
  const bpjsDonut     = buildDonut(bpjsStats)
  const indomaretDonut = buildDonut(indomaretStats)
  const spbuTrendPts  = buildTrend(spbuTrend)
  const bpjsTrendPts  = buildTrend(bpjsTrend)
  const indomaretTrendPts = buildTrend(indomaretTrend)

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
          <p className="text-sm text-white/50 mt-1">Business Banking Division</p>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #E80025, transparent)' }} />
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-10">

        {/* ── Section 1: Kredit Monitoring ── */}
        <section>
          <SectionHeader title="Kredit Monitoring" href="/monitoring" />

          {/* Kanwil distribution — above the 4 cards */}
          {(nplKanwilPieData.length > 0 || kol2KanwilPieData.length > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Distribusi per Kanwil
              </p>
              <div className="grid grid-cols-2 gap-6">

                <div>
                  <p className="text-xs text-center text-gray-400 mb-1">NPL</p>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={nplKanwilPieData}
                        cx="50%"
                        cy="42%"
                        innerRadius={80}
                        outerRadius={130}
                        dataKey="value"
                        strokeWidth={1}
                        stroke="#fff"
                      >
                        {nplKanwilPieData.map((_, i) => (
                          <Cell key={i} fill={KANWIL_COLORS[i % KANWIL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, name) => [`${fmt(v)} Jt`, name]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${BTN_RED}` }}
                      />
                      <Legend iconSize={12} iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-xs text-center text-gray-400 mb-1">KOL 2</p>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={kol2KanwilPieData}
                        cx="50%"
                        cy="42%"
                        innerRadius={80}
                        outerRadius={130}
                        dataKey="value"
                        strokeWidth={1}
                        stroke="#fff"
                      >
                        {kol2KanwilPieData.map((_, i) => (
                          <Cell key={i} fill={KANWIL_COLORS[i % KANWIL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, name) => [`${fmt(v)} Jt`, name]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${BTN_AMBER}` }}
                      />
                      <Legend iconSize={12} iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
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
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {realHarianData?.monthInfo?.current?.fullLabel ?? 'Bulan berjalan'}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-500 leading-none">
                    {fmt(mtdPrevious)}
                    <span className="text-xs font-normal text-gray-400 ml-1">Jt</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {realHarianData?.monthInfo?.previous?.fullLabel ?? 'Bulan lalu'}
                  </p>
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
              {realHarianMeta?.uploadDate && (
                <p className="text-[10px] text-gray-400 shrink-0">{formatDateTime(realHarianMeta.uploadDate)}</p>
              )}
            </div>

            {/* Area chart */}
            {harianChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={harianChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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
                    name={realHarianData?.monthInfo?.current?.fullLabel ?? 'Bulan Ini'}
                    stroke={BTN_NAVY}
                    strokeWidth={2.5}
                    fill="url(#gradCurrent)"
                    dot={false}
                    activeDot={{ r: 4, fill: BTN_NAVY }}
                  />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    name={realHarianData?.monthInfo?.previous?.fullLabel ?? 'Bulan Lalu'}
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

        {/* ── Section 3: Business Monitoring ── */}
        <section>
          <SectionHeader title="Business Monitoring" href="/monitoring/business" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'PRK SPBU',  meta: spbuMeta,      stats: spbuStats,      donut: spbuDonut,      trendPts: spbuTrendPts,      i: 5 },
              { label: 'BPJS',      meta: bpjsMeta,      stats: bpjsStats,      donut: bpjsDonut,      trendPts: bpjsTrendPts,      i: 6 },
              { label: 'Indomaret', meta: indomaretMeta, stats: indomaretStats, donut: indomaretDonut, trendPts: indomaretTrendPts, i: 7 },
            ].map(({ label, meta, stats, donut, trendPts, i }) => (
              <StatCard key={label} label={label} uploadDate={meta?.uploadDate} style={cardStyle(i)}>
                {stats ? (
                  <>
                    {/* Two-chart row: donut + trend */}
                    <div className="grid grid-cols-2 gap-1">
                      {/* Donut */}
                      <div className="relative">
                        <ResponsiveContainer width="100%" height={110}>
                          <PieChart>
                            <Pie
                              data={donut.data}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={46}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              <Cell fill={BTN_NAVY} />
                              <Cell fill={GRAY_200} />
                            </Pie>
                            <Tooltip
                              formatter={(v) => [v.toLocaleString('id-ID'), 'Debitur']}
                              contentStyle={{ fontSize: 10, borderRadius: 6 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-sm font-bold text-[#003d7a]">{donut.pct}%</span>
                        </div>
                      </div>

                      {/* Trend line */}
                      {trendPts.length >= 2 ? (
                        <ResponsiveContainer width="100%" height={110}>
                          <LineChart data={trendPts} margin={{ top: 6, right: 4, left: -32, bottom: 0 }}>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 8, fill: '#9CA3AF' }}
                              tickLine={false}
                              axisLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis hide />
                            <Tooltip
                              formatter={(v) => [`${fmtJt(v)} Jt`, 'Baki Debet']}
                              contentStyle={{ fontSize: 10, borderRadius: 4, border: `1px solid ${BTN_NAVY}` }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={BTN_NAVY}
                              strokeWidth={1.5}
                              dot={{ r: 2, fill: BTN_NAVY }}
                              activeDot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[110px] flex items-center justify-center text-[9px] text-gray-400 text-center px-1 leading-relaxed">
                          Trend muncul setelah 2+ upload
                        </div>
                      )}
                    </div>

                    {/* Stat rows */}
                    <div className="mt-1 pt-2 border-t border-gray-100 space-y-1">
                      <p className="text-2xl font-bold text-[#003d7a] leading-none">
                        {stats.masterTotal.toLocaleString('id-ID')}
                        <span className="text-xs font-normal text-gray-500 ml-1">debitur</span>
                      </p>
                      <MetricRow
                        label="Ditemukan di IDAS"
                        value={`${fmt(stats.idasFound)} / ${fmt(stats.masterTotal)}`}
                      />
                      <MetricRow label="Baki Debet" value={`${fmtJt(stats.totalBakiDebet)} Jt`} />
                    </div>
                  </>
                ) : (
                  <div className="h-[140px] flex items-center justify-center text-sm text-gray-400">
                    Belum ada data
                  </div>
                )}
              </StatCard>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
