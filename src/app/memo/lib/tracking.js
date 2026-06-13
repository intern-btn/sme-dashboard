// Helpers untuk tracking sirkulasi memo
// Pipeline: PIC → Kadept → Sekretaris → Kadiv → PIC → Sekretaris (Arsip)

export const TRACKING_STEPS = [
  { key: 'pic_submit', label: 'PIC', role: 'Pengaju Memo', person: 'pic' },
  { key: 'kadept', label: 'Kadept', role: 'Kepala Departemen', person: 'kadept' },
  { key: 'sekretaris1', label: 'Sekretaris', role: 'Sekretaris (ke Kadiv)', person: 'sekretaris' },
  { key: 'kadiv', label: 'Kadiv', role: 'Kepala Divisi', person: 'kadiv' },
  { key: 'pic_return', label: 'PIC', role: 'Pengaju (terima hasil)', person: 'pic' },
  { key: 'sekretaris2', label: 'Sekretaris', role: 'Sekretaris (Arsip)', person: 'sekretaris' },
]

export const TOTAL_STEPS = TRACKING_STEPS.length

export function parseJSON(str, fallback) {
  try {
    const v = JSON.parse(str ?? '')
    return v ?? fallback
  } catch {
    return fallback
  }
}

export function isTracked(memo) {
  return !!memo?.trackingStartedAt
}

export function isTrackingDone(memo) {
  return isTracked(memo) && memo.trackingStep >= TOTAL_STEPS
}

export function getHistory(memo) {
  const h = parseJSON(memo?.stepHistory, [])
  return Array.isArray(h) ? h : []
}

export function getRoles(memo) {
  const r = parseJSON(memo?.trackingRoles, {})
  return r && typeof r === 'object' ? r : {}
}

export function getPersonForStep(memo, stepIndex) {
  const step = TRACKING_STEPS[stepIndex]
  if (!step) return '-'
  return getRoles(memo)[step.person] || '-'
}

// Jam berjalan di tahap aktif saat ini
export function getHoursAtStep(memo) {
  const history = getHistory(memo)
  if (!history.length) return 0
  const last = history[history.length - 1]
  const start = new Date(last.date).getTime()
  const end = isTrackingDone(memo) && memo.trackingCompletedAt
    ? new Date(memo.trackingCompletedAt).getTime()
    : Date.now()
  return Math.max(0, Math.round((end - start) / 3600000 * 10) / 10)
}

export function getDaysAtStep(memo) {
  return Math.floor(getHoursAtStep(memo) / 24)
}

export function isOverdue(memo) {
  if (!isTracked(memo) || isTrackingDone(memo)) return false
  return getHoursAtStep(memo) > (memo.slaHours || 8)
}

// Durasi (jam) yang dihabiskan pada tahap ke-i, atau null jika belum tersentuh
export function getStepDuration(memo, stepIndex) {
  const history = getHistory(memo)
  const entry = history.find(h => h.step === stepIndex)
  if (!entry) return null
  const next = history.find(h => h.step === stepIndex + 1)
  let end = null
  if (next) end = new Date(next.date).getTime()
  else if (isTrackingDone(memo) && memo.trackingCompletedAt) end = new Date(memo.trackingCompletedAt).getTime()
  else if (stepIndex === memo.trackingStep) end = Date.now()
  if (end === null) return null
  return Math.max(0, Math.round((end - new Date(entry.date).getTime()) / 3600000 * 10) / 10)
}

export function formatHours(h) {
  if (h === null || h === undefined) return '-'
  if (h >= 48) return `${Math.round(h / 24 * 10) / 10}hr` // hari
  return `${h}j`
}

export function formatDateShort(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Klasifikasi status tracking untuk filter & badge
// → 'untracked' | 'proses' | 'overdue' | 'selesai'
export function getTrackingState(memo) {
  if (!isTracked(memo)) return 'untracked'
  if (isTrackingDone(memo)) return 'selesai'
  if (isOverdue(memo)) return 'overdue'
  return 'proses'
}
