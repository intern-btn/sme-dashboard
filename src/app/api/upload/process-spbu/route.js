import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

function toPoint(parsedIdas) {
  const date = parsedIdas?.idasDate || new Date().toISOString().split('T')[0]
  const summary = parsedIdas?.summary || {}
  const rows = Array.isArray(parsedIdas?.rows) ? parsedIdas.rows : []

  const kol2PlusCount = rows.reduce((sum, r) => {
    const kolNum = parseInt(String(r?.kol || '').replace(/[^\d]/g, ''), 10)
    return sum + (!Number.isNaN(kolNum) && kolNum >= 2 ? 1 : 0)
  }, 0)

  return {
    date,
    totalBakiDebet: summary.totalBakiDebet || 0,
    totalDebitur: summary.totalDebitur || 0,
    nplCount: summary.nplCount || 0,
    kol2PlusCount,
  }
}

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { parsedIdas, parsedManual, filename } = await request.json()

    if (!parsedIdas) {
      return NextResponse.json({ error: 'parsedIdas wajib' }, { status: 400 })
    }

    const uploadDate = new Date().toISOString()
    const uploadId = Date.now().toString()
    const storage = getStorage()

    const stats = parsedIdas?.summary || {}
    const idasDate = parsedIdas?.idasDate || null

    await storage.put('prk_spbu_parsed.json', parsedIdas)
    await storage.put('prk_spbu_metadata.json', {
      filename: filename || 'IDAS upload',
      uploadDate,
      idasDate,
      stats,
    })

    if (parsedManual) {
      await storage.put('prk_spbu_manual_parsed.json', parsedManual)
      await storage.put('prk_spbu_manual_metadata.json', { uploadDate })
    }

    // Trend
    const existingTrend = (await storage.get('prk_spbu_trend_parsed.json')) || { points: [] }
    const points = Array.isArray(existingTrend?.points) ? existingTrend.points : []
    const nextPoint = toPoint(parsedIdas)

    const filtered = points.filter((p) => p?.date !== nextPoint.date)
    filtered.push(nextPoint)
    filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))

    await storage.put('prk_spbu_trend_parsed.json', { points: filtered })
    await storage.put('prk_spbu_trend_metadata.json', { uploadDate })

    // Archive
    await storage.put(`history/${uploadId}_prk_spbu.json`, parsedIdas, { allowOverwrite: false })

    // Update history index (append a compact entry)
    const historyIndex = (await storage.get('history_index.json')) || { entries: [] }
    historyIndex.entries.push({
      uploadId,
      uploadDate,
      monthInfo: null,
      files: [idasFile.name, manualFile?.name].filter(Boolean),
      spbu: true,
    })
    historyIndex.entries = historyIndex.entries
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 100)
    await storage.put('history_index.json', historyIndex)

    return NextResponse.json({
      success: true,
      idasDate,
      stats,
    })
  } catch (error) {
    console.error('SPBU upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
  }
}

