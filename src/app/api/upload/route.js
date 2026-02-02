import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import {
  parseNPLExcel,
  parseKOL2Excel,
  parseRealisasiExcel,
  parseRealisasiKreditExcel,
  parsePosisiKreditExcel
} from '../../../lib/excel-parsers.js'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const nplFile = formData.get('npl')
    const kol2File = formData.get('kol2')
    const realisasiFile = formData.get('realisasi')
    const realisasiKreditFile = formData.get('realisasi_kredit')
    const posisiKreditFile = formData.get('posisi_kredit')

    // At least one file is required
    if (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile) {
      return NextResponse.json({ error: 'At least one Excel file is required' }, { status: 400 })
    }

    const uploadDate = new Date().toISOString()
    const datePrefix = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const uploadId = Date.now().toString() // Unique timestamp ID

    // Parse Excel files (only if uploaded)
    let nplData, kol2Data, realisasiData, realisasiKreditData, posisiKreditData

    if (nplFile) {
      const nplBuffer = Buffer.from(await nplFile.arrayBuffer())
      const nplWorkbook = XLSX.read(nplBuffer, { type: 'buffer' })
      nplData = parseNPLExcel(nplWorkbook)
    }

    if (kol2File) {
      const kol2Buffer = Buffer.from(await kol2File.arrayBuffer())
      const kol2Workbook = XLSX.read(kol2Buffer, { type: 'buffer' })
      kol2Data = parseKOL2Excel(kol2Workbook)
    }

    if (realisasiFile) {
      const realisasiBuffer = Buffer.from(await realisasiFile.arrayBuffer())
      const realisasiWorkbook = XLSX.read(realisasiBuffer, { type: 'buffer' })
      realisasiData = parseRealisasiExcel(realisasiWorkbook)
    }

    if (realisasiKreditFile) {
      const realisasiKreditBuffer = Buffer.from(await realisasiKreditFile.arrayBuffer())
      const realisasiKreditWorkbook = XLSX.read(realisasiKreditBuffer, { type: 'buffer' })
      realisasiKreditData = parseRealisasiKreditExcel(realisasiKreditWorkbook)
    }

    if (posisiKreditFile) {
      const posisiKreditBuffer = Buffer.from(await posisiKreditFile.arrayBuffer())
      const posisiKreditWorkbook = XLSX.read(posisiKreditBuffer, { type: 'buffer' })
      posisiKreditData = parsePosisiKreditExcel(posisiKreditWorkbook)
    }

    const monthInfo = nplData?.monthInfo || kol2Data?.monthInfo || realisasiData?.monthInfo || realisasiKreditData?.monthInfo || posisiKreditData?.monthInfo

    try {
      // Upload LATEST versions (for dashboard display)
      let blobBaseUrl = process.env.BLOB_BASE_URL || ''

      if (nplFile && nplData) {
        const nplMetaResult = await put('npl_metadata.json', JSON.stringify({
          filename: nplFile.name,
          uploadDate,
          fileSize: nplFile.size,
          monthInfo
        }), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })

        // Extract blob base URL from the first upload
        if (!blobBaseUrl) {
          blobBaseUrl = nplMetaResult.url.replace('/npl_metadata.json', '')
        }

        await put('npl_parsed.json', JSON.stringify(nplData), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })
      }

      if (kol2File && kol2Data) {
        await put('kol2_metadata.json', JSON.stringify({
          filename: kol2File.name,
          uploadDate,
          fileSize: kol2File.size,
          monthInfo
        }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

        await put('kol2_parsed.json', JSON.stringify(kol2Data), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })
      }

      if (realisasiFile && realisasiData) {
        await put('realisasi_metadata.json', JSON.stringify({
          filename: realisasiFile.name,
          uploadDate,
          fileSize: realisasiFile.size,
          monthInfo
        }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

        await put('realisasi_parsed.json', JSON.stringify(realisasiData), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })
      }

      if (realisasiKreditFile && realisasiKreditData) {
        await put('realisasi_kredit_metadata.json', JSON.stringify({
          filename: realisasiKreditFile.name,
          uploadDate,
          fileSize: realisasiKreditFile.size,
          monthInfo
        }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

        await put('realisasi_kredit_parsed.json', JSON.stringify(realisasiKreditData), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })
      }

      if (posisiKreditFile && posisiKreditData) {
        await put('posisi_kredit_metadata.json', JSON.stringify({
          filename: posisiKreditFile.name,
          uploadDate,
          fileSize: posisiKreditFile.size,
          monthInfo
        }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

        await put('posisi_kredit_parsed.json', JSON.stringify(posisiKreditData), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true
        })
      }

      // Upload HISTORICAL versions (with unique upload ID to prevent overwriting same-day uploads)
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
      const uploadedFiles = []
      if (nplFile) uploadedFiles.push(nplFile.name)
      if (kol2File) uploadedFiles.push(kol2File.name)
      if (realisasiFile) uploadedFiles.push(realisasiFile.name)
      if (realisasiKreditFile) uploadedFiles.push(realisasiKreditFile.name)
      if (posisiKreditFile) uploadedFiles.push(posisiKreditFile.name)

      await put(`history/${uploadId}_meta.json`, JSON.stringify({
        uploadId,
        uploadDate,
        monthInfo,
        files: uploadedFiles
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

      // Always add new entry (never overwrite - each upload is unique)
      const newEntry = {
        uploadId,
        uploadDate,
        monthInfo,
        files: uploadedFiles
      }

      historyIndex.entries.push(newEntry)

      // Keep only the last 100 entries to prevent the index from growing indefinitely
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
        message: 'Files uploaded and parsed successfully',
        uploadDate,
        monthInfo,
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

    } catch (blobError) {
      console.error('Blob upload error:', blobError)
      return NextResponse.json(
        { error: 'Failed to upload to Blob storage', details: blobError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}
