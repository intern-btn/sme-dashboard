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

export function computeMergeStats(parsedIdas, masterRows) {
  const idasRows = Array.isArray(parsedIdas?.rows) ? parsedIdas.rows : []
  const rows = Array.isArray(masterRows) ? masterRows : []
  if (rows.length === 0) return null

  const byRek = new Map()
  const byNama = new Map()
  for (const r of idasRows) {
    const k = normKey(r?.noRekening)
    if (k) byRek.set(k, r)
    const n = normName(r?.nama)
    if (n && !byNama.has(n)) byNama.set(n, r)
  }

  let found = 0
  let totalBakiDebet = 0
  for (const m of rows) {
    const idas = byRek.get(normKey(m?.noDebitur)) || byNama.get(normName(m?.nama)) || null
    if (idas) { found++; totalBakiDebet += idas.bakiDebet || 0 }
  }
  return { masterTotal: rows.length, idasFound: found, totalBakiDebet }
}
