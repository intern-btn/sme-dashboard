'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getMonthInfo } from '../lib/dateUtils'
import ExportButton from './ExportButton'
import { exportTableToPDF, formatRealisasiDailyData } from '../lib/pdfExport'

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

  const formatJt = (num) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(num || 0)
  }

  // Prepare comparison data with actual previous month data
  const maxDay = dailyData.length
  const comparisonData = dailyData.map(day => ({
    date: day.date,
    currentTotal: day.total || 0,
    currentKur: day.kur || 0,
    currentKumk: day.kumk || 0,
    currentKppSupply: day.kppSupply || 0,
    currentKppDemand: day.kppDemand || 0,
    previousTotal: day.total_previous || 0,
    previousKur: day.kur_previous || 0,
    previousKumk: day.kumk_previous || 0,
    previousKppSupply: day.kppSupply_previous || 0,
    previousKppDemand: day.kppDemand_previous || 0
  }))

  // Calculate totals
  const currentTotal = monthlyTotals?.current || dailyData.reduce((sum, day) => sum + (day.total || 0), 0)
  const previousTotal = monthlyTotals?.previous || dailyData.reduce((sum, day) => sum + (day.total_previous || 0), 0)

  // Calculate growth
  const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0

  const handleExportRealisasiHarian = () => {
    if (!dailyData || dailyData.length === 0) {
      throw new Error('Tidak ada data untuk diekspor')
    }
    const pdfData = formatRealisasiDailyData(dailyData, monthInfo)
    exportTableToPDF(pdfData)
  }

  const lineConfigs = [
    {
      key: 'total',
      currentKey: 'currentTotal',
      previousKey: 'previousTotal',
      currentName: currentMonth?.fullLabel || 'Bulan Ini',
      previousName: previousMonth?.fullLabel || 'Bulan Lalu',
    },
    {
      key: 'kur',
      currentKey: 'currentKur',
      previousKey: 'previousKur',
      currentName: `KUR ${currentMonth?.name || 'Bulan Ini'}`,
      previousName: `KUR ${previousMonth?.name || 'Bulan Lalu'}`,
    },
    {
      key: 'kumk',
      currentKey: 'currentKumk',
      previousKey: 'previousKumk',
      currentName: `KUMK ${currentMonth?.name || 'Bulan Ini'}`,
      previousName: `KUMK ${previousMonth?.name || 'Bulan Lalu'}`,
    },
    {
      key: 'kppSupply',
      currentKey: 'currentKppSupply',
      previousKey: 'previousKppSupply',
      currentName: `KPP Supply ${currentMonth?.name || 'Bulan Ini'}`,
      previousName: `KPP Supply ${previousMonth?.name || 'Bulan Lalu'}`,
    },
    {
      key: 'kppDemand',
      currentKey: 'currentKppDemand',
      previousKey: 'previousKppDemand',
      currentName: `KPP Demand ${currentMonth?.name || 'Bulan Ini'}`,
      previousName: `KPP Demand ${previousMonth?.name || 'Bulan Lalu'}`,
    },
  ]

  return (
    <div className="p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Perbandingan s.d. tanggal {maxDay} — {previousMonth?.name || 'Bulan Lalu'} vs {currentMonth?.name || 'Bulan Ini'}
      </p>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 border-l-4 border-purple-600 rounded-xl p-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">{previousMonth?.fullLabel || 'Bulan Lalu'}</div>
          <div className="text-2xl font-bold text-gray-900">Rp {formatJt(previousTotal)} Jt</div>
          <div className="text-xs text-gray-400 mt-1">s.d. tanggal {maxDay}</div>
        </div>

        <div className="bg-gray-50 border-l-4 rounded-xl p-4" style={{ borderLeftColor: '#003d7a' }}>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">{currentMonth?.fullLabel || 'Bulan Ini'}</div>
          <div className="text-2xl font-bold" style={{ color: '#003d7a' }}>Rp {formatJt(currentTotal)} Jt</div>
          <div className="text-xs text-gray-400 mt-1">s.d. tanggal {maxDay}</div>
        </div>

        <div className={`bg-gray-50 border-l-4 rounded-xl p-4 ${growth >= 0 ? 'border-green-600' : 'border-red-600'}`}>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Pertumbuhan MTD</div>
          <div className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">vs {previousMonth?.name || 'Bulan Lalu'}</div>
        </div>
      </div>

      {/* Tabbed Comparison Chart */}
      <div className="border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>
            Perbandingan {previousMonth?.name || 'Bulan Lalu'} vs {currentMonth?.name || 'Bulan Ini'}
          </h2>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveView('total')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'total'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeView === 'total' ? { backgroundColor: '#003d7a' } : {}}
            >
              Total Realisasi
            </button>
            <button
              onClick={() => setActiveView('kur')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'kur'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeView === 'kur' ? { backgroundColor: '#003d7a' } : {}}
            >
              KUR
            </button>
            <button
              onClick={() => setActiveView('kumk')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'kumk'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeView === 'kumk' ? { backgroundColor: '#003d7a' } : {}}
            >
              KUMK
            </button>
            <button
              onClick={() => setActiveView('kppSupply')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'kppSupply'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeView === 'kppSupply' ? { backgroundColor: '#003d7a' } : {}}
            >
              KPP Supply
            </button>
            <button
              onClick={() => setActiveView('kppDemand')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'kppDemand'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeView === 'kppDemand' ? { backgroundColor: '#003d7a' } : {}}
            >
              KPP Demand
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
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
                tickFormatter={(value) => formatJt(value)}
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
                formatter={(value) => `Rp ${formatJt(value)} Jt`}
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />

              {lineConfigs.map((config) => {
                const hidden = activeView !== config.key

                return (
                  [
                    <Line
                      key={`${config.key}-current`}
                      hide={hidden}
                      legendType={hidden ? 'none' : undefined}
                      type="monotone"
                      dataKey={config.currentKey}
                      stroke="#1976D2"
                      strokeWidth={3}
                      name={config.currentName}
                      dot={{ fill: '#1976D2', r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />,
                    <Line
                      key={`${config.key}-previous`}
                      hide={hidden}
                      legendType={hidden ? 'none' : undefined}
                      type="monotone"
                      dataKey={config.previousKey}
                      stroke="#9333EA"
                      strokeWidth={3}
                      name={config.previousName}
                      dot={{ fill: '#9333EA', r: 4 }}
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                    />
                  ]
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Realisasi Per Hari — {currentMonth?.fullLabel || 'Bulan Ini'}
          </h2>
          <ExportButton onClick={handleExportRealisasiHarian} label="Export PDF" />
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 text-white" style={{ backgroundColor: '#003d7a' }}>
              <tr className="text-left text-sm">
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 text-right font-semibold">KUR</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK PRK</th>
                <th className="py-3 px-4 text-right font-semibold">SME Swadana</th>
                <th className="py-3 px-4 text-right font-semibold">KUMK Lainnya</th>
                <th className="py-3 px-4 text-right font-semibold">KPP Supply</th>
                <th className="py-3 px-4 text-right font-semibold">KPP Demand</th>
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
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold" style={{ color: '#003d7a' }}>
                      {day.date} {currentMonth?.shortName || ''}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(day.kur)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(day.kumk)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(day.smeSwadana)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(day.kumkLainnya || 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {formatJt(day.kppSupply || 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600">
                      {formatJt(day.kppDemand || 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-bold">
                      {formatJt(day.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {idx === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : isUp ? (
                        <span className="text-green-600 font-bold">+ {formatJt(Math.abs(diff))}</span>
                      ) : diff < 0 ? (
                        <span className="text-red-600 font-bold">- {formatJt(Math.abs(diff))}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
