// The 8 workflow stages in order
export const TASK_STAGES = [
  'Pertemuan Awal',
  'Meeting Internal Divisi',
  'Kajian RAC',
  'Persetujuan Direksi',
  'PKS',
  'Sosialisasi Internal',
  'Memo ke KC',
  'Sosialisasi Eksternal',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

/**
 * Seed an 8-task array for a new partner
 * @param {Date | string} startDate - Date object or ISO string
 * @returns {Array} Array of 8 objects with stage info, progress 0, and dates
 */
export function defaultTasks(startDate) {
  const isoDate = typeof startDate === 'string' ? startDate : startDate.toISOString()

  return TASK_STAGES.map((stageName) => ({
    name: stageName,
    pic: '',
    progress: 0,
    startDate: isoDate,
    endDate: isoDate,
  }))
}

/**
 * Returns fractional weeks between endDate and now
 * @param {string} endDate - ISO string date
 * @param {Date} now - Current date (default: new Date())
 * @returns {number} Weeks left (can be negative if overdue)
 */
export function weeksLeft(endDate, now = new Date()) {
  const endTime = new Date(endDate).getTime()
  const nowTime = now.getTime()
  return (endTime - nowTime) / (7 * 24 * 60 * 60 * 1000)
}

/**
 * Get status distribution across all partners
 * @param {Array} partners - Array of partner objects
 * @returns {Object} { counts, total, percentages }
 */
export function statusDistribution(partners) {
  const counts = {}

  // Initialize counts for each stage
  TASK_STAGES.forEach((stage) => {
    counts[stage] = 0
  })

  // Count partners by lastUpdateStatus
  partners.forEach((partner) => {
    const status = partner.lastUpdateStatus
    if (status && counts.hasOwnProperty(status)) {
      counts[status]++
    }
  })

  // Calculate total
  const total = partners.length

  // Calculate percentages
  const percentages = {}
  TASK_STAGES.forEach((stage) => {
    percentages[stage] = total > 0 ? counts[stage] / total : 0
  })

  return { counts, total, percentages }
}

/**
 * Get priority distribution across all partners
 * @param {Array} partners - Array of partner objects
 * @returns {Object} { counts, total, percentages }
 */
export function priorityDistribution(partners) {
  const counts = {
    High: 0,
    Medium: 0,
    Low: 0,
  }

  // Count partners by priority
  partners.forEach((partner) => {
    const priority = partner.priority
    if (priority && counts.hasOwnProperty(priority)) {
      counts[priority]++
    }
  })

  // Calculate total
  const total = partners.length

  // Calculate percentages
  const percentages = {
    High: total > 0 ? counts.High / total : 0,
    Medium: total > 0 ? counts.Medium / total : 0,
    Low: total > 0 ? counts.Low / total : 0,
  }

  return { counts, total, percentages }
}

/**
 * Parse tasks JSON string from DB to array
 * @param {string} tasksJson - JSON string from database
 * @returns {Array} Parsed tasks array, or empty array if invalid
 */
export function parseTasks(tasksJson) {
  if (!tasksJson) return []
  try {
    const parsed = JSON.parse(tasksJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Serialize tasks array to JSON string for DB
 * @param {Array} tasks - Tasks array
 * @returns {string} JSON stringified tasks
 */
export function serializeTasks(tasks) {
  return JSON.stringify(tasks)
}
