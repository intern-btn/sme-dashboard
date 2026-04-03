'use client'

import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell,
  Legend
} from 'recharts'

const BTN_BLUE = '#003d7a'
const BTN_ORANGE = '#e84e0f'

const formatRp = (n) => `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)}`

function toKOLBucket(kol) {
  const kolNum = parseInt(String(kol || '').replace(/[^\d]/g, ''), 10)
  if (!kolNum || Number.isNaN(kolNum)) return 'unknown'
  if (kolNum <= 1) return 'KOL 1'
  if (kolNum === 2) return 'KOL 2'
  return 'KOL 3+'
}

export default function SPBUDashboard({ idas, trend, mergedRows }) {
  const rows = Array.isArray(mergedRows) ? mergedRows : []
  const summary = idas?.summary || {}

  const delayedCount = rows.filter(r => r?.idasDelayed).length
  const nplCount = rows.filter(r => String(r?.plNpl || '').toUpperCase().includes('NPL')).length
  const kol2PlusCount = rows.reduce((sum, r) => {
    const kolNum = parseInt(String(r?.kol || '').replace(/[^\d]/g, ''), 10)
    return sum + (!Number.isNaN(kolNum) && kolNum >= 2 ? 1 : 0)
  }, 0)

  const cabangBars = (Array.isArray(idas?.cabangBreakdown) ? idas.cabangBreakdown : [])
    .slice(0, 12)
    .map((c) => ({ name: c.cabang, bakiDebet: c.totalBakiDebet || 0 }))

  const kolDist = rows.reduce((acc, r) => {
    const b = toKOLBucket(r?.kol)
    if (b === 'unknown') return acc
    acc[b] = (acc[b] || 0) + 1
    return acc
  }, {})
  const kolPie = Object.entries(kolDist).map(([name, value]) => ({ name, value }))

  const points = Array.isArray(trend?.points) ? trend.points : []

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Total Debitur" value={summary.totalDebitur || rows.length} />
        <Card title="Total Baki Debet" value={formatRp(summary.totalBakiDebet)} accent />
        <Card title="Total Plafond" value={formatRp(summary.totalPlafond)} />
        <Card title="NPL / KOL 2+" value={`${nplCount} / ${kol2PlusCount}`} />
        <Card title="IDAS Delayed" value={delayedCount} warn />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:col-span-2">
          <div className="font-semibold text-gray-900 mb-3">Trend Baki Debet</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Math.round((v || 0) / 1_000_000)}M`} />
                <Tooltip formatter={(v) => formatRp(v)} />
                <Legend />
                <Line type="monotone" dataKey="totalBakiDebet" name="Baki Debet" stroke={BTN_BLUE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {points.length < 2 && (
            <div className="text-xs text-gray-500 mt-2">Trend muncul setelah minimal 2 kali upload (2 data point).</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-gray-900 mb-3">Distribusi KOL</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kolPie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {kolPie.map((_, idx) => (
                    <Cell key={idx} fill={[BTN_BLUE, BTN_ORANGE, '#9CA3AF'][idx % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="font-semibold text-gray-900 mb-3">Top Cabang — Total Baki Debet</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cabangBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tickFormatter={(v) => `${Math.round((v || 0) / 1_000_000)}M`} />
              <Tooltip formatter={(v) => formatRp(v)} />
              <Bar dataKey="bakiDebet" name="Baki Debet" fill={BTN_BLUE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, accent = false, warn = false }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${warn ? 'border-orange-200' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${accent ? 'text-[#003d7a]' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  )
}

