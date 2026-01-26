/**
 * Date utilities for dynamic month/year handling
 * Used by both admin portal (for parsing) and dashboard (for display)
 */

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

/**
 * Get month info for current and previous month based on a reference date
 * @param {Date|string} referenceDate - The date to calculate from (usually upload date)
 * @returns {Object} - Contains current and previous month info
 */
export function getMonthInfo(referenceDate = new Date()) {
  const date = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate

  // Current month
  const currentMonth = date.getMonth()
  const currentYear = date.getFullYear()

  // Previous month
  const prevDate = new Date(date)
  prevDate.setMonth(prevDate.getMonth() - 1)
  const previousMonth = prevDate.getMonth()
  const previousYear = prevDate.getFullYear()

  return {
    current: {
      month: currentMonth,
      year: currentYear,
      name: MONTH_NAMES_ID[currentMonth],
      shortName: MONTH_NAMES_SHORT_ID[currentMonth],
      fullLabel: `${MONTH_NAMES_ID[currentMonth]} ${currentYear}`,
      shortLabel: `${MONTH_NAMES_SHORT_ID[currentMonth]} ${currentYear}`
    },
    previous: {
      month: previousMonth,
      year: previousYear,
      name: MONTH_NAMES_ID[previousMonth],
      shortName: MONTH_NAMES_SHORT_ID[previousMonth],
      fullLabel: `${MONTH_NAMES_ID[previousMonth]} ${previousYear}`,
      shortLabel: `${MONTH_NAMES_SHORT_ID[previousMonth]} ${previousYear}`
    },
    referenceDate: date.toISOString(),
    day: date.getDate()
  }
}

/**
 * Format a date for display in Indonesian locale
 * @param {Date|string} date
 * @param {string} format - 'short', 'long', or 'full'
 */
export function formatDateID(date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date

  const options = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  }

  return d.toLocaleDateString('id-ID', {
    ...options[format],
    timeZone: 'Asia/Jakarta'
  })
}

/**
 * Get the same day in the previous month
 * @param {Date|string} date
 */
export function getSameDayPreviousMonth(date) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  const day = d.getDate()

  // Go to previous month
  d.setMonth(d.getMonth() - 1)

  // Handle edge cases (e.g., Jan 31 -> Feb has no 31)
  // If day doesn't exist in previous month, use last day of that month
  const lastDayOfPrevMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  if (day > lastDayOfPrevMonth) {
    d.setDate(lastDayOfPrevMonth)
  }

  return d
}

export { MONTH_NAMES_ID, MONTH_NAMES_SHORT_ID }
