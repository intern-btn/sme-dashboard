import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

function normKey(s) { return String(s || '').trim() }
function normName(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ') }

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

function toPoint(parsedIdas, idasDate) {
  const date = idasDate || new Date().toISOString().split('T')[0]
  const summary = parsedIdas?.summary || {}
  const rows = Array.isArray(parsedIdas?.rows) ? parsedIdas.rows : []
  const kol2PlusCount = rows.reduce((sum, r) => {
    const kolNum = parseInt(String(r?.kol || '').replace(/[^\d]/g, ''), 10)
    return sum + (!Number.isNaN(kolNum) && kolNum >= 2 ? 1 : 0)
  }, 0)
  return {
    date,
    totalBakiDebet: summary.totalBakiDebet || 0,
    totalDebitur: summary.totalDebitur || rows.length,
    kol2PlusCount,
  }
}

export async function POST(request) {
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
      await storage.put('prk_spbu_manual_parsed.json', parsedManual)
      await storage.put('prk_spbu_manual_metadata.json', { filename: manualFilename || 'ref_PRK_SPBU.xlsx', uploadDate })
      return NextResponse.json({ success: true, manualOnly: true })
    }

    const inferredIdasDate = idasDate || parsedIdas?.idasDate || uploadDate.split('T')[0]
    const stats = parsedIdas?.summary || {}

    await storage.put('prk_spbu_parsed.json', parsedIdas)
    await storage.put('prk_spbu_metadata.json', {
      filename: idasFilename || 'IDAS_PRK_SPBU.xlsx',
      uploadDate,
      idasDate: inferredIdasDate,
      stats,
    })

    if (parsedManual) {
      await storage.put('prk_spbu_manual_parsed.json', parsedManual)
      await storage.put('prk_spbu_manual_metadata.json', { filename: manualFilename || 'ref_PRK_SPBU.xlsx', uploadDate })
    }

    const existingTrend = (await storage.get('prk_spbu_trend_parsed.json')) || { points: [] }
    const points = Array.isArray(existingTrend?.points) ? existingTrend.points : []
    const nextPoint = toPoint(parsedIdas, inferredIdasDate)
    const filtered = points.filter((p) => p?.date !== nextPoint.date)
    filtered.push(nextPoint)
    filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))

    await storage.put('prk_spbu_trend_parsed.json', { points: filtered })
    await storage.put('prk_spbu_trend_metadata.json', { uploadDate })

    await storage.put(`history/${uploadId}_prk_spbu.json`, parsedIdas, { allowOverwrite: false })

    const historyIndex = (await storage.get('history_index.json')) || { entries: [] }
    historyIndex.entries.push({
      uploadId,
      uploadDate,
      monthInfo: null,
      files: [idasFilename, parsedManual ? manualFilename : null].filter(Boolean),
      spbu: true,
    })
    historyIndex.entries = historyIndex.entries
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 100)
    await storage.put('history_index.json', historyIndex)

    const masterRows = parsedManual?.rows ?? (await storage.get('prk_spbu_manual_parsed.json'))?.rows ?? []
    const mergeStats = computeMergeStats(parsedIdas, masterRows)

    return NextResponse.json({ success: true, idasDate: inferredIdasDate, stats: mergeStats || stats })
  } catch (error) {
    console.error('SPBU upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
  }
}
