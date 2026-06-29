import { NextResponse } from 'next/server'
import path from 'path'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

export async function GET(request, { params }) {
  const { key: keyParam } = await params
  const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam
  const normalizedKey = path.posix.normalize(key.replace(/\\/g, '/'))

  if (normalizedKey.startsWith('../') || normalizedKey === '..' || path.isAbsolute(normalizedKey)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const storage = getStorage()
    const raw = await storage.getRaw(normalizedKey)
    if (raw === null) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const content = Buffer.from(raw)
    const ext = path.extname(normalizedKey).toLowerCase()
    const contentType = ext === '.json' ? 'application/json' : 'application/octet-stream'

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
