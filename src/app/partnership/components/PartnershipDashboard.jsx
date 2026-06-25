'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { weeksLeft, statusDistribution, priorityDistribution } from '../../../lib/partnership.js'

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 }
const PRIORITY_COLORS = {
  High: '#dc2626',
  Medium: '#ca8a04',
  Low: '#16a34a',
}
const PRIORITY_BG = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
}

// Blue/gray palette for status pie — no orange
const STATUS_COLORS = [
  '#003d7a',
  '#1e5fa8',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#bfdbfe',
  '#6b7280',
  '#9ca3af',
]

function MetricCard({ title, value, colorClass = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${colorClass}`}>{value}</div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function PartnershipDashboard({ partners, onEdit, onDelete, isNational }) {
  const list = Array.isArray(partners) ? partners : []
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // KPI counts
  const totalCount = list.length
  const highCount = list.filter(p => p.priority === 'High').length
  const completedStatuses = ['Sosialisasi Eksternal']
  const completedCount = list.filter(p => p.lastUpdateStatus === 'Sosialisasi Eksternal').length
  const inProgressCount = list.filter(p =>
    p.lastUpdateStatus &&
    p.lastUpdateStatus !== '' &&
    !completedStatuses.includes(p.lastUpdateStatus)
  ).length

  // Sort: priority rank then endDate
  const sorted = [...list].sort((a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 99
    const rb = PRIORITY_RANK[b.priority] ?? 99
    if (ra !== rb) return ra - rb
    const da = a.endDate ? new Date(a.endDate).getTime() : 0
    const db = b.endDate ? new Date(b.endDate).getTime() : 0
    return da - db
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  // Charts data
  const statusDist = statusDistribution(list)
  const statusPieData = Object.entries(statusDist.counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const priDist = priorityDistribution(list)
  const priorityPieData = [
    { name: 'High', value: priDist.counts.High },
    { name: 'Medium', value: priDist.counts.Medium },
    { name: 'Low', value: priDist.counts.Low },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard title="Total Partners" value={totalCount} />
        <MetricCard title="High Priority" value={highCount} colorClass="text-red-600" />
        <MetricCard title="In Progress" value={inProgressCount} colorClass="text-[#003d7a]" />
        <MetricCard title="Completed" value={completedCount} colorClass="text-green-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-gray-900 mb-3">Status Distribution</div>
          {statusPieData.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">Belum ada data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ name, value }) => `${value}`}
                  >
                    {statusPieData.map((_, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-gray-900 mb-3">Priority Distribution</div>
          {priorityPieData.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">Belum ada data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    label={({ name, value }) => `${value}`}
                  >
                    {priorityPieData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Partnership table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="font-semibold text-gray-900">Daftar Partnership</div>
        </div>
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            Belum ada data partner.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partnership</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Update Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weeks Left</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  {isNational && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((p) => {
                  const wl = p.endDate ? weeksLeft(p.endDate) : null
                  const wlText = wl !== null ? `${wl.toFixed(1)} wks` : '—'
                  const wlRed = wl !== null && wl < 0
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.lastUpdateStatus || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.startDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.endDate)}</td>
                      <td className={`px-4 py-3 font-medium ${wlRed ? 'text-red-600' : 'text-gray-700'}`}>
                        {wlText}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BG[p.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {p.priority || '—'}
                        </span>
                      </td>
                      {isNational && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(p)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(p.id)}
                              className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-white">
              <div className="text-xs text-gray-500">
                Menampilkan {pageStart + 1}-{Math.min(pageStart + paginated.length, sorted.length)} dari {sorted.length} partnership
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${
                        page === safePage
                          ? 'border-[#003d7a] bg-[#003d7a] text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
