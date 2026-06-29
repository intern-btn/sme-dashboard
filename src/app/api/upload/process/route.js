import { NextResponse } from 'next/server'
import { gunzipSync } from 'zlib'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

const DATASETS = {
  npl: {
    parsedKey: 'npl_parsed.json',
    metadataKey: 'npl_metadata.json',
    historyKey: (uploadId) => `history/${uploadId}_npl.json`,
  },
  kol2: {
    parsedKey: 'kol2_parsed.json',
    metadataKey: 'kol2_metadata.json',
    historyKey: (uploadId) => `history/${uploadId}_kol2.json`,
  },
  realisasi: {
    parsedKey: 'realisasi_parsed.json',
    metadataKey: 'realisasi_metadata.json',
    historyKey: (uploadId) => `history/${uploadId}_realisasi.json`,
  },
  realisasi_kredit: {
    parsedKey: 'realisasi_kredit_parsed.json',
    metadataKey: 'realisasi_kredit_metadata.json',
    historyKey: (uploadId) => `history/${uploadId}_realisasi_kredit.json`,
  },
  posisi_kredit: {
    parsedKey: 'posisi_kredit_parsed.json',
    metadataKey: 'posisi_kredit_metadata.json',
    historyKey: (uploadId) => `history/${uploadId}_posisi_kredit.json`,
  },
  rkap_kur: {
    parsedKey: 'rkap_kur_parsed.json',
  },
  rkap_kumk: {
    parsedKey: 'rkap_kumk_parsed.json',
  },
  rkap_posisi: {
    parsedKey: 'rkap_posisi_parsed.json',
  },
}

async function readJsonBody(request) {
  if (request.headers.get('content-encoding') === 'gzip') {
    const compressed = Buffer.from(await request.arrayBuffer())
    return JSON.parse(gunzipSync(compressed).toString('utf8'))
  }

  return await request.json()
}

async function requireAdmin(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

async function saveDataset(storage, body) {
  const { uploadId, datasetKey, data, metadata } = body
  const config = DATASETS[datasetKey]

  if (!uploadId || !config || data == null) {
    return NextResponse.json({ error: 'Invalid dataset save payload' }, { status: 400 })
  }

  if (config.metadataKey && metadata) {
    await storage.put(config.metadataKey, metadata)
  }

  await storage.put(config.parsedKey, data)

  if (config.historyKey && body.saveHistory !== false) {
    await storage.put(config.historyKey(uploadId), data, { allowOverwrite: false })
  }

  return NextResponse.json({ success: true, datasetKey })
}

async function finalizeUpload(storage, body) {
  const { uploadId, uploadDate, monthInfo, parsedSheets = [], missingSheets = [] } = body

  if (!uploadId || !uploadDate) {
    return NextResponse.json({ error: 'Invalid finalize payload' }, { status: 400 })
  }

  const entry = {
    uploadId,
    uploadDate,
    monthInfo,
    files: body.files || ['Multi-sheet Excel'],
    parsedSheets,
    missingSheets,
  }

  await storage.put(`history/${uploadId}_meta.json`, entry, { allowOverwrite: false })

  const historyIndex = (await storage.get('history_index.json')) || { entries: [] }
  historyIndex.entries = [
    ...(historyIndex.entries || []).filter((item) => item.uploadId !== uploadId),
    entry,
  ]
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    .slice(0, 100)

  await storage.put('history_index.json', historyIndex)

  return NextResponse.json({
    success: true,
    message: parsedSheets.length > 0
      ? `Successfully saved ${parsedSheets.length} dataset(s)`
      : 'No recognized sheets found',
    uploadDate,
    monthInfo,
    parsedSheets,
    missingSheets,
  })
}

export async function POST(request) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const body = await readJsonBody(request)
    const storage = getStorage()

    if (body.action === 'save-dataset') {
      return await saveDataset(storage, body)
    }

    if (body.action === 'finalize') {
      return await finalizeUpload(storage, body)
    }

    return NextResponse.json({ error: 'Unsupported upload action' }, { status: 400 })
  } catch (error) {
    console.error('Upload save error:', error)
    return NextResponse.json(
      { error: 'Upload save failed', details: error.message },
      { status: 500 }
    )
  }
}
