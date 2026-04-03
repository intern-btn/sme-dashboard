import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import {
  parseNPLExcel,
  parseKOL2Excel,
  parseRealisasiExcel,
  parseRealisasiKreditExcel,
  parsePosisiKreditExcel
} from '../../../lib/excel-parsers.js'
import { getStorage } from '../../../lib/storage/index.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const nplFile = formData.get('npl')
    const kol2File = formData.get('kol2')
    const realisasiFile = formData.get('realisasi')
    const realisasiKreditFile = formData.get('realisasi_kredit')
    const posisiKreditFile = formData.get('posisi_kredit')

    if (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile) {
      return NextResponse.json({ error: 'At least one Excel file is required' }, { status: 400 })
    }

    const uploadDate = new Date().toISOString()
    const uploadId = Date.now().toString()
    const storage = getStorage()

    let nplData, kol2Data, realisasiData, realisasiKreditData, posisiKreditData

    if (nplFile) {
      const nplWorkbook = XLSX.read(Buffer.from(await nplFile.arrayBuffer()), { type: 'buffer' })
      nplData = parseNPLExcel(nplWorkbook)
    }
    if (kol2File) {
      const kol2Workbook = XLSX.read(Buffer.from(await kol2File.arrayBuffer()), { type: 'buffer' })
      kol2Data = parseKOL2Excel(kol2Workbook)
    }
    if (realisasiFile) {
      const realisasiWorkbook = XLSX.read(Buffer.from(await realisasiFile.arrayBuffer()), { type: 'buffer' })
      realisasiData = parseRealisasiExcel(realisasiWorkbook)
    }
    if (realisasiKreditFile) {
      const realisasiKreditWorkbook = XLSX.read(Buffer.from(await realisasiKreditFile.arrayBuffer()), { type: 'buffer' })
      realisasiKreditData = parseRealisasiKreditExcel(realisasiKreditWorkbook)
    }
    if (posisiKreditFile) {
      const posisiKreditWorkbook = XLSX.read(Buffer.from(await posisiKreditFile.arrayBuffer()), { type: 'buffer' })
      posisiKreditData = parsePosisiKreditExcel(posisiKreditWorkbook)
    }

    const monthInfo = nplData?.monthInfo || kol2Data?.monthInfo || realisasiData?.monthInfo ||
                      realisasiKreditData?.monthInfo || posisiKreditData?.monthInfo

    try {
      // Save latest versions (for dashboard display)
      if (nplFile && nplData) {
        await storage.put('npl_metadata.json', { filename: nplFile.name, uploadDate, fileSize: nplFile.size, monthInfo })
        await storage.put('npl_parsed.json', nplData)
      }
      if (kol2File && kol2Data) {
        await storage.put('kol2_metadata.json', { filename: kol2File.name, uploadDate, fileSize: kol2File.size, monthInfo })
        await storage.put('kol2_parsed.json', kol2Data)
      }
      if (realisasiFile && realisasiData) {
        await storage.put('realisasi_metadata.json', { filename: realisasiFile.name, uploadDate, fileSize: realisasiFile.size, monthInfo })
        await storage.put('realisasi_parsed.json', realisasiData)
      }
      if (realisasiKreditFile && realisasiKreditData) {
        await storage.put('realisasi_kredit_metadata.json', { filename: realisasiKreditFile.name, uploadDate, fileSize: realisasiKreditFile.size, monthInfo })
        await storage.put('realisasi_kredit_parsed.json', realisasiKreditData)
      }
      if (posisiKreditFile && posisiKreditData) {
        await storage.put('posisi_kredit_metadata.json', { filename: posisiKreditFile.name, uploadDate, fileSize: posisiKreditFile.size, monthInfo })
        await storage.put('posisi_kredit_parsed.json', posisiKreditData)
      }

      // Save historical versions
      if (nplData) await storage.put(`history/${uploadId}_npl.json`, nplData, { allowOverwrite: false })
      if (kol2Data) await storage.put(`history/${uploadId}_kol2.json`, kol2Data, { allowOverwrite: false })
      if (realisasiData) await storage.put(`history/${uploadId}_realisasi.json`, realisasiData, { allowOverwrite: false })
      if (realisasiKreditData) await storage.put(`history/${uploadId}_realisasi_kredit.json`, realisasiKreditData, { allowOverwrite: false })
      if (posisiKreditData) await storage.put(`history/${uploadId}_posisi_kredit.json`, posisiKreditData, { allowOverwrite: false })

      // Build uploaded files list
      const uploadedFiles = [
        nplFile && nplFile.name,
        kol2File && kol2File.name,
        realisasiFile && realisasiFile.name,
        realisasiKreditFile && realisasiKreditFile.name,
        posisiKreditFile && posisiKreditFile.name,
      ].filter(Boolean)

      await storage.put(`history/${uploadId}_meta.json`, {
        uploadId, uploadDate, monthInfo, files: uploadedFiles
      }, { allowOverwrite: false })

      // Update consolidated history index
      const historyIndex = (await storage.get('history_index.json')) || { entries: [] }

      historyIndex.entries.push({ uploadId, uploadDate, monthInfo, files: uploadedFiles })
      historyIndex.entries = historyIndex.entries
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 100)

      await storage.put('history_index.json', historyIndex)

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

    } catch (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to save data', details: storageError.message },
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
