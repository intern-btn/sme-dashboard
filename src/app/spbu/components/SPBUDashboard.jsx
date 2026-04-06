'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const BTN_BLUE = '#003d7a'
const BTN_ORANGE = '#e84e0f'
const GRAY = '#9CA3AF'

const formatRp = (n) =>
  `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)}`

function toKolNum(kol) {
  const kolNum = parseInt(String(kol || '').replace(/[^\d]/g, ''), 10)
  return Number.isNaN(kolNum) ? null : kolNum
}

function toKOLBucket(kol) {
  const kolNum = toKolNum(kol)
  if (!kolNum) return null
  if (kolNum === 1) return 'KOL 1'
  if (kolNum >= 5) return 'KOL 5+'
  if (kolNum >= 2) return 'KOL 2-4'
  return null
}

export default function SPBUDashboard({ trend, mergedRows }) {
  const rows = Array.isArray(mergedRows) ? mergedRows : []
  const foundRows = rows.filter((r) => !!r?.idasFound)

  const totalDebitur = rows.length
  const foundCount = foundRows.length
  const delayedCount = Math.max(0, totalDebitur - foundCount)

  const kol2PlusCount = foundRows.reduce((sum, r) => {
    const kolNum = toKolNum(r?.kol)
    return sum + (kolNum && kolNum >= 2 ? 1 : 0)
  }, 0)

  const totalBakiDebetFound = foundRows.reduce((sum, r) => sum + (Number(r?.bakiDebet) || 0), 0)

  const kolDist = foundRows.reduce((acc, r) => {
    const bucket = toKOLBucket(r?.kol)
    if (!bucket) return acc
    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {})
  const kolPie = Object.entries(kolDist).map(([name, value]) => ({ name, value }))

  const points = Array.isArray(trend?.points) ? trend.points : []
  const coverageText = `${foundCount}/${totalDebitur} akun ditemukan di IDAS hari ini`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Total Debitur" value={totalDebitur} />
        <Card title="Ditemukan di IDAS" value={foundCount} />
        <Card title="Tidak di IDAS (Delayed)" value={delayedCount} warn />
        <Card title="KOL 2+" value={kol2PlusCount} />
        <Card title="Total Baki Debet (IDAS)" value={formatRp(totalBakiDebetFound)} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div className="font-semibold text-gray-900">Trend Baki Debet</div>
            <div className="text-xs text-gray-500">{coverageText}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Math.round((v || 0) / 1_000_000)}M`} />
                <Tooltip formatter={(v) => formatRp(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalBakiDebet"
                  name="Baki Debet"
                  stroke={BTN_BLUE}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {points.length < 2 && (
            <div className="text-xs text-gray-500 mt-2">
              Trend muncul setelah minimal 2 kali upload (2 data point).
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-gray-900 mb-3">Distribusi KOL (yang ditemukan di IDAS)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kolPie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {kolPie.map((_, idx) => (
                    <Cell key={idx} fill={[BTN_BLUE, BTN_ORANGE, GRAY][idx % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {kolPie.length === 0 && (
            <div className="text-xs text-gray-500 mt-2">Belum ada data KOL (IDAS belum diupload).</div>
          )}
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

