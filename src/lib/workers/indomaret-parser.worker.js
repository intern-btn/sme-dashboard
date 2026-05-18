import * as XLSX from 'xlsx'
import { parseIndomaretIdas, parseIndomaretManual, dateFromFilename, buildMonitoringSummary } from '../excel-parsers.js'
import { normKey, normName } from '../business-utils.js'

function readIdasWorkbook(u8) {
  const meta = XLSX.read(u8, { type: 'array', bookSheets: true })
  const sheets = meta.SheetNames.filter(n => !n.toLowerCase().includes('pivot'))
  return XLSX.read(u8, { type: 'array', sheets: sheets.length ? sheets : meta.SheetNames })
}

function filterIdasByMaster(parsedIdas, masterRows) {
  if (!Array.isArray(masterRows) || masterRows.length === 0) return parsedIdas
  const byRek = new Set(masterRows.map(r => normKey(r?.noDebitur)).filter(Boolean))
  const byNama = new Set(masterRows.map(r => normName(r?.nama)).filter(Boolean))
  const rows = parsedIdas.rows.filter(r =>
    byRek.has(normKey(r?.noRekening)) || byNama.has(normName(r?.nama))
  )
  const { summary, cabangBreakdown } = buildMonitoringSummary(rows)
  return { ...parsedIdas, rows, summary, cabangBreakdown }
}

self.onmessage = async (e) => {
  try {
    const { idasBuffer, manualBuffer, idasFilename } = e.data
    let parsedIdas = null
    let parsedManual = null

    // Parse manual first — needed as filter input for IDAS
    if (manualBuffer) {
      const wb = XLSX.read(new Uint8Array(manualBuffer), { type: 'array' })
      parsedManual = parseIndomaretManual(wb)
    }

    if (idasBuffer) {
      let masterRows = parsedManual?.rows ?? null

      if (!masterRows) {
        self.postMessage({ progress: 'fetching_master' })
        try {
          const res = await fetch('/api/data/indomaret/manual_parsed')
          if (res.ok) {
            const existing = await res.json()
            masterRows = existing?.rows ?? null
          }
        } catch { /* fall through to error below */ }

        if (!masterRows || masterRows.length === 0) {
          self.postMessage({
            error: 'Master file belum ditemukan. Harap upload File Master terlebih dahulu sebelum upload IDAS.'
          })
          return
        }
      }

      self.postMessage({ progress: 'parsing' })
      const wb = readIdasWorkbook(new Uint8Array(idasBuffer))
      parsedIdas = parseIndomaretIdas(wb)
      parsedIdas = filterIdasByMaster(parsedIdas, masterRows)
    }

    const idasDate = parsedIdas?.idasDate || dateFromFilename(idasFilename) || null
    self.postMessage({ done: true, parsedIdas, parsedManual, idasDate })
  } catch (err) {
    self.postMessage({ error: err.message })
  }
}
