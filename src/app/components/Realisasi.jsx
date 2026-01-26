'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getMonthInfo } from '../lib/dateUtils'

export default function Realisasi({ data }) {
  const [activeView, setActiveView] = useState('total')

  if (!data || !data.dailyData) {
    return <div className="min-h-screen flex items-center justify-center text-gray-700 bg-white">Loading...</div>
  }

  const { dailyData, monthlyTotals, monthInfo: dataMonthInfo } = data

  // Get month info from data or fallback
  const monthInfo = dataMonthInfo || getMonthInfo()
  const currentMonth = monthInfo.current
  const previousMonth = monthInfo.previous

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num)
  }

  // Prepare comparison data with actual previous month data
  const maxDay = dailyData.length
  const comparisonData = dailyData.map(day => ({
    date: day.date,
    currentTotal: day.total || 0,
    currentKur: day.kur || 0,
    currentKumk: day.kumk || 0,
    previousTotal: day.total_previous || 0,
    previousKur: day.kur_previous || 0,
    previousKumk: day.kumk_previous || 0
  }))

  // Calculate totals
  const currentTotal = monthlyTotals?.current || dailyData.reduce((sum, day) => sum + (day.total || 0), 0)
  const previousTotal = monthlyTotals?.previous || dailyData.reduce((sum, day) => sum + (day.total_previous || 0), 0)

  // Calculate growth
  const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0

  return (
    <div className="min-h-screen p-8 fade-in bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          REALISASI KREDIT SME HARIAN
        </h1>
        <p className="text-gray-600 text-lg">
          Perbandingan s.d. tanggal {maxDay} {previousMonth?.name || 'Bulan Lalu'} vs {currentMonth?.name || 'Bulan Ini'}
        </p>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-5">
          <div className="text-purple-700 text-sm mb-1 font-medium">{previousMonth?.fullLabel || 'Bulan Lalu'}</div>
          <div className="text-3xl font-bold text-purple-900">
            Rp {formatCurrency(previousTotal)} Jt
          </div>
          <div className="text-xs text-purple-600 mt-1">s.d. tanggal {maxDay}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-primary rounded-xl p-5">
          <div className="text-primary text-sm mb-1 font-medium">{currentMonth?.fullLabel || 'Bulan Ini'}</div>
          <div className="text-3xl font-bold text-blue-900">
            Rp {formatCurrency(currentTotal)} Jt
          </div>
          <div className="text-xs text-blue-600 mt-1">s.d. tanggal {maxDay}</div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-5 border-2 ${
          growth >= 0
            ? 'from-green-50 to-green-100 border-green-300'
            : 'from-red-50 to-red-100 border-red-300'
        }`}>
          <div className={`text-sm mb-1 font-medium ${growth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Pertumbuhan
          </div>
          <div className={`text-3xl font-bold ${growth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">vs {previousMonth?.name || 'Bulan Lalu'} MTD</div>
        </div>
      </div>

      {/* Tabbed Comparison Chart */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Perbandingan {previousMonth?.name || 'Bulan Lalu'} vs {currentMonth?.name || 'Bulan Ini'}
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('total')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'total'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Total Realisasi
            </button>
            <button
              onClick={() => setActiveView('kur')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'kur'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              KUR
            </button>
            <button
              onClick={() => setActiveView('kumk')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'kumk'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              KUMK
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={comparisonData}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              label={{ value: 'Tanggal', position: 'insideBottom', offset: -5, fill: '#6B7280' }}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
              tickFormatter={(value) => formatCurrency(value)}
              label={{ value: 'Realisasi (Jt)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #1976D2',
                borderRadius: '8px',
                color: '#1F2937',
                padding: '12px'
              }}
              formatter={(value) => `Rp ${formatCurrency(value)} Jt`}
              labelFormatter={(label) => `Tanggal ${label}`}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            {activeView === 'total' && (
              <>
                <Line
                  type="monotone"
                  dataKey="currentTotal"
                  stroke="#1976D2"
                  strokeWidth={3}
                  name={currentMonth?.fullLabel || 'Bulan Ini'}
                  dot={{ fill: '#1976D2', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="previousTotal"
                  stroke="#9333EA"
                  strokeWidth={3}
                  name={previousMonth?.fullLabel || 'Bulan Lalu'}
                  dot={{ fill: '#9333EA', r: 4 }}
                  strokeDasharray="5 5"
                />
              </>
            )}

            {activeView === 'kur' && (
              <>
                <Line
                  type="monotone"
                  dataKey="currentKur"
                  stroke="#1976D2"
                  strokeWidth={3}
                  name={`KUR ${currentMonth?.name || 'Bulan Ini'}`}
                  dot={{ fill: '#1976D2', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="previousKur"
                  stroke="#9333EA"
                  strokeWidth={3}
                  name={`KUR ${previousMonth?.name || 'Bulan Lalu'}`}
                  dot={{ fill: '#9333EA', r: 4 }}
                  strokeDasharray="5 5"
                />
              </>
            )}

            {activeView === 'kumk' && (
              <>
                <Line
                  type="monotone"
                  dataKey="currentKumk"
                  stroke="#1976D2"
                  strokeWidth={3}
                  name={`KUMK ${currentMonth?.name || 'Bulan Ini'}`}
                  dot={{ fill: '#1976D2', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="previousKumk"
                  stroke="#9333EA"
                  strokeWidth={3}
                  name={`KUMK ${previousMonth?.name || 'Bulan Lalu'}`}
                  dot={{ fill: '#9333EA', r: 4 }}
                  strokeDasharray="5 5"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Table */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b-2 border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Realisasi Per Hari - {currentMonth?.fullLabel || 'Bulan Ini'}
          </h2>
        </div>

        <div className="overflow-auto max-h-[400px] custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-primary text-white">
              <tr className="text-left text-sm">
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 text-right font-semibold">KUR</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK</th>
                <th className="py-3 px-4 text-right font-semibold">SME Swadana</th>
                <th className="py-3 px-4 text-right font-semibold">Total</th>
                <th className="py-3 px-4 text-center font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {dailyData.map((day, idx) => {
                const prevDay = idx > 0 ? dailyData[idx - 1] : null
                const diff = prevDay ? day.total - prevDay.total : 0
                const isUp = diff > 0

                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-primary font-semibold">
                      {day.date} {currentMonth?.shortName || ''}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(day.kur)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(day.kumk)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(day.smeSwadana)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-bold">
                      {formatCurrency(day.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {idx === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : isUp ? (
                        <span className="text-green-600 font-bold">↑ {formatCurrency(Math.abs(diff))}</span>
                      ) : diff < 0 ? (
                        <span className="text-red-600 font-bold">↓ {formatCurrency(Math.abs(diff))}</span>
                      ) : (
                        <span className="text-gray-500">→</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Klik navigasi di bawah atau tekan → untuk kembali ke Dashboard</p>
      </div>
    </div>
  )
}
