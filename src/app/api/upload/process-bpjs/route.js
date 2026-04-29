import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

function dateFromFilename(filename) {
  const name = String(filename || '')
  const m = name.match(/(\d{2})(\d{2})(\d{2,4})/)
  if (!m) return null
  const dd = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  let yyyy = parseInt(m[3], 10)
  if (yyyy < 100) yyyy += 2000
  const d = new Date(Date.UTC(yyyy, mm - 1, dd))
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
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
    const parsedIdas = body?.parsedIdas || null
    const parsedManual = body?.parsedManual || null
    const idasFilename = body?.idasFilename || body?.filename || 'IDAS_BPJS.xlsx'
    const manualFilename = body?.manualFilename || 'ref_BPJS.xlsx'

    if (!parsedIdas && !parsedManual) {
      return NextResponse.json({ error: 'parsedIdas atau parsedManual wajib' }, { status: 400 })
    }

    const uploadDate = new Date().toISOString()
    const uploadId = Date.now().toString()
    const storage = getStorage()

    if (!parsedIdas && parsedManual) {
      await storage.put('bpjs_manual_parsed.json', parsedManual)
      await storage.put('bpjs_manual_metadata.json', { filename: manualFilename, uploadDate })
      return NextResponse.json({ success: true, manualOnly: true })
    }

    const inferredIdasDate =
      body?.idasDate ||
      parsedIdas?.idasDate ||
      dateFromFilename(idasFilename) ||
      uploadDate.split('T')[0]
    const stats = parsedIdas?.summary || {}

    await storage.put('bpjs_parsed.json', parsedIdas)
    await storage.put('bpjs_metadata.json', {
      filename: idasFilename,
      uploadDate,
      idasDate: inferredIdasDate,
      stats,
    })

    if (parsedManual) {
      await storage.put('bpjs_manual_parsed.json', parsedManual)
      await storage.put('bpjs_manual_metadata.json', { filename: manualFilename, uploadDate })
    }

    const existingTrend = (await storage.get('bpjs_trend_parsed.json')) || { points: [] }
    const points = Array.isArray(existingTrend?.points) ? existingTrend.points : []
    const nextPoint = toPoint(parsedIdas, inferredIdasDate)
    const filtered = points.filter((p) => p?.date !== nextPoint.date)
    filtered.push(nextPoint)
    filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))

    await storage.put('bpjs_trend_parsed.json', { points: filtered })
    await storage.put('bpjs_trend_metadata.json', { uploadDate })

    await storage.put(`history/${uploadId}_bpjs.json`, parsedIdas, { allowOverwrite: false })

    const historyIndex = (await storage.get('history_index.json')) || { entries: [] }
    historyIndex.entries.push({
      uploadId,
      uploadDate,
      monthInfo: null,
      files: [idasFilename, parsedManual ? manualFilename : null].filter(Boolean),
      bpjs: true,
    })
    historyIndex.entries = historyIndex.entries
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 100)
    await storage.put('history_index.json', historyIndex)

    return NextResponse.json({ success: true, idasDate: inferredIdasDate, stats })
  } catch (error) {
    console.error('BPJS upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
  }
}
