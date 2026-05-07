import { hmacIdentifier } from './crypto.js'

const BUSINESS_TYPES = new Set(['spbu', 'bpjs', 'indomaret'])

export function normalizeBusinessDataType(type) {
  if (!type) return null
  if (type.startsWith('prk_spbu') || type.startsWith('spbu')) return 'spbu'
  if (type.startsWith('bpjs')) return 'bpjs'
  if (type.startsWith('indomaret')) return 'indomaret'
  return null
}

function normalizeAccount(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function maskNoDebitur(value) {
  const account = String(value || '').trim()
  if (!account) return ''
  const visible = account.slice(-4)
  return `${'*'.repeat(Math.max(account.length - visible.length, 6))}${visible}`
}

export function maskNama(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return ''
  return parts.map((part) => `${part[0].toUpperCase()}.`).join('')
}

export function addBusinessMatchKeys(row) {
  const next = { ...row }

  if (row?.noDebitur) next._noDebiturHash = hmacIdentifier(normalizeAccount(row.noDebitur))
  if (row?.noRekening) next._noRekeningHash = hmacIdentifier(normalizeAccount(row.noRekening))
  if (row?.nama) next._namaHash = hmacIdentifier(normalizeName(row.nama))

  return next
}

export function maskBusinessRow(row) {
  const next = addBusinessMatchKeys(row)

  if (Object.prototype.hasOwnProperty.call(next, 'noDebitur')) {
    next.noDebitur = maskNoDebitur(next.noDebitur)
  }
  if (Object.prototype.hasOwnProperty.call(next, 'noRekening')) {
    next.noRekening = maskNoDebitur(next.noRekening)
  }
  if (Object.prototype.hasOwnProperty.call(next, 'nama')) {
    next.nama = maskNama(next.nama)
  }

  return next
}

export function maskBusinessData(data, businessType, isUnlocked) {
  if (!BUSINESS_TYPES.has(businessType) || !Array.isArray(data?.rows)) return data

  const rows = data.rows.map((row) => (
    isUnlocked ? addBusinessMatchKeys(row) : maskBusinessRow(row)
  ))

  return isUnlocked ? { ...data, rows } : { ...data, rows, masked: true }
}
