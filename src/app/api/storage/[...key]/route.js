import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request, { params }) {
  // Only available in local storage mode
  if (process.env.STORAGE_PROVIDER !== 'local' && process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Not available in blob mode' }, { status: 404 })
  }

  const { key: keyParam } = await params
  const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam
  const dataDir = path.resolve(process.env.DATA_DIR || './data')
  const filePath = path.resolve(path.join(dataDir, key))

  // Prevent path traversal
  if (!filePath.startsWith(dataDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const content = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = ext === '.json' ? 'application/json' : 'application/octet-stream'

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
