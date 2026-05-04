// src/lib/business-utils.js
export const formatRp = (n) =>
  `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)}`

export const formatNum = (n) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

export function formatDateDisplay(value) {
  const s = String(value || '').trim()
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function toKolNum(kol) {
  const kolNum = parseInt(String(kol || '').replace(/[^\d]/g, ''), 10)
  return Number.isNaN(kolNum) ? null : kolNum
}

export function toKOLBucket(kol) {
  const kolNum = toKolNum(kol)
  if (!kolNum) return null
  if (kolNum === 1) return 'KOL 1'
  if (kolNum >= 5) return 'KOL 5+'
  if (kolNum >= 2) return 'KOL 2-4'
  return null
}

export function normKey(s) { return String(s || '').trim() }
export function normName(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ') }

export const CHECK = '✓'
export const WARN = '⚠'
