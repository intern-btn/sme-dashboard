import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from './storage/index.js'
import { normKey, normName, toKolNum } from './business-utils.js'

function computeMergeStats(parsedIdas, masterRows) {
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

function buildTrendPoint(parsedIdas, idasDate) {
  const date = idasDate || new Date().toISOString().split('T')[0]
  const summary = parsedIdas?.summary || {}
  const rows = Array.isArray(parsedIdas?.rows) ? parsedIdas.rows : []
  const kol2PlusCount = rows.reduce((sum, r) => {
    const kolNum = toKolNum(r?.kol)
    return sum + (kolNum !== null && kolNum >= 2 ? 1 : 0)
  }, 0)
  return {
    date,
    totalBakiDebet: summary.totalBakiDebet || 0,
    totalDebitur: summary.totalDebitur || rows.length,
    kol2PlusCount,
  }
}

export function createUploadHandler({ storagePrefix, defaultIdasFilename, defaultManualFilename, historyFlag }) {
  return async function POST(request) {
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const body = await request.json()
      const { parsedIdas, parsedManual, idasFilename, manualFilename, idasDate } = body

      if (!parsedIdas && !parsedManual) {
        return NextResponse.json({ error: 'parsedIdas atau parsedManual wajib' }, { status: 400 })
      }

      const uploadDate = new Date().toISOString()
      const uploadId = Date.now().toString()
      const storage = getStorage()

      if (!parsedIdas && parsedManual) {
        await storage.put(`${storagePrefix}_manual_parsed.json`, parsedManual)
        await storage.put(`${storagePrefix}_manual_metadata.json`, {
          filename: manualFilename || defaultManualFilename,
          uploadDate,
        })
        return NextResponse.json({ success: true, manualOnly: true })
      }

      const inferredIdasDate = idasDate || parsedIdas?.idasDate || uploadDate.split('T')[0]
      const stats = parsedIdas?.summary || {}

      await storage.put(`${storagePrefix}_parsed.json`, parsedIdas)
      await storage.put(`${storagePrefix}_metadata.json`, {
        filename: idasFilename || defaultIdasFilename,
        uploadDate,
        idasDate: inferredIdasDate,
        stats,
      })

      if (parsedManual) {
        await storage.put(`${storagePrefix}_manual_parsed.json`, parsedManual)
        await storage.put(`${storagePrefix}_manual_metadata.json`, {
          filename: manualFilename || defaultManualFilename,
          uploadDate,
        })
      }

      const existingTrend = (await storage.get(`${storagePrefix}_trend_parsed.json`)) || { points: [] }
      const points = Array.isArray(existingTrend?.points) ? existingTrend.points : []
      const nextPoint = buildTrendPoint(parsedIdas, inferredIdasDate)
      const filtered = points.filter((p) => p?.date !== nextPoint.date)
      filtered.push(nextPoint)
      filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))

      await storage.put(`${storagePrefix}_trend_parsed.json`, { points: filtered })
      await storage.put(`${storagePrefix}_trend_metadata.json`, { uploadDate })

      await storage.put(`history/${uploadId}_${storagePrefix}.json`, parsedIdas, { allowOverwrite: false })

      const historyIndex = (await storage.get('history_index.json')) || { entries: [] }
      historyIndex.entries.push({
        uploadId,
        uploadDate,
        monthInfo: null,
        files: [idasFilename, parsedManual ? manualFilename : null].filter(Boolean),
        [historyFlag]: true,
      })
      historyIndex.entries = historyIndex.entries
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 100)
      await storage.put('history_index.json', historyIndex)

      const masterRows = parsedManual?.rows ?? (await storage.get(`${storagePrefix}_manual_parsed.json`))?.rows ?? []
      const mergeStats = computeMergeStats(parsedIdas, masterRows)

      return NextResponse.json({ success: true, idasDate: inferredIdasDate, stats: mergeStats || stats })
    } catch (error) {
      console.error(`${storagePrefix} upload error:`, error)
      return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
    }
  }
}
