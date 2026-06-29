import { NextResponse } from 'next/server'
import { gunzipSync } from 'zlib'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

async function readJsonBody(request) {
  if (request.headers.get('content-encoding') === 'gzip') {
    const compressed = Buffer.from(await request.arrayBuffer())
    return JSON.parse(gunzipSync(compressed).toString('utf8'))
  }

  return await request.json()
}

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await readJsonBody(request)
    const rows = Array.isArray(body.rows) ? body.rows : null
    if (!rows) {
      return NextResponse.json({ error: 'Parsed productivity rows are required' }, { status: 400 })
    }

    const uploadedAt = body.uploadedAt || new Date().toISOString()
    const storage = getStorage()

    await storage.put('productivity_parsed.json', { rows })
    await storage.put('productivity_metadata.json', {
      uploadedAt,
      rowCount: rows.length,
      sheetName: body.sheetName || 'PRD',
    })

    return NextResponse.json({ success: true, rowCount: rows.length })
  } catch (error) {
    console.error('Productivity save error:', error)
    return NextResponse.json({ error: 'Upload gagal', details: error.message }, { status: 500 })
  }
}
