import * as XLSX from 'xlsx'
import { parseIndomaretIdas, parseIndomaretManual, dateFromFilename } from '../excel-parsers.js'

function readIdasWorkbook(u8) {
  const meta = XLSX.read(u8, { type: 'array', bookSheets: true })
  const sheets = meta.SheetNames.filter(n => !n.toLowerCase().includes('pivot'))
  return XLSX.read(u8, { type: 'array', sheets: sheets.length ? sheets : meta.SheetNames })
}

self.onmessage = async (e) => {
  try {
    const { idasBuffer, manualBuffer, idasFilename } = e.data
    let parsedIdas = null
    let parsedManual = null

    if (idasBuffer) {
      self.postMessage({ progress: 'parsing' })
      const wb = readIdasWorkbook(new Uint8Array(idasBuffer))
      parsedIdas = parseIndomaretIdas(wb)
    }

    if (manualBuffer) {
      const wb = XLSX.read(new Uint8Array(manualBuffer), { type: 'array' })
      parsedManual = parseIndomaretManual(wb)
    }

    const idasDate = parsedIdas?.idasDate || dateFromFilename(idasFilename) || null
    self.postMessage({ done: true, parsedIdas, parsedManual, idasDate })
  } catch (err) {
    self.postMessage({ error: err.message })
  }
}
