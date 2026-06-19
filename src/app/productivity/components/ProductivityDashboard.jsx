'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Label,
} from 'recharts'

const CAT_COLORS = {
  'Sangat Produktif':  '#16a34a',
  'Kurang Produktif':  '#d97706',
  'Tidak Produktif':   '#dc2626',
}
const CAT_KEYS = ['Sangat Produktif', 'Kurang Produktif', 'Tidak Produktif']


function MetricCard({ title, value, sub, color = 'default' }) {
  const borderClass = {
    green:   'border-green-200',
    amber:   'border-amber-200',
    red:     'border-red-200',
    default: 'border-gray-200',
  }[color]

  const valColor = {
    green:   CAT_COLORS['Sangat Produktif'],
    amber:   CAT_COLORS['Kurang Produktif'],
    red:     CAT_COLORS['Tidak Produktif'],
    default: '#111827',
  }[color]

  return (
    <div className={`bg-white border rounded-xl p-4 ${borderClass}`}>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</div>
      <div className="mt-2 text-2xl font-bold" style={{ color: valColor }}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <div className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
            <span className="text-gray-600">{p.dataKey}</span>
          </div>
          <span className="font-medium tabular-nums">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1 pt-1 flex justify-between">
        <span className="text-gray-500">Total</span>
        <span className="font-semibold tabular-nums">{total}</span>
      </div>
    </div>
  )
}

export default function ProductivityDashboard({ rows = [] }) {
  const total   = rows.length
  const sangat  = rows.filter(r => r.kategori === 'Sangat Produktif').length
  const kurang  = rows.filter(r => r.kategori === 'Kurang Produktif').length
  const tidak   = rows.filter(r => r.kategori === 'Tidak Produktif').length

  const pctSangat = total > 0 ? ((sangat / total) * 100).toFixed(1) : '0.0'
  const pctKurang = total > 0 ? ((kurang / total) * 100).toFixed(1) : '0.0'
  const pctTidak  = total > 0 ? ((tidak  / total) * 100).toFixed(1) : '0.0'

  const achValues = rows.map(r => r.pctAch).filter(v => v != null && !isNaN(v))
  const avgAch = achValues.length > 0
    ? (achValues.reduce((a, b) => a + b, 0) / achValues.length).toFixed(1)
    : null

  const kanwilMap = {}
  for (const r of rows) {
    const kw = r.kantorWilayah || 'Unknown'
    if (!kanwilMap[kw]) {
      kanwilMap[kw] = { name: kw, 'Sangat Produktif': 0, 'Kurang Produktif': 0, 'Tidak Produktif': 0 }
    }
    if (CAT_KEYS.includes(r.kategori)) kanwilMap[kw][r.kategori]++
  }
  const barData = Object.values(kanwilMap).sort((a, b) => a.name.localeCompare(b.name))

  const pieData = [
    { name: 'Sangat Produktif', value: sangat },
    { name: 'Kurang Produktif', value: kurang },
    { name: 'Tidak Produktif',  value: tidak  },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard title="Total RM" value={total.toLocaleString('id-ID')} />
        <MetricCard title="Sangat Produktif" value={sangat.toLocaleString('id-ID')} sub={`${pctSangat}%`} color="green" />
        <MetricCard title="Kurang Produktif" value={kurang.toLocaleString('id-ID')} sub={`${pctKurang}%`} color="amber" />
        <MetricCard title="Tidak Produktif"  value={tidak.toLocaleString('id-ID')}  sub={`${pctTidak}%`}  color="red"   />
        <MetricCard title="Avg Achievement"  value={avgAch != null ? `${avgAch}%` : '–'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stacked Bar by Kantor Wilayah */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:col-span-2">
          <div className="font-semibold text-gray-900 mb-3">Distribusi per Kantor Wilayah</div>
          {barData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -8, bottom: 44 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    {CAT_KEYS.map(k => (
                      <Bar key={k} dataKey={k} stackId="a" fill={CAT_COLORS[k]} radius={k === 'Tidak Produktif' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
                {CAT_KEYS.map(k => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[k] }} />
                    <span>{k}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Belum ada data</div>
          )}
        </div>

        {/* Donut */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-gray-900 mb-3">Distribusi Kategori</div>
          {pieData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CAT_COLORS[entry.name] || '#6b7280'} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox
                          return (
                            <text x={cx} y={cy} textAnchor="middle">
                              <tspan x={cx} y={cy - 5} fontSize={22} fontWeight={700} fill="#111827">
                                {total.toLocaleString('id-ID')}
                              </tspan>
                              <tspan x={cx} y={cy + 14} fontSize={10} fill="#9ca3af">
                                Total RM
                              </tspan>
                            </text>
                          )
                        }}
                      />
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v.toLocaleString('id-ID')} RM`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom legend */}
              <div className="mt-3 space-y-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[d.name] }} />
                      <span className="text-gray-700 truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-gray-900 tabular-nums">{d.value.toLocaleString('id-ID')}</span>
                      <span className="text-gray-400 text-xs tabular-nums w-10 text-right">
                        {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Belum ada data</div>
          )}
        </div>
      </div>
    </div>
  )
}
