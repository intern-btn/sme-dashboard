/**
 * Extracts the access scope fields from a NextAuth JWT token (API routes).
 */
export function getScopeFromToken(token) {
  if (!token) return { accessScope: 'national', kanwil: null, cabang: null }
  return {
    accessScope: token.accessScope || 'national',
    kanwil: token.kanwil || null,
    cabang: token.cabang || null,
  }
}

/**
 * Extracts the access scope fields from a server-side session (page.js).
 */
export function getScopeFromSession(session) {
  const user = session?.user
  if (!user) return { accessScope: 'national', kanwil: null, cabang: null }
  return {
    accessScope: user.accessScope || 'national',
    kanwil: user.kanwil || null,
    cabang: user.cabang || null,
  }
}

/**
 * Filters a parsed dataset to only include data visible to the given scope.
 * Returns a new object (shallow copy with filtered arrays) — does not mutate input.
 *
 * @param {object} parsed  - The full parsed JSON object from storage
 * @param {{ accessScope: string, kanwil: string|null, cabang: string|null }} scope
 * @param {string} dataType - The storage key prefix (e.g. 'npl', 'rkap_kur')
 * @returns {object} filtered copy
 */
export function applyScope(parsed, scope, dataType) {
  if (!parsed) return parsed

  const { accessScope, kanwil, cabang } = scope

  // National users and any unrecognised scope: return as-is
  if (!accessScope || accessScope === 'national') return parsed

  const isRkap = dataType?.startsWith('rkap_')
  const isRealisasi = dataType === 'realisasi'

  // National-aggregate datasets — no regional split exists; show to everyone
  if (isRealisasi) return parsed

  // ── RKAP datasets (kanwilData[] only, no cabangData) ─────────────────────
  if (isRkap) {
    const kanwilData = Array.isArray(parsed.kanwilData) ? parsed.kanwilData : []
    const filteredKanwil = kanwilData.filter(k => k.name === kanwil)

    return {
      ...parsed,
      kanwilData: filteredKanwil,
      national: filteredKanwil[0] || null,
    }
  }

  // ── Region datasets (kanwilData[] + cabangData[]) ─────────────────────────
  const kanwilData = Array.isArray(parsed.kanwilData) ? parsed.kanwilData : []
  const cabangData = Array.isArray(parsed.cabangData) ? parsed.cabangData : []

  if (accessScope === 'kanwil') {
    const filteredKanwil = kanwilData.filter(k => k.name === kanwil)
    const filteredCabang = cabangData.filter(c => c.kanwil === kanwil)
    const totalNasional = filteredKanwil[0] || sumCabang(filteredCabang, parsed.totalNasional)

    return {
      ...parsed,
      totalNasional,
      kanwilData: filteredKanwil,
      cabangData: filteredCabang,
    }
  }

  if (accessScope === 'cabang') {
    const filteredCabang = cabangData.filter(c => c.name === cabang && c.kanwil === kanwil)
    const filteredKanwil = kanwilData.filter(k => k.name === kanwil)
    const totalNasional = filteredCabang[0] || null

    return {
      ...parsed,
      totalNasional,
      kanwilData: filteredKanwil,
      cabangData: filteredCabang,
    }
  }

  return parsed
}

/**
 * Sums numeric fields across cabang rows to derive a synthetic totalNasional.
 * Falls back to the original totalNasional shape as key template.
 */
function sumCabang(cabangRows, template) {
  if (!cabangRows.length) return template || null

  const result = {}
  const numericKeys = Object.keys(cabangRows[0]).filter(
    k => k !== 'name' && k !== 'kanwil' && typeof cabangRows[0][k] === 'number'
  )

  for (const key of numericKeys) {
    result[key] = cabangRows.reduce((sum, c) => sum + (c[key] || 0), 0)
  }

  return result
}
