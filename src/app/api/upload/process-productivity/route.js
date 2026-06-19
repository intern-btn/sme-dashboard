import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import * as XLSX from 'xlsx'
import { getStorage } from '../../../../lib/storage/index.js'

export const runtime = 'nodejs'

function parseNum(val) {
  if (val == null || val === '') return null
  const n = Number(String(val).replace(/,/g, '.'))
  return isNaN(n) ? null : n
}

function parseRow(row) {
  // Row columns (1-based from Excel, 0-based in array after header skip):
  // 0:RMCode 1:NIP 2:Nama 3:KJ 4:Jabatan 5:K_Outlet 6:Outlet 7:Jenis Outlet
  // 8:Kantor Cabang 9:Kantor Wilayah 10:31/Dec(realisasi) 11:Target 12:%Ach
  // 13:Skor 14:Kategori 15:NOA 16:(empty) 17:Pipeline Target 18:Num 19:Vol 20:Gap Pipeline
  return {
    rmCode:         String(row[0] ?? '').trim(),
    nip:            String(row[1] ?? '').trim(),
    nama:           String(row[2] ?? '').trim(),
    kj:             String(row[3] ?? '').trim(),
    jabatan:        String(row[4] ?? '').trim(),
    kOutlet:        String(row[5] ?? '').trim(),
    outlet:         String(row[6] ?? '').trim(),
    jenisOutlet:    String(row[7] ?? '').trim(),
    kantorCabang:   String(row[8] ?? '').trim(),
    kantorWilayah:  String(row[9] ?? '').trim(),
    realisasi:      parseNum(row[10]),
    target:         parseNum(row[11]),
    pctAch:         parseNum(row[12]),
    skor:           parseNum(row[13]),
    kategori:       String(row[14] ?? '').trim(),
    noa:            parseNum(row[15]),
    pipelineTarget: parseNum(row[17]),
    pipelineNum:    parseNum(row[18]),
    pipelineVol:    parseNum(row[19]),
    pipelineGap:    parseNum(row[20]),
  }
}

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let fileBuffer

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (body.blobUrl) {
        const res = await fetch(body.blobUrl)
        if (!res.ok) return NextResponse.json({ error: 'Failed to fetch blob' }, { status: 400 })
        fileBuffer = Buffer.from(await res.arrayBuffer())
      } else {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
    } else {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      fileBuffer = Buffer.from(await file.arrayBuffer())
    }

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    const sheetName = workbook.SheetNames.includes('PRD')
      ? 'PRD'
      : workbook.SheetNames[0]

    if (!sheetName) {
      return NextResponse.json({ error: 'File tidak mengandung sheet manapun' }, { status: 400 })
    }

    const sheet = workbook.Sheets[sheetName]
    // raw: true gives array-of-arrays; we skip rows 0-2 (title, col numbers, headers)
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })

    // row 0 = "PRD : Productivity List", row 1 = col numbers, row 2 = headers, data from row 3+
    const dataRows = rawRows.slice(3).filter(row =>
      row.length > 0 && String(row[0] ?? '').trim() !== ''
    )

    if (dataRows.length === 0) {
      return NextResponse.json({ error: 'Sheet PRD tidak mengandung data' }, { status: 400 })
    }

    const NON_RM_JABATAN = new Set(['SCPH', 'SBH'])
    const rows = dataRows.map(parseRow).filter(r =>
      (r.rmCode || r.nama) && !NON_RM_JABATAN.has(r.jabatan)
    )

    const uploadedAt = new Date().toISOString()
    const storage = getStorage()

    await storage.put('productivity_parsed.json', { rows })
    await storage.put('productivity_metadata.json', {
      uploadedAt,
      rowCount: rows.length,
      sheetName,
    })

    return NextResponse.json({ success: true, rowCount: rows.length })
  } catch (error) {
    console.error('Productivity upload error:', error)
    return NextResponse.json({ error: 'Upload gagal', details: error.message }, { status: 500 })
  }
}
