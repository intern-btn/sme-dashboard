'use client'

import { TASK_STAGES } from '../../../lib/partnership.js'

const BTN_BLUE = '#003d7a'

const PRIORITY_BADGE = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
}

// Round date down to previous Monday
function toMonday(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Collect all weekly Monday headers between minDate and maxDate
function getWeekHeaders(minDate, maxDate) {
  const weeks = []
  const cur = toMonday(new Date(minDate))
  const end = new Date(maxDate)
  while (cur <= end) {
    weeks.push(new Date(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

function formatDateShort(date) {
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

// Compute left% and width% of a bar within [minMs, maxMs]
function barPosition(startDate, endDate, minMs, totalMs) {
  if (!startDate || !endDate || totalMs <= 0) return null
  const s = new Date(startDate).getTime()
  const e = new Date(endDate).getTime()
  if (isNaN(s) || isNaN(e) || e < s) return null
  const left = Math.max(0, ((s - minMs) / totalMs) * 100)
  const right = Math.min(100, ((e - minMs) / totalMs) * 100)
  const width = Math.max(0.5, right - left)
  return { left, width }
}

export default function PartnershipGantt({ partners }) {
  const list = Array.isArray(partners) ? partners : []

  // Collect all start/end dates across all partners and their tasks
  let allDates = []
  for (const p of list) {
    if (p.startDate) allDates.push(new Date(p.startDate).getTime())
    if (p.endDate) allDates.push(new Date(p.endDate).getTime())
    const tasks = Array.isArray(p.tasks) ? p.tasks : []
    for (const t of tasks) {
      if (t.startDate) allDates.push(new Date(t.startDate).getTime())
      if (t.endDate) allDates.push(new Date(t.endDate).getTime())
    }
  }

  allDates = allDates.filter(d => !isNaN(d))

  // Fallback if no dates
  const now = new Date()
  const rawMin = allDates.length > 0 ? Math.min(...allDates) : now.getTime()
  const rawMax = allDates.length > 0 ? Math.max(...allDates) : now.getTime()

  const minDate = toMonday(new Date(rawMin))
  // Ensure at least 7 weeks of range
  const minPlusSevenWeeks = new Date(minDate.getTime() + 7 * 7 * 24 * 60 * 60 * 1000)
  const maxDate = new Date(Math.max(rawMax, minPlusSevenWeeks.getTime()))

  const weekHeaders = getWeekHeaders(minDate, maxDate)
  const minMs = minDate.getTime()
  const totalMs = maxDate.getTime() - minMs

  const LEFT_COL_W = 180 // px fixed width for label column
  const WEEK_COL_W = 80  // px per week

  const timelineWidth = weekHeaders.length * WEEK_COL_W

  if (list.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
        Belum ada partner untuk ditampilkan di Gantt.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="font-semibold text-gray-900">Timeline Gantt</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {formatDateShort(minDate)} — {formatDateShort(maxDate)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_COL_W + timelineWidth + 'px' }}>

          {/* Header row: week labels */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div
              className="flex-shrink-0 border-r border-gray-200 px-2 py-2 text-xs font-semibold text-gray-500"
              style={{ width: LEFT_COL_W }}
            >
              Task
            </div>
            <div className="flex" style={{ width: timelineWidth }}>
              {weekHeaders.map((w, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border-r border-gray-100 px-1 py-2 text-xs text-gray-400 text-center"
                  style={{ width: WEEK_COL_W }}
                >
                  {formatDateShort(w)}
                </div>
              ))}
            </div>
          </div>

          {/* Rows per partner */}
          {list.map((partner) => {
            const tasks = Array.isArray(partner.tasks) ? partner.tasks : []
            // Build a lookup by name
            const taskByName = {}
            for (const t of tasks) {
              if (t.name) taskByName[t.name] = t
            }

            return (
              <div key={partner.id} className="border-b border-gray-200">
                {/* Partner header row */}
                <div className="flex items-center border-b border-gray-100" style={{ backgroundColor: '#003d7a' }}>
                  <div
                    className="flex-shrink-0 border-r border-gray-200 px-3 py-2 flex items-center gap-2"
                    style={{ width: LEFT_COL_W }}
                  >
                    <span className="text-sm font-semibold text-white truncate">{partner.name}</span>
                    {partner.priority && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${PRIORITY_BADGE[partner.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {partner.priority}
                      </span>
                    )}
                  </div>
                  {/* Partner-level bar */}
                  <div
                    className="relative"
                    style={{ width: timelineWidth, height: 36 }}
                  >
                    {/* Grid lines */}
                    {weekHeaders.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-gray-100"
                        style={{ left: i * WEEK_COL_W }}
                      />
                    ))}
                    {/* Partner span bar */}
                    {(() => {
                      const pos = barPosition(partner.startDate, partner.endDate, minMs, totalMs)
                      if (!pos) return null
                      const barLeft = (pos.left / 100) * timelineWidth
                      const barWidth = (pos.width / 100) * timelineWidth
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 rounded"
                          style={{
                            left: barLeft,
                            width: barWidth,
                            height: 10,
                            backgroundColor: BTN_BLUE,
                            opacity: 0.3,
                          }}
                        />
                      )
                    })()}
                  </div>
                </div>

                {/* Check if partner has any task dates */}
                {(() => {
                  const partnerHasDates = tasks.some(t => t.startDate || t.endDate)
                  if (!partnerHasDates) {
                    return (
                      <div className="flex items-center border-b border-gray-50">
                        <div
                          className="flex-shrink-0 border-r border-gray-200 px-3 py-1.5"
                          style={{ width: LEFT_COL_W }}
                        >
                          <div className="text-xs text-gray-400">—</div>
                        </div>
                        <div
                          className="relative px-2 py-2 flex items-center"
                          style={{ width: timelineWidth }}
                        >
                          <span className="text-xs text-gray-400">Belum ada tanggal task</span>
                        </div>
                      </div>
                    )
                  }

                  {/* Task rows */}
                  return (
                    <>
                      {TASK_STAGES.map((stageName) => {
                        const task = taskByName[stageName]
                        const pic = task?.pic || ''
                        const progress = task?.progress ?? 0 // 0-1 float
                        const progressPct = Math.round(progress * 100)
                        const hasBar = task?.startDate && task?.endDate
                        const pos = hasBar ? barPosition(task.startDate, task.endDate, minMs, totalMs) : null

                        return (
                          <div key={stageName} className="flex items-center hover:bg-gray-50 border-b border-gray-50">
                            {/* Task label + PIC + progress */}
                            <div
                              className="flex-shrink-0 border-r border-gray-200 px-3 py-1.5"
                              style={{ width: LEFT_COL_W }}
                            >
                              <div className="text-xs font-medium text-gray-700 truncate">{stageName}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {pic && (
                                  <span className="text-xs text-gray-400 truncate max-w-[90px]">{pic}</span>
                                )}
                                {task && (
                                  <span className="text-xs text-gray-500 ml-auto flex-shrink-0">{progressPct}%</span>
                                )}
                              </div>
                            </div>

                            {/* Timeline bar */}
                            <div
                              className="relative"
                              style={{ width: timelineWidth, height: 32 }}
                            >
                              {/* Grid lines */}
                              {weekHeaders.map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 bottom-0 border-r border-gray-100"
                                  style={{ left: i * WEEK_COL_W }}
                                />
                              ))}

                              {pos ? (
                                <>
                                  {/* Background bar (gray) */}
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 rounded"
                                    style={{
                                      left: (pos.left / 100) * timelineWidth,
                                      width: (pos.width / 100) * timelineWidth,
                                      height: 8,
                                      backgroundColor: '#e5e7eb',
                                    }}
                                  />
                                  {/* Progress fill (BTN_BLUE) */}
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 rounded"
                                    style={{
                                      left: (pos.left / 100) * timelineWidth,
                                      width: ((pos.width / 100) * timelineWidth) * Math.min(1, Math.max(0, progress)),
                                      height: 8,
                                      backgroundColor: BTN_BLUE,
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 flex items-center px-2">
                                  <span className="text-xs text-gray-300">—</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
