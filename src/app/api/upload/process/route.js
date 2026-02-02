import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import {
  parseNPLExcel,
  parseKOL2Excel,
  parseRealisasiExcel,
  parseRealisasiKreditExcel,
  parsePosisiKreditExcel
} from '../../../../lib/excel-parsers.js'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })
    }

    const { blobUrl } = await request.json()

    if (!blobUrl) {
      return NextResponse.json({ error: 'Blob URL is required' }, { status: 400 })
    }

    // Download file from Vercel Blob
    console.log('Downloading file from:', blobUrl)
    const response = await fetch(blobUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse multi-sheet Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    console.log('Found sheets:', workbook.SheetNames)

    // Map sheet names to data types using flexible pattern matching
    const sheetMap = {
      npl: null,
      kol2: null,
      realisasi: null,
      realisasi_kredit: null,
      posisi_kredit: null
    }

    const patterns = {
      // Specific sheet name patterns based on BTN's Excel structure
      npl: /^49c/i,                    // 49c. NPLKC (produk)
      kol2: /^49b/i,                   // 49b. Kol 2 KC (produk)
      realisasi: /^22a/i,              // 22a. Real sub prdk
      realisasi_kredit: /^44a1/i,      // 44a1.Real Komit Produk
      posisi_kredit: /^44b/i           // 44b. Posisi KC
    }

    // Match sheets to data types
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

    // Parse each sheet with the appropriate parser
    let nplData, kol2Data, realisasiData, realisasiKreditData, posisiKreditData
    const parsedSheets = []
    const missingSheets = []

    if (sheetMap.npl) {
      const singleSheetWorkbook = {
        SheetNames: [sheetMap.npl],
        Sheets: { [sheetMap.npl]: workbook.Sheets[sheetMap.npl] }
      }
      nplData = parseNPLExcel(singleSheetWorkbook)
      parsedSheets.push('NPL')
    } else {
      missingSheets.push('NPL')
    }

    if (sheetMap.kol2) {
      const singleSheetWorkbook = {
        SheetNames: [sheetMap.kol2],
        Sheets: { [sheetMap.kol2]: workbook.Sheets[sheetMap.kol2] }
      }
      kol2Data = parseKOL2Excel(singleSheetWorkbook)
      parsedSheets.push('KOL2')
    } else {
      missingSheets.push('KOL2')
    }

    if (sheetMap.realisasi) {
      const singleSheetWorkbook = {
        SheetNames: [sheetMap.realisasi],
        Sheets: { [sheetMap.realisasi]: workbook.Sheets[sheetMap.realisasi] }
      }
      realisasiData = parseRealisasiExcel(singleSheetWorkbook)
      parsedSheets.push('Realisasi')
    } else {
      missingSheets.push('Realisasi')
    }

    if (sheetMap.realisasi_kredit) {
      const singleSheetWorkbook = {
        SheetNames: [sheetMap.realisasi_kredit],
        Sheets: { [sheetMap.realisasi_kredit]: workbook.Sheets[sheetMap.realisasi_kredit] }
      }
      realisasiKreditData = parseRealisasiKreditExcel(singleSheetWorkbook)
      parsedSheets.push('Realisasi Kredit')
    } else {
      missingSheets.push('Realisasi Kredit')
    }

    if (sheetMap.posisi_kredit) {
      const singleSheetWorkbook = {
        SheetNames: [sheetMap.posisi_kredit],
        Sheets: { [sheetMap.posisi_kredit]: workbook.Sheets[sheetMap.posisi_kredit] }
      }
      posisiKreditData = parsePosisiKreditExcel(singleSheetWorkbook)
      parsedSheets.push('Posisi Kredit')
    } else {
      missingSheets.push('Posisi Kredit')
    }

    // Get month info from first available parsed data
    const monthInfo = nplData?.monthInfo || kol2Data?.monthInfo || realisasiData?.monthInfo ||
                      realisasiKreditData?.monthInfo || posisiKreditData?.monthInfo

    const uploadDate = new Date().toISOString()
    const uploadId = Date.now().toString()

    // Upload LATEST versions (for dashboard display)
    let blobBaseUrl = process.env.BLOB_BASE_URL || ''

    if (nplData) {
      const nplMetaResult = await put('npl_metadata.json', JSON.stringify({
        filename: 'Multi-sheet Excel (NPL sheet)',
        uploadDate,
        fileSize: buffer.length,
        monthInfo
      }), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })

      if (!blobBaseUrl) {
        blobBaseUrl = nplMetaResult.url.replace('/npl_metadata.json', '')
      }

      await put('npl_parsed.json', JSON.stringify(nplData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
    }

    if (kol2Data) {
      await put('kol2_metadata.json', JSON.stringify({
        filename: 'Multi-sheet Excel (KOL2 sheet)',
        uploadDate,
        fileSize: buffer.length,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

      await put('kol2_parsed.json', JSON.stringify(kol2Data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
    }

    if (realisasiData) {
      await put('realisasi_metadata.json', JSON.stringify({
        filename: 'Multi-sheet Excel (Realisasi sheet)',
        uploadDate,
        fileSize: buffer.length,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

      await put('realisasi_parsed.json', JSON.stringify(realisasiData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
    }

    if (realisasiKreditData) {
      await put('realisasi_kredit_metadata.json', JSON.stringify({
        filename: 'Multi-sheet Excel (Realisasi Kredit sheet)',
        uploadDate,
        fileSize: buffer.length,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

      await put('realisasi_kredit_parsed.json', JSON.stringify(realisasiKreditData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
    }

    if (posisiKreditData) {
      await put('posisi_kredit_metadata.json', JSON.stringify({
        filename: 'Multi-sheet Excel (Posisi Kredit sheet)',
        uploadDate,
        fileSize: buffer.length,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

      await put('posisi_kredit_parsed.json', JSON.stringify(posisiKreditData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
    }

    // Upload HISTORICAL versions
    if (nplData) {
      await put(`history/${uploadId}_npl.json`, JSON.stringify(nplData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false
      })
    }

    if (kol2Data) {
      await put(`history/${uploadId}_kol2.json`, JSON.stringify(kol2Data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false
      })
    }

    if (realisasiData) {
      await put(`history/${uploadId}_realisasi.json`, JSON.stringify(realisasiData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false
      })
    }

    if (realisasiKreditData) {
      await put(`history/${uploadId}_realisasi_kredit.json`, JSON.stringify(realisasiKreditData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false
      })
    }

    if (posisiKreditData) {
      await put(`history/${uploadId}_posisi_kredit.json`, JSON.stringify(posisiKreditData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false
      })
    }

    // Update history index
    await put(`history/${uploadId}_meta.json`, JSON.stringify({
      uploadId,
      uploadDate,
      monthInfo,
      files: ['Multi-sheet Excel'],
      parsedSheets,
      missingSheets
    }), { access: 'public', addRandomSuffix: false, allowOverwrite: false })

    // Update consolidated history index
    let historyIndex = { entries: [] }

    if (blobBaseUrl) {
      try {
        const existingIndex = await fetch(`${blobBaseUrl}/history_index.json`, { cache: 'no-store' })
        if (existingIndex.ok) {
          historyIndex = await existingIndex.json()
        }
      } catch {
        // Start fresh if no index exists
      }
    }

    const newEntry = {
      uploadId,
      uploadDate,
      monthInfo,
      files: ['Multi-sheet Excel'],
      parsedSheets,
      missingSheets
    }

    historyIndex.entries.push(newEntry)

    // Keep only the last 100 entries
    historyIndex.entries = historyIndex.entries
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 100)

    await put('history_index.json', JSON.stringify(historyIndex), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    })

    return NextResponse.json({
      success: true,
      message: parsedSheets.length > 0
        ? `Successfully parsed ${parsedSheets.length} sheet(s)`
        : 'No recognized sheets found',
      uploadDate,
      monthInfo,
      parsedSheets,
      missingSheets,
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
