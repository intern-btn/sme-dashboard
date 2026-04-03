import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import {
  parseNPLExcel,
  parseKOL2Excel,
  parseRealisasiExcel,
  parseRealisasiKreditExcel,
  parsePosisiKreditExcel
} from '../../../../lib/excel-parsers.js'
import { getStorage } from '../../../../lib/storage/index.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let buffer

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Self-hosted path: file uploaded directly as multipart form data
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      // Vercel Blob path: file was uploaded to blob, we receive its URL
      const { blobUrl } = await request.json()
      if (!blobUrl) {
        return NextResponse.json({ error: 'blobUrl or file is required' }, { status: 400 })
      }
      const response = await fetch(blobUrl)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }
      buffer = Buffer.from(await response.arrayBuffer())
    }

    // Parse multi-sheet Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    console.log('Found sheets:', workbook.SheetNames)

    const sheetMap = {
      npl: null,
      kol2: null,
      realisasi: null,
      realisasi_kredit: null,
      posisi_kredit: null
    }

    const patterns = {
      npl: /^49c/i,
      kol2: /^49b/i,
      realisasi: /^22a/i,
      realisasi_kredit: /^44a1/i,
      posisi_kredit: /^44b/i
    }

    for (const sheetName of workbook.SheetNames) {
      if (patterns.realisasi_kredit.test(sheetName)) {
        sheetMap.realisasi_kredit = sheetName
      } else if (patterns.posisi_kredit.test(sheetName)) {
        sheetMap.posisi_kredit = sheetName
      } else if (patterns.realisasi.test(sheetName)) {
        sheetMap.realisasi = sheetName
      } else if (patterns.npl.test(sheetName)) {
        sheetMap.npl = sheetName
      } else if (patterns.kol2.test(sheetName)) {
        sheetMap.kol2 = sheetName
      }
    }

    console.log('Sheet mapping:', sheetMap)

    let nplData, kol2Data, realisasiData, realisasiKreditData, posisiKreditData
    const parsedSheets = []
    const missingSheets = []

    const parseSheet = (sheetName) => ({
      SheetNames: [sheetName],
      Sheets: { [sheetName]: workbook.Sheets[sheetName] }
    })

    if (sheetMap.npl) {
      nplData = parseNPLExcel(parseSheet(sheetMap.npl))
      parsedSheets.push('NPL')
    } else missingSheets.push('NPL')

    if (sheetMap.kol2) {
      kol2Data = parseKOL2Excel(parseSheet(sheetMap.kol2))
      parsedSheets.push('KOL2')
    } else missingSheets.push('KOL2')

    if (sheetMap.realisasi) {
      realisasiData = parseRealisasiExcel(parseSheet(sheetMap.realisasi))
      parsedSheets.push('Realisasi')
    } else missingSheets.push('Realisasi')

    if (sheetMap.realisasi_kredit) {
      realisasiKreditData = parseRealisasiKreditExcel(parseSheet(sheetMap.realisasi_kredit))
      parsedSheets.push('Realisasi Kredit')
    } else missingSheets.push('Realisasi Kredit')

    if (sheetMap.posisi_kredit) {
      posisiKreditData = parsePosisiKreditExcel(parseSheet(sheetMap.posisi_kredit))
      parsedSheets.push('Posisi Kredit')
    } else missingSheets.push('Posisi Kredit')

    const monthInfo = nplData?.monthInfo || kol2Data?.monthInfo || realisasiData?.monthInfo ||
                      realisasiKreditData?.monthInfo || posisiKreditData?.monthInfo

    const uploadDate = new Date().toISOString()
    const uploadId = Date.now().toString()
    const storage = getStorage()

    // Save latest versions
    if (nplData) {
      await storage.put('npl_metadata.json', { filename: 'Multi-sheet Excel (NPL sheet)', uploadDate, fileSize: buffer.length, monthInfo })
      await storage.put('npl_parsed.json', nplData)
    }
    if (kol2Data) {
      await storage.put('kol2_metadata.json', { filename: 'Multi-sheet Excel (KOL2 sheet)', uploadDate, fileSize: buffer.length, monthInfo })
      await storage.put('kol2_parsed.json', kol2Data)
    }
    if (realisasiData) {
      await storage.put('realisasi_metadata.json', { filename: 'Multi-sheet Excel (Realisasi sheet)', uploadDate, fileSize: buffer.length, monthInfo })
      await storage.put('realisasi_parsed.json', realisasiData)
    }
    if (realisasiKreditData) {
      await storage.put('realisasi_kredit_metadata.json', { filename: 'Multi-sheet Excel (Realisasi Kredit sheet)', uploadDate, fileSize: buffer.length, monthInfo })
      await storage.put('realisasi_kredit_parsed.json', realisasiKreditData)
    }
    if (posisiKreditData) {
      await storage.put('posisi_kredit_metadata.json', { filename: 'Multi-sheet Excel (Posisi Kredit sheet)', uploadDate, fileSize: buffer.length, monthInfo })
      await storage.put('posisi_kredit_parsed.json', posisiKreditData)
    }

    // Save historical versions
    if (nplData) await storage.put(`history/${uploadId}_npl.json`, nplData, { allowOverwrite: false })
    if (kol2Data) await storage.put(`history/${uploadId}_kol2.json`, kol2Data, { allowOverwrite: false })
    if (realisasiData) await storage.put(`history/${uploadId}_realisasi.json`, realisasiData, { allowOverwrite: false })
    if (realisasiKreditData) await storage.put(`history/${uploadId}_realisasi_kredit.json`, realisasiKreditData, { allowOverwrite: false })
    if (posisiKreditData) await storage.put(`history/${uploadId}_posisi_kredit.json`, posisiKreditData, { allowOverwrite: false })

    await storage.put(`history/${uploadId}_meta.json`, {
      uploadId, uploadDate, monthInfo,
      files: ['Multi-sheet Excel'], parsedSheets, missingSheets
    }, { allowOverwrite: false })

    // Update history index
    const historyIndex = (await storage.get('history_index.json')) || { entries: [] }

    historyIndex.entries.push({ uploadId, uploadDate, monthInfo, files: ['Multi-sheet Excel'], parsedSheets, missingSheets })
    historyIndex.entries = historyIndex.entries
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 100)

    await storage.put('history_index.json', historyIndex)

    return NextResponse.json({
      success: true,
      message: parsedSheets.length > 0
        ? `Successfully parsed ${parsedSheets.length} sheet(s)`
        : 'No recognized sheets found',
      uploadDate, monthInfo, parsedSheets, missingSheets,
      stats: {
        nplKanwil: nplData?.kanwilData?.length || 0,
        nplCabang: nplData?.cabangData?.length || 0,
        kol2Kanwil: kol2Data?.kanwilData?.length || 0,
        kol2Cabang: kol2Data?.cabangData?.length || 0,
        realisasiDays: realisasiData?.dailyData?.length || 0,
        realisasiKreditKanwil: realisasiKreditData?.kanwilData?.length || 0,
        realisasiKreditCabang: realisasiKreditData?.cabangData?.length || 0,
        posisiKreditKanwil: posisiKreditData?.kanwilData?.length || 0,
        posisiKreditCabang: posisiKreditData?.cabangData?.length || 0
      }
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    )
  }
}
