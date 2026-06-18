'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getMonthInfo } from '../lib/dateUtils'
import ExportButton from './ExportButton'
import { exportTableToPDF, formatRealisasiDailyData } from '../lib/pdfExport'

export default function Realisasi({ data }) {
  const [activeView, setActiveView] = useState('total')
  const [chartMode, setChartMode] = useState('harian')

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
    currentSmeSwadana: day.smeSwadana || 0,
    currentKumkLainnya: day.kumkLainnya || 0,
    currentKppSupply: day.kppSupply || 0,
    currentKppDemand: day.kppDemand || 0,
    previousTotal: day.total_previous || 0,
    previousKur: day.kur_previous || 0,
    previousKumk: day.kumk_previous || 0,
    previousKppSupply: day.kppSupply_previous || 0,
    previousKppDemand: day.kppDemand_previous || 0
  }))

  // Cumulative (running sum) version
  let cumCurrTotal = 0, cumCurrKur = 0, cumCurrKumk = 0, cumCurrSme = 0, cumCurrLainnya = 0, cumCurrKppS = 0, cumCurrKppD = 0
  let cumPrevTotal = 0, cumPrevKur = 0, cumPrevKumk = 0, cumPrevKppS = 0, cumPrevKppD = 0
  const cumulativeData = comparisonData.map(d => {
    cumCurrTotal += d.currentTotal; cumCurrKur += d.currentKur; cumCurrKumk += d.currentKumk
    cumCurrSme += d.currentSmeSwadana; cumCurrLainnya += d.currentKumkLainnya
    cumCurrKppS += d.currentKppSupply; cumCurrKppD += d.currentKppDemand
    cumPrevTotal += d.previousTotal; cumPrevKur += d.previousKur; cumPrevKumk += d.previousKumk
    cumPrevKppS += d.previousKppSupply; cumPrevKppD += d.previousKppDemand
    return {
      date: d.date,
      currentTotal: cumCurrTotal, currentKur: cumCurrKur, currentKumk: cumCurrKumk,
      currentSmeSwadana: cumCurrSme, currentKumkLainnya: cumCurrLainnya,
      currentKppSupply: cumCurrKppS, currentKppDemand: cumCurrKppD,
      previousTotal: cumPrevTotal, previousKur: cumPrevKur, previousKumk: cumPrevKumk,
      previousKppSupply: cumPrevKppS, previousKppDemand: cumPrevKppD,
    }
  })

  const chartData = chartMode === 'harian' ? comparisonData : cumulativeData

  // Last index in dailyData that has real data — trims trailing zero rows from the table
  const lastDataIdx = dailyData.reduce((last, day, i) => (day.total || 0) > 0 ? i : last, -1)
  const tableData = lastDataIdx >= 0 ? chartData.slice(0, lastDataIdx + 1) : chartData

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

  const fmtJtShort = v => Math.abs(v) >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(Math.round(v || 0))
  const activeConfig = lineConfigs.find(c => c.key === activeView)

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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold uppercase" style={{ color: '#003d7a' }}>
            {chartMode === 'kumulatif' ? 'Kumulatif' : 'Perbandingan'} {previousMonth?.name || 'Bulan Lalu'} vs {currentMonth?.name || 'Bulan Ini'}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Harian / Kumulatif toggle */}
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
              {[{ value: 'harian', label: 'Harian' }, { value: 'kumulatif', label: 'Kumulatif' }].map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setChartMode(o.value)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    chartMode === o.value ? 'bg-white text-[#003d7a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Metric dropdown */}
            <select
              value={activeView}
              onChange={e => setActiveView(e.target.value)}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 bg-white text-[#003d7a] shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003d7a]/30"
            >
              <option value="total">Total Realisasi</option>
              <option value="kur">KUR</option>
              <option value="kumk">KUMK</option>
              <option value="kppSupply">KPP Supply</option>
              <option value="kppDemand">KPP Demand</option>
            </select>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRealisasiCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#003d7a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#003d7a" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtJtShort} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              formatter={(v, name) => [`${formatJt(v)} Jt`, name]}
              labelFormatter={(l) => `Tgl ${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #003d7a' }}
            />
            <Area
              type="monotone"
              dataKey={activeConfig?.currentKey}
              name={activeConfig?.currentName}
              stroke="#003d7a"
              strokeWidth={2.5}
              fill="url(#gradRealisasiCurrent)"
              dot={false}
              activeDot={{ r: 4, fill: '#003d7a' }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey={activeConfig?.previousKey}
              name={activeConfig?.previousName}
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              activeDot={{ r: 3, fill: '#94A3B8' }}
              isAnimationActive={false}
            />
            <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {chartMode === 'kumulatif' ? 'Realisasi Kumulatif' : 'Realisasi Per Hari'} — {currentMonth?.fullLabel || 'Bulan Ini'}
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
                {chartMode === 'harian' && <th className="py-3 px-4 text-center font-semibold">Trend</th>}
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {tableData.map((row, idx) => {
                const prevRow = idx > 0 ? tableData[idx - 1] : null
                const diff = prevRow ? row.currentTotal - prevRow.currentTotal : 0
                const isUp = diff > 0

                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold" style={{ color: '#003d7a' }}>
                      {row.date} {currentMonth?.shortName || ''}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(row.currentKur)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(row.currentKumk)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(row.currentSmeSwadana)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatJt(row.currentKumkLainnya)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {formatJt(row.currentKppSupply)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600">
                      {formatJt(row.currentKppDemand)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-bold">
                      {formatJt(row.currentTotal)}
                    </td>
                    {chartMode === 'harian' && (
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
                    )}
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
