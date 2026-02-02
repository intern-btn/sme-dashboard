import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

function parseMonthFromHeader(headerText) {
  if (!headerText) return null

  const monthMap = {
    'jan': { month: 0, name: 'Januari', shortName: 'Jan' },
    'feb': { month: 1, name: 'Februari', shortName: 'Feb' },
    'mar': { month: 2, name: 'Maret', shortName: 'Mar' },
    'apr': { month: 3, name: 'April', shortName: 'Apr' },
    'mei': { month: 4, name: 'Mei', shortName: 'Mei' },
    'may': { month: 4, name: 'Mei', shortName: 'Mei' },
    'jun': { month: 5, name: 'Juni', shortName: 'Jun' },
    'jul': { month: 6, name: 'Juli', shortName: 'Jul' },
    'agu': { month: 7, name: 'Agustus', shortName: 'Agu' },
    'aug': { month: 7, name: 'Agustus', shortName: 'Agu' },
    'sep': { month: 8, name: 'September', shortName: 'Sep' },
    'okt': { month: 9, name: 'Oktober', shortName: 'Okt' },
    'oct': { month: 9, name: 'Oktober', shortName: 'Okt' },
    'nov': { month: 10, name: 'November', shortName: 'Nov' },
    'des': { month: 11, name: 'Desember', shortName: 'Des' },
    'dec': { month: 11, name: 'Desember', shortName: 'Des' }
  }

  const text = String(headerText).toLowerCase()
  const match = text.match(/(\d{1,2})\s*([a-z]{3})['']?(\d{2,4})/)
  if (match) {
    const day = parseInt(match[1])
    const monthKey = match[2]
    let year = parseInt(match[3])
    if (year < 100) year += 2000

    const monthInfo = monthMap[monthKey]
    if (monthInfo) {
      return {
        day,
        month: monthInfo.month,
        year,
        name: monthInfo.name,
        shortName: monthInfo.shortName,
        fullLabel: `${monthInfo.name} ${year}`,
        shortLabel: `${monthInfo.shortName} ${year}`
      }
    }
  }
  return null
}

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

// ============================================
// EXCEL PARSERS
// ============================================

function parseNPLExcel(workbook) {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  let previousMonth = null
  let currentMonth = null
  let dataStartRow = 6

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '')
      const monthInfo = parseMonthFromHeader(cell)
      if (monthInfo) {
        if (!previousMonth) {
          previousMonth = monthInfo
        } else if (!currentMonth && monthInfo.month !== previousMonth.month) {
          currentMonth = monthInfo
        }
      }
    }
  }

  if (!previousMonth || !currentMonth) {
    const now = new Date()
    const prevDate = new Date(now)
    prevDate.setMonth(prevDate.getMonth() - 1)

    currentMonth = {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      name: getMonthName(now.getMonth()),
      shortName: getMonthShortName(now.getMonth()),
      fullLabel: `${getMonthName(now.getMonth())} ${now.getFullYear()}`,
      shortLabel: `${getMonthShortName(now.getMonth())} ${now.getFullYear()}`
    }

    previousMonth = {
      day: prevDate.getDate(),
      month: prevDate.getMonth(),
      year: prevDate.getFullYear(),
      name: getMonthName(prevDate.getMonth()),
      shortName: getMonthShortName(prevDate.getMonth()),
      fullLabel: `${getMonthName(prevDate.getMonth())} ${prevDate.getFullYear()}`,
      shortLabel: `${getMonthShortName(prevDate.getMonth())} ${prevDate.getFullYear()}`
    }
  }

  const kanwilData = []
  const cabangData = []
  let totalNasional = null

  // Kanwil name mapping for Excel variations
  const kanwilNameMap = {
    'Jatim Bali Nusra': 'Jabanus',
    'Jatim Bali': 'Jabanus'
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 3) continue

    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()
    const col2 = String(row[2] || '').trim()

    if (col1.toLowerCase().startsWith('total kanwil')) {
      let kanwilName = col1.replace(/total kanwil/i, '').trim()
      // Map kanwil name if needed
      if (kanwilNameMap[kanwilName]) {
        kanwilName = kanwilNameMap[kanwilName]
      }
      kanwilData.push({
        name: kanwilName,
        kumk_previous: parseNumber(row[3]),
        kumkPercent_previous: parseNumber(row[4]) * 100,
        kur_previous: parseNumber(row[5]),
        kurPercent_previous: parseNumber(row[6]) * 100,
        total_previous: parseNumber(row[7]),
        totalPercent_previous: parseNumber(row[8]) * 100,
        kumk_current: parseNumber(row[9]),
        kumkPercent_current: parseNumber(row[10]) * 100,
        kur_current: parseNumber(row[11]),
        kurPercent_current: parseNumber(row[12]) * 100,
        total_current: parseNumber(row[13]),
        totalPercent_current: parseNumber(row[14]) * 100,
        gap_kumk: parseNumber(row[16]),
        gap_kur: parseNumber(row[17]),
        gap_total: parseNumber(row[18]),
        outstanding_kumk_previous: parseNumber(row[20]),
        outstanding_kur_previous: parseNumber(row[21]),
        outstanding_total_previous: parseNumber(row[22]),
        outstanding_kumk_current: parseNumber(row[23]),
        outstanding_kur_current: parseNumber(row[24]),
        outstanding_total_current: parseNumber(row[25])
      })
      continue
    }

    if (col1.toLowerCase().includes('total nasional')) {
      totalNasional = {
        kumk_previous: parseNumber(row[3]),
        kumkPercent_previous: parseNumber(row[4]) * 100,
        kur_previous: parseNumber(row[5]),
        kurPercent_previous: parseNumber(row[6]) * 100,
        total_previous: parseNumber(row[7]),
        totalPercent_previous: parseNumber(row[8]) * 100,
        kumk_current: parseNumber(row[9]),
        kumkPercent_current: parseNumber(row[10]) * 100,
        kur_current: parseNumber(row[11]),
        kurPercent_current: parseNumber(row[12]) * 100,
        total_current: parseNumber(row[13]),
        totalPercent_current: parseNumber(row[14]) * 100,
        gap_kumk: parseNumber(row[16]),
        gap_kur: parseNumber(row[17]),
        gap_total: parseNumber(row[18]),
        outstanding_kumk_previous: parseNumber(row[20]),
        outstanding_kur_previous: parseNumber(row[21]),
        outstanding_total_previous: parseNumber(row[22]),
        outstanding_kumk_current: parseNumber(row[23]),
        outstanding_kur_current: parseNumber(row[24]),
        outstanding_total_current: parseNumber(row[25])
      }
      continue
    }

    if (/^\d+$/.test(col0) && col1 && col2) {
      // Map kanwil name if needed
      let kanwilName = col2
      if (kanwilNameMap[col2]) {
        kanwilName = kanwilNameMap[col2]
      }
      cabangData.push({
        name: col1,
        kanwil: kanwilName,
        kumk_previous: parseNumber(row[3]),
        kumkPercent_previous: parseNumber(row[4]) * 100,
        kur_previous: parseNumber(row[5]),
        kurPercent_previous: parseNumber(row[6]) * 100,
        total_previous: parseNumber(row[7]),
        totalPercent_previous: parseNumber(row[8]) * 100,
        kumk_current: parseNumber(row[9]),
        kumkPercent_current: parseNumber(row[10]) * 100,
        kur_current: parseNumber(row[11]),
        kurPercent_current: parseNumber(row[12]) * 100,
        total_current: parseNumber(row[13]),
        totalPercent_current: parseNumber(row[14]) * 100,
        gap_kumk: parseNumber(row[16]),
        gap_kur: parseNumber(row[17]),
        gap_total: parseNumber(row[18]),
        outstanding_kumk_previous: parseNumber(row[20]),
        outstanding_kur_previous: parseNumber(row[21]),
        outstanding_total_previous: parseNumber(row[22]),
        outstanding_kumk_current: parseNumber(row[23]),
        outstanding_kur_current: parseNumber(row[24]),
        outstanding_total_current: parseNumber(row[25])
      })
    }
  }

  if (!totalNasional && kanwilData.length > 0) {
    totalNasional = calculateTotalNasional(kanwilData)
  }

  return {
    type: 'npl',
    totalNasional,
    kanwilData,
    cabangData,
    monthInfo: {
      current: currentMonth,
      previous: previousMonth,
      referenceDate: new Date().toISOString(),
      day: currentMonth?.day || new Date().getDate()
    },
    parsedAt: new Date().toISOString()
  }
}

function parseKOL2Excel(workbook) {
  const result = parseNPLExcel(workbook)
  result.type = 'kol2'
  return result
}

function parseRealisasiExcel(workbook) {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  const headerRow = data[2] || []
  const monthColumns = []

  console.log('=== HEADER ROW DEBUG ===')
  console.log('Header row length:', headerRow.length)
  console.log('First 10 cells:', headerRow.slice(0, 10))
  console.log('Cells 80-95:', headerRow.slice(80, 95))

  for (let i = 1; i < headerRow.length; i++) {
    const cell = headerRow[i]
    if (typeof cell === 'number' && cell > 40000 && cell < 60000) {
      const date = excelDateToJS(cell)
      console.log(`Found date at column ${i}: ${cell} -> ${date}`)
      monthColumns.push({
        startCol: i,
        date: date,
        month: date.getMonth(),
        year: date.getFullYear(),
        name: getMonthName(date.getMonth()),
        shortName: getMonthShortName(date.getMonth()),
        fullLabel: `${getMonthName(date.getMonth())} ${date.getFullYear()}`
      })
    }
  }

  let previousMonth = null
  let currentMonth = null

  if (monthColumns.length >= 2) {
    previousMonth = monthColumns[monthColumns.length - 2]
    currentMonth = monthColumns[monthColumns.length - 1]
  } else if (monthColumns.length === 1) {
    currentMonth = monthColumns[0]
  }

  console.log('=== REALISASI HARIAN PARSING DEBUG ===')
  console.log('Month columns found:', monthColumns.length)
  console.log('Previous month:', previousMonth ? `${previousMonth.name} ${previousMonth.year} (month=${previousMonth.month}, startCol=${previousMonth.startCol})` : 'None')
  console.log('Current month:', currentMonth ? `${currentMonth.name} ${currentMonth.year} (month=${currentMonth.month}, startCol=${currentMonth.startCol})` : 'None')

  const dailyData = []
  const monthlyTotals = { previous: 0, current: 0 }

  for (let i = 4; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 2) continue

    const dateCell = row[0]

    if (typeof dateCell === 'number' && dateCell >= 1 && dateCell <= 31) {
      const dayNum = dateCell

      let prevKur = 0, prevKumk = 0, prevSmeSwadana = 0, prevKumkLainnya = 0
      let prevKppSupply = 0, prevKppDemand = 0, prevTotal = 0
      if (previousMonth) {
        const prevStart = previousMonth.startCol
        prevKur = parseNumber(row[prevStart])
        prevKumk = parseNumber(row[prevStart + 1])
        prevSmeSwadana = parseNumber(row[prevStart + 2])
        prevKumkLainnya = parseNumber(row[prevStart + 3])

        // Check if this month has KPP columns (October 2025 onwards)
        const monthHasKPP = (previousMonth.year > 2025) || (previousMonth.year === 2025 && previousMonth.month >= 9)

        if (monthHasKPP) {
          prevKppSupply = parseNumber(row[prevStart + 4])
          prevKppDemand = parseNumber(row[prevStart + 5])
          prevTotal = parseNumber(row[prevStart + 6])
        } else {
          prevKppSupply = 0
          prevKppDemand = 0
          prevTotal = parseNumber(row[prevStart + 4])
        }
      }

      let currKur = 0, currKumk = 0, currSmeSwadana = 0, currKumkLainnya = 0
      let currKppSupply = 0, currKppDemand = 0, currTotal = 0
      if (currentMonth) {
        const currStart = currentMonth.startCol
        currKur = parseNumber(row[currStart])
        currKumk = parseNumber(row[currStart + 1])
        currSmeSwadana = parseNumber(row[currStart + 2])
        currKumkLainnya = parseNumber(row[currStart + 3])

        // Check if this month has KPP columns (October 2025 onwards)
        const monthHasKPP = (currentMonth.year > 2025) || (currentMonth.year === 2025 && currentMonth.month >= 9)

        if (monthHasKPP) {
          currKppSupply = parseNumber(row[currStart + 4])
          currKppDemand = parseNumber(row[currStart + 5])
          currTotal = parseNumber(row[currStart + 6])
        } else {
          currKppSupply = 0
          currKppDemand = 0
          currTotal = parseNumber(row[currStart + 4])
        }
      }

      dailyData.push({
        date: dayNum,
        kur: currKur,
        kumk: currKumk,
        smeSwadana: currSmeSwadana,
        kumkLainnya: currKumkLainnya,
        kppSupply: currKppSupply,
        kppDemand: currKppDemand,
        total: currTotal,
        kur_previous: prevKur,
        kumk_previous: prevKumk,
        smeSwadana_previous: prevSmeSwadana,
        kumkLainnya_previous: prevKumkLainnya,
        kppSupply_previous: prevKppSupply,
        kppDemand_previous: prevKppDemand,
        total_previous: prevTotal
      })
    }
  }

  if (dailyData.length > 0) {
    const lastDay = dailyData[dailyData.length - 1]
    monthlyTotals.current = lastDay.total
    monthlyTotals.previous = lastDay.total_previous
  }

  return {
    type: 'realisasi',
    dailyData,
    monthlyTotals,
    monthInfo: {
      current: currentMonth ? {
        month: currentMonth.month,
        year: currentMonth.year,
        name: currentMonth.name,
        shortName: currentMonth.shortName,
        fullLabel: currentMonth.fullLabel,
        shortLabel: `${currentMonth.shortName} ${currentMonth.year}`
      } : null,
      previous: previousMonth ? {
        month: previousMonth.month,
        year: previousMonth.year,
        name: previousMonth.name,
        shortName: previousMonth.shortName,
        fullLabel: previousMonth.fullLabel,
        shortLabel: `${previousMonth.shortName} ${previousMonth.year}`
      } : null,
      referenceDate: new Date().toISOString(),
      day: dailyData.length
    },
    parsedAt: new Date().toISOString()
  }
}

function parseRealisasiKreditExcel(workbook) {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Search for months in header rows (similar to NPL parser)
  let previousMonth = null
  let currentMonth = null

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '')
      const monthInfo = parseMonthFromHeader(cell)
      if (monthInfo) {
        if (!previousMonth) {
          previousMonth = monthInfo
        } else if (!currentMonth && monthInfo.month !== previousMonth.month) {
          currentMonth = monthInfo
        }
      }
    }
  }

  // Fallback if months not found
  if (!currentMonth) {
    const now = new Date()
    currentMonth = {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      name: getMonthName(now.getMonth()),
      shortName: getMonthShortName(now.getMonth()),
      fullLabel: `${getMonthName(now.getMonth())} ${now.getFullYear()}`,
      shortLabel: `${getMonthShortName(now.getMonth())} ${now.getFullYear()}`
    }
  }

  if (!previousMonth) {
    const prevDate = new Date()
    prevDate.setMonth(prevDate.getMonth() - 1)
    previousMonth = {
      day: prevDate.getDate(),
      month: prevDate.getMonth(),
      year: prevDate.getFullYear(),
      name: getMonthName(prevDate.getMonth()),
      shortName: getMonthShortName(prevDate.getMonth()),
      fullLabel: `${getMonthName(prevDate.getMonth())} ${prevDate.getFullYear()}`,
      shortLabel: `${getMonthShortName(prevDate.getMonth())} ${prevDate.getFullYear()}`
    }
  }

  const kanwilData = []
  const cabangData = []
  let totalNasional = null
  let inKanwilSection = false

  // Kanwil name mapping for Excel variations
  const kanwilNameMap = {
    'Jatim Bali Nusra': 'Jabanus',
    'Jatim Bali': 'Jabanus'
  }

  const dataStartRow = 4

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 3) continue

    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()
    const col2 = String(row[2] || '').trim()
    const col3 = String(row[3] || '').trim()

    // Detect kanwil section header
    if (col2.toLowerCase().includes('kantor wilayah') || col2.toLowerCase().includes('kantor wilayah')) {
      inKanwilSection = true
      continue
    }

    // Handle TOTAL row in kanwil section
    if (inKanwilSection && col2.toLowerCase() === 'total') {
      if (!totalNasional) {
        totalNasional = {
          kumk_real_prev_full: parseNumber(row[4]),
          kumk_real_prev_mtd: parseNumber(row[5]),
          kumk_komitmen: parseNumber(row[6]),
          kumk_rkap: parseNumber(row[7]),
          kumk_real_current: parseNumber(row[8]),
          kumk_real_current_mtd: parseNumber(row[9]),
          kumk_pcp_komit: parseNumber(row[10]) * 100,
          kumk_pcp_rkap: parseNumber(row[11]) * 100,
          kumk_gap_komit: parseNumber(row[12]),
          kumk_gap_rkap: parseNumber(row[13]),
          kumk_gap_prev: parseNumber(row[14]),
          kumk_gap_prev_pct: parseNumber(row[15]) * 100,
          kur_real_prev_full: parseNumber(row[17]),
          kur_real_prev_mtd: parseNumber(row[18]),
          kur_komitmen: parseNumber(row[21]),
          kur_rkap: parseNumber(row[22]),
          kur_real_current: parseNumber(row[23]),
          kur_kpp_demand: parseNumber(row[24]),
          kur_kpp_supply: parseNumber(row[25]),
          kur_total_current: parseNumber(row[27]),
          kur_pcp_komit: parseNumber(row[29]) * 100,
          kur_pcp_rkap: parseNumber(row[30]) * 100,
          kur_gap_komit: parseNumber(row[31]),
          kur_gap_rkap: parseNumber(row[32]),
          kur_gap_prev: parseNumber(row[33]),
          kur_gap_prev_pct: parseNumber(row[34]) * 100,
          umkm_real_prev_full: parseNumber(row[36]),
          umkm_real_prev_mtd: parseNumber(row[37]),
          umkm_komitmen: parseNumber(row[38]),
          umkm_rkap: parseNumber(row[39]),
          umkm_real_current: parseNumber(row[40]),
          umkm_real_current_mtd: parseNumber(row[41]),
          umkm_pcp_komit: parseNumber(row[42]) * 100,
          umkm_pcp_rkap: parseNumber(row[43]) * 100,
          umkm_gap_komit: parseNumber(row[44]),
          umkm_gap_rkap: parseNumber(row[45]),
          umkm_gap_prev: parseNumber(row[46]),
          umkm_gap_prev_pct: parseNumber(row[47]) * 100
        }
      }
      inKanwilSection = false
      continue
    }

    // Parse kanwil data (kanwil name is in col3, ignore col2 to handle Excel formatting issues)
    if (inKanwilSection && !col0 && !col1 && col3 && col3.toLowerCase() !== 'wilayah') {
      let kanwilName = col3
      // Map kanwil name if needed
      if (kanwilNameMap[col3]) {
        kanwilName = kanwilNameMap[col3]
      }
      kanwilData.push({
        name: kanwilName,
        // KUMK section
        kumk_real_prev_full: parseNumber(row[4]),
        kumk_real_prev_mtd: parseNumber(row[5]),
        kumk_komitmen: parseNumber(row[6]),
        kumk_rkap: parseNumber(row[7]),
        kumk_real_current: parseNumber(row[8]),
        kumk_real_current_mtd: parseNumber(row[9]),
        kumk_pcp_komit: parseNumber(row[10]) * 100,
        kumk_pcp_rkap: parseNumber(row[11]) * 100,
        kumk_gap_komit: parseNumber(row[12]),
        kumk_gap_rkap: parseNumber(row[13]),
        kumk_gap_prev: parseNumber(row[14]),
        kumk_gap_prev_pct: parseNumber(row[15]) * 100,
        // KUR section
        kur_real_prev_full: parseNumber(row[17]),
        kur_real_prev_mtd: parseNumber(row[18]),
        kur_komitmen: parseNumber(row[21]),
        kur_rkap: parseNumber(row[22]),
        kur_real_current: parseNumber(row[23]),
        kur_kpp_demand: parseNumber(row[24]),
        kur_kpp_supply: parseNumber(row[25]),
        kur_total_current: parseNumber(row[27]),
        kur_pcp_komit: parseNumber(row[29]) * 100,
        kur_pcp_rkap: parseNumber(row[30]) * 100,
        kur_gap_komit: parseNumber(row[31]),
        kur_gap_rkap: parseNumber(row[32]),
        kur_gap_prev: parseNumber(row[33]),
        kur_gap_prev_pct: parseNumber(row[34]) * 100,
        // UMKM Total
        umkm_real_prev_full: parseNumber(row[36]),
        umkm_real_prev_mtd: parseNumber(row[37]),
        umkm_komitmen: parseNumber(row[38]),
        umkm_rkap: parseNumber(row[39]),
        umkm_real_current: parseNumber(row[40]),
        umkm_real_current_mtd: parseNumber(row[41]),
        umkm_pcp_komit: parseNumber(row[42]) * 100,
        umkm_pcp_rkap: parseNumber(row[43]) * 100,
        umkm_gap_komit: parseNumber(row[44]),
        umkm_gap_rkap: parseNumber(row[45]),
        umkm_gap_prev: parseNumber(row[46]),
        umkm_gap_prev_pct: parseNumber(row[47]) * 100
      })
      continue
    }

    // Total Nasional (could be in col2 or at end of kanwil section)
    if (col2.toLowerCase().includes('total nasional')) {
      totalNasional = {
        kumk_real_prev_full: parseNumber(row[4]),
        kumk_real_prev_mtd: parseNumber(row[5]),
        kumk_komitmen: parseNumber(row[6]),
        kumk_rkap: parseNumber(row[7]),
        kumk_real_current: parseNumber(row[8]),
        kumk_real_current_mtd: parseNumber(row[9]),
        kumk_pcp_komit: parseNumber(row[10]) * 100,
        kumk_pcp_rkap: parseNumber(row[11]) * 100,
        kumk_gap_komit: parseNumber(row[12]),
        kumk_gap_rkap: parseNumber(row[13]),
        kumk_gap_prev: parseNumber(row[14]),
        kumk_gap_prev_pct: parseNumber(row[15]) * 100,
        kur_real_prev_full: parseNumber(row[17]),
        kur_real_prev_mtd: parseNumber(row[18]),
        kur_komitmen: parseNumber(row[21]),
        kur_rkap: parseNumber(row[22]),
        kur_real_current: parseNumber(row[23]),
        kur_kpp_demand: parseNumber(row[24]),
        kur_kpp_supply: parseNumber(row[25]),
        kur_total_current: parseNumber(row[27]),
        kur_pcp_komit: parseNumber(row[29]) * 100,
        kur_pcp_rkap: parseNumber(row[30]) * 100,
        kur_gap_komit: parseNumber(row[31]),
        kur_gap_rkap: parseNumber(row[32]),
        kur_gap_prev: parseNumber(row[33]),
        kur_gap_prev_pct: parseNumber(row[34]) * 100,
        umkm_real_prev_full: parseNumber(row[36]),
        umkm_real_prev_mtd: parseNumber(row[37]),
        umkm_komitmen: parseNumber(row[38]),
        umkm_rkap: parseNumber(row[39]),
        umkm_real_current: parseNumber(row[40]),
        umkm_real_current_mtd: parseNumber(row[41]),
        umkm_pcp_komit: parseNumber(row[42]) * 100,
        umkm_pcp_rkap: parseNumber(row[43]) * 100,
        umkm_gap_komit: parseNumber(row[44]),
        umkm_gap_rkap: parseNumber(row[45]),
        umkm_gap_prev: parseNumber(row[46]),
        umkm_gap_prev_pct: parseNumber(row[47]) * 100
      }
      continue
    }

    // Individual Cabang (simpler structure than kanwil - no Komitmen, RKAP, %Pcp)
    if (/^\d+$/.test(col1) && col2 && col3) {
      // Map kanwil name if needed
      let kanwilName = col3
      if (kanwilNameMap[col3]) {
        kanwilName = kanwilNameMap[col3]
      }
      cabangData.push({
        name: col2,
        kanwil: kanwilName,
        // Correct column mapping based on actual Excel structure
        kumk_real_current: parseNumber(row[8]),      // Real KUMK 1-26 Jan'26
        kur_total_current: parseNumber(row[27]),     // Total KUR 1-26 Jan'26
        umkm_real_current: parseNumber(row[40]),     // Real UMKM 1-26 Jan'26
        // Gaps
        kumk_gap_prev: parseNumber(row[14]),
        kur_gap_prev: parseNumber(row[33]),
        umkm_gap_prev: parseNumber(row[43])
      })
    }
  }

  if (!totalNasional && kanwilData.length > 0) {
    // Calculate total if missing
    totalNasional = {
      kumk_real_current: kanwilData.reduce((sum, k) => sum + (k.kumk_real_current || 0), 0),
      kur_real_current: kanwilData.reduce((sum, k) => sum + (k.kur_real_current || 0), 0),
      umkm_real_current: kanwilData.reduce((sum, k) => sum + (k.umkm_real_current || 0), 0)
    }
  }

  return {
    type: 'realisasi_kredit',
    totalNasional,
    kanwilData,
    cabangData,
    monthInfo: {
      current: currentMonth,
      previous: previousMonth,
      referenceDate: new Date().toISOString()
    },
    parsedAt: new Date().toISOString()
  }
}

function parsePosisiKreditExcel(workbook) {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Search for months in header rows (similar to NPL parser)
  let previousMonth = null
  let currentMonth = null

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '')
      const monthInfo = parseMonthFromHeader(cell)
      if (monthInfo) {
        if (!previousMonth) {
          previousMonth = monthInfo
        } else if (!currentMonth && monthInfo.month !== previousMonth.month) {
          currentMonth = monthInfo
        }
      }
    }
  }

  // Fallback if months not found
  if (!currentMonth) {
    const now = new Date()
    currentMonth = {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      name: getMonthName(now.getMonth()),
      shortName: getMonthShortName(now.getMonth()),
      fullLabel: `${getMonthName(now.getFullYear())} ${now.getFullYear()}`,
      shortLabel: `${getMonthShortName(now.getMonth())} ${now.getFullYear()}`
    }
  }

  if (!previousMonth) {
    const prevDate = new Date()
    prevDate.setMonth(prevDate.getMonth() - 1)
    previousMonth = {
      day: prevDate.getDate(),
      month: prevDate.getMonth(),
      year: prevDate.getFullYear(),
      name: getMonthName(prevDate.getMonth()),
      shortName: getMonthShortName(prevDate.getMonth()),
      fullLabel: `${getMonthName(prevDate.getMonth())} ${prevDate.getFullYear()}`,
      shortLabel: `${getMonthShortName(prevDate.getMonth())} ${prevDate.getFullYear()}`
    }
  }

  const kanwilData = []
  const cabangData = []
  let totalNasional = null
  let inKanwilSection = false

  const dataStartRow = 5

  // Kanwil name mapping for Excel variations
  const kanwilNameMap = {
    'Jatim Bali Nusra': 'Jabanus',
    'Jatim Bali': 'Jabanus',
    'Sumatera 1': 'Sumatera 1',
    'Sumatera 2': 'Sumatera 2'
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 3) continue

    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()
    const col2 = String(row[2] || '').trim()

    // Check if we've entered the kanwil summary section (col1 or col2 has "Wilayah")
    if (!col0 && (col1.toLowerCase().includes('wilayah') || col2.toLowerCase().includes('wilayah'))) {
      inKanwilSection = true
      continue
    }

    // Parse kanwil summary data (separate table at bottom)
    // Kanwil names appear in col1 (and duplicated in col2)
    if (inKanwilSection && !col0 && col1) {
      // Skip "Total" row
      if (col1.toLowerCase() === 'total') {
        totalNasional = {
          posisi_jan: parseNumber(row[5]),
          posisi_des: parseNumber(row[8]),
          realisasi: parseNumber(row[11]),
          runoff: parseNumber(row[14]),
          posisi_current: parseNumber(row[17]),
          gap_mtd: parseNumber(row[20]),
          gap_yoy: parseNumber(row[23])
        }
        continue
      }

      // Map kanwil name if needed (use col1, which has the kanwil name)
      let kanwilName = col1
      if (kanwilNameMap[col1]) {
        kanwilName = kanwilNameMap[col1]
      }

      const kanwilRow = {
        name: kanwilName,
        posisi_jan: parseNumber(row[5]),
        posisi_des: parseNumber(row[8]),
        realisasi: parseNumber(row[11]),
        runoff: parseNumber(row[14]),
        posisi_current: parseNumber(row[17]),
        gap_mtd: parseNumber(row[20]),
        gap_yoy: parseNumber(row[23])
      }
      kanwilData.push(kanwilRow)
      continue
    }

    // Parse cabang data (regular rows with numbers in col0)
    if (/^\d+$/.test(col0) && col1 && col2) {
      // Map kanwil name if needed
      let kanwilName = col2
      if (kanwilNameMap[col2]) {
        kanwilName = kanwilNameMap[col2]
      }

      cabangData.push({
        name: col1,
        kanwil: kanwilName,
        posisi_jan: parseNumber(row[5]),
        posisi_des: parseNumber(row[8]),
        realisasi: parseNumber(row[11]),
        runoff: parseNumber(row[14]),
        posisi_current: parseNumber(row[17]),
        gap_mtd: parseNumber(row[20]),
        gap_yoy: parseNumber(row[23])
      })
    }
  }

  if (!totalNasional && kanwilData.length > 0) {
    totalNasional = {
      posisi_jan: kanwilData.reduce((sum, k) => sum + (k.posisi_jan || 0), 0),
      posisi_des: kanwilData.reduce((sum, k) => sum + (k.posisi_des || 0), 0),
      realisasi: kanwilData.reduce((sum, k) => sum + (k.realisasi || 0), 0),
      runoff: kanwilData.reduce((sum, k) => sum + (k.runoff || 0), 0),
      posisi_current: kanwilData.reduce((sum, k) => sum + (k.posisi_current || 0), 0),
      gap_mtd: kanwilData.reduce((sum, k) => sum + (k.gap_mtd || 0), 0),
      gap_yoy: kanwilData.reduce((sum, k) => sum + (k.gap_yoy || 0), 0)
    }
  }

  return {
    type: 'posisi_kredit',
    totalNasional,
    kanwilData,
    cabangData,
    monthInfo: {
      current: currentMonth,
      previous: previousMonth,
      referenceDate: new Date().toISOString()
    },
    parsedAt: new Date().toISOString()
  }
}

// ============================================
// HELPERS
// ============================================

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const str = String(value).replace(/[^\d.,-]/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function excelDateToJS(serial) {
  const utcDays = Math.floor(serial - 25569)
  return new Date(utcDays * 86400 * 1000)
}

function getMonthName(monthIndex) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[monthIndex] || ''
}

function getMonthShortName(monthIndex) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return months[monthIndex] || ''
}

function calculateTotalNasional(kanwilData) {
  if (!kanwilData || kanwilData.length === 0) {
    return {
      kumk_previous: 0, kumkPercent_previous: 0,
      kur_previous: 0, kurPercent_previous: 0,
      total_previous: 0, totalPercent_previous: 0,
      kumk_current: 0, kumkPercent_current: 0,
      kur_current: 0, kurPercent_current: 0,
      total_current: 0, totalPercent_current: 0,
    }
  }

  const totals = {
    kumk_previous: 0, kur_previous: 0, total_previous: 0,
    kumk_current: 0, kur_current: 0, total_current: 0,
  }

  kanwilData.forEach(k => {
    totals.kumk_previous += k.kumk_previous || 0
    totals.kur_previous += k.kur_previous || 0
    totals.total_previous += k.total_previous || 0
    totals.kumk_current += k.kumk_current || 0
    totals.kur_current += k.kur_current || 0
    totals.total_current += k.total_current || 0
  })

  const count = kanwilData.length

  return {
    kumk_previous: totals.kumk_previous,
    kumkPercent_previous: kanwilData.reduce((sum, k) => sum + (k.kumkPercent_previous || 0), 0) / count,
    kur_previous: totals.kur_previous,
    kurPercent_previous: kanwilData.reduce((sum, k) => sum + (k.kurPercent_previous || 0), 0) / count,
    total_previous: totals.total_previous,
    totalPercent_previous: kanwilData.reduce((sum, k) => sum + (k.totalPercent_previous || 0), 0) / count,
    kumk_current: totals.kumk_current,
    kumkPercent_current: kanwilData.reduce((sum, k) => sum + (k.kumkPercent_current || 0), 0) / count,
    kur_current: totals.kur_current,
    kurPercent_current: kanwilData.reduce((sum, k) => sum + (k.kurPercent_current || 0), 0) / count,
    total_current: totals.total_current,
    totalPercent_current: kanwilData.reduce((sum, k) => sum + (k.totalPercent_current || 0), 0) / count,
  }
}
