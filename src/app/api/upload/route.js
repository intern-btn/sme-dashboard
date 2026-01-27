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

    if (!nplFile || !kol2File || !realisasiFile) {
      return NextResponse.json({ error: 'All 3 Excel files are required' }, { status: 400 })
    }

    const uploadDate = new Date().toISOString()
    const datePrefix = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Parse Excel files
    const nplBuffer = Buffer.from(await nplFile.arrayBuffer())
    const nplWorkbook = XLSX.read(nplBuffer, { type: 'buffer' })
    const nplData = parseNPLExcel(nplWorkbook)

    const kol2Buffer = Buffer.from(await kol2File.arrayBuffer())
    const kol2Workbook = XLSX.read(kol2Buffer, { type: 'buffer' })
    const kol2Data = parseKOL2Excel(kol2Workbook)

    const realisasiBuffer = Buffer.from(await realisasiFile.arrayBuffer())
    const realisasiWorkbook = XLSX.read(realisasiBuffer, { type: 'buffer' })
    const realisasiData = parseRealisasiExcel(realisasiWorkbook)

    const monthInfo = nplData.monthInfo || realisasiData.monthInfo

    try {
      // Upload LATEST versions (for dashboard display)
      console.log('Starting blob uploads...')

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
      console.log('NPL metadata uploaded:', nplMetaResult.url)

      const nplDataResult = await put('npl_parsed.json', JSON.stringify(nplData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
      console.log('NPL data uploaded:', nplDataResult.url)

      const kol2MetaResult = await put('kol2_metadata.json', JSON.stringify({
        filename: kol2File.name,
        uploadDate,
        fileSize: kol2File.size,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
      console.log('KOL2 metadata uploaded:', kol2MetaResult.url)

      const kol2DataResult = await put('kol2_parsed.json', JSON.stringify(kol2Data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
      console.log('KOL2 data uploaded:', kol2DataResult.url)

      const realisasiMetaResult = await put('realisasi_metadata.json', JSON.stringify({
        filename: realisasiFile.name,
        uploadDate,
        fileSize: realisasiFile.size,
        monthInfo
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
      console.log('Realisasi metadata uploaded:', realisasiMetaResult.url)

      const realisasiDataResult = await put('realisasi_parsed.json', JSON.stringify(realisasiData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })
      console.log('Realisasi data uploaded:', realisasiDataResult.url)

      // Upload HISTORICAL versions (with date prefix)
      await put(`history/${datePrefix}_npl.json`, JSON.stringify(nplData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })

      await put(`history/${datePrefix}_kol2.json`, JSON.stringify(kol2Data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })

      await put(`history/${datePrefix}_realisasi.json`, JSON.stringify(realisasiData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      })

      // Update history index
      await put(`history/${datePrefix}_meta.json`, JSON.stringify({
        uploadDate,
        monthInfo,
        files: [nplFile.name, kol2File.name, realisasiFile.name]
      }), { access: 'public', addRandomSuffix: false, allowOverwrite: true })

      // Update consolidated history index
      const blobBaseUrl = process.env.BLOB_BASE_URL || 'https://srcabmhmmkl5ishw.public.blob.vercel-storage.com'
      let historyIndex = { entries: [] }

      try {
        const existingIndex = await fetch(`${blobBaseUrl}/history_index.json`, { cache: 'no-store' })
        if (existingIndex.ok) {
          historyIndex = await existingIndex.json()
        }
      } catch {
        // Start fresh if no index exists
      }

      // Add new entry (or update if same date exists)
      const existingEntryIndex = historyIndex.entries.findIndex(e => e.datePrefix === datePrefix)
      const newEntry = {
        datePrefix,
        uploadDate,
        monthInfo,
        files: [nplFile.name, kol2File.name, realisasiFile.name]
      }

      if (existingEntryIndex >= 0) {
        historyIndex.entries[existingEntryIndex] = newEntry
      } else {
        historyIndex.entries.push(newEntry)
      }

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
          nplKanwil: nplData.kanwilData?.length || 0,
          nplCabang: nplData.cabangData?.length || 0,
          kol2Kanwil: kol2Data.kanwilData?.length || 0,
          kol2Cabang: kol2Data.cabangData?.length || 0,
          realisasiDays: realisasiData.dailyData?.length || 0
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

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 3) continue

    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()
    const col2 = String(row[2] || '').trim()

    if (col1.toLowerCase().startsWith('total kanwil')) {
      const kanwilName = col1.replace(/total kanwil/i, '').trim()
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
        totalPercent_current: parseNumber(row[14]) * 100
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
        totalPercent_current: parseNumber(row[14]) * 100
      }
      continue
    }

    if (/^\d+$/.test(col0) && col1 && col2) {
      cabangData.push({
        name: col1,
        kanwil: col2,
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
        totalPercent_current: parseNumber(row[14]) * 100
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

  for (let i = 1; i < headerRow.length; i++) {
    const cell = headerRow[i]
    if (typeof cell === 'number' && cell > 40000 && cell < 60000) {
      const date = excelDateToJS(cell)
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

  const dailyData = []
  const monthlyTotals = { previous: 0, current: 0 }

  for (let i = 4; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 2) continue

    const dateCell = row[0]

    if (typeof dateCell === 'number' && dateCell >= 1 && dateCell <= 31) {
      const dayNum = dateCell

      let prevKur = 0, prevKumk = 0, prevSmeSwadana = 0, prevKumkLainnya = 0, prevTotal = 0
      if (previousMonth) {
        const prevStart = previousMonth.startCol
        prevKur = parseNumber(row[prevStart])
        prevKumk = parseNumber(row[prevStart + 1])
        prevSmeSwadana = parseNumber(row[prevStart + 2])
        prevKumkLainnya = parseNumber(row[prevStart + 3])
        prevTotal = parseNumber(row[prevStart + 4])
      }

      let currKur = 0, currKumk = 0, currSmeSwadana = 0, currKumkLainnya = 0, currTotal = 0
      if (currentMonth) {
        const currStart = currentMonth.startCol
        currKur = parseNumber(row[currStart])
        currKumk = parseNumber(row[currStart + 1])
        currSmeSwadana = parseNumber(row[currStart + 2])
        currKumkLainnya = parseNumber(row[currStart + 3])
        currTotal = parseNumber(row[currStart + 4])
      }

      dailyData.push({
        date: dayNum,
        kur: currKur,
        kumk: currKumk,
        smeSwadana: currSmeSwadana,
        kumkLainnya: currKumkLainnya,
        total: currTotal,
        kur_previous: prevKur,
        kumk_previous: prevKumk,
        smeSwadana_previous: prevSmeSwadana,
        kumkLainnya_previous: prevKumkLainnya,
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
