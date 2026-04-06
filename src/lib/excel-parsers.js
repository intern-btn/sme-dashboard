import * as XLSX from 'xlsx'

// ============================================
// MONTH PARSING UTILITIES
// ============================================

export function parseMonthFromHeader(headerText) {
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

// ============================================
// EXCEL PARSERS
// ============================================

export function parseNPLExcel(workbook) {
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

export function parseKOL2Excel(workbook) {
  const result = parseNPLExcel(workbook)
  result.type = 'kol2'
  return result
}

export function parseRealisasiExcel(workbook) {
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
    // Sum all daily values to get monthly totals
    monthlyTotals.current = dailyData.reduce((sum, day) => sum + (day.total || 0), 0)
    monthlyTotals.previous = dailyData.reduce((sum, day) => sum + (day.total_previous || 0), 0)
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

export function parseRealisasiKreditExcel(workbook) {
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

export function parsePosisiKreditExcel(workbook) {
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
// PRK SPBU PARSERS
// ============================================

export function parseIDASforSPBU(workbook) {
  const sheetName = 'Page1_1(2)'
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Corrected: pre-filtered IDAS export (8 fixed columns; header is always row 0)
  // NO | TIPE PRODUK | NO. REKENING | NAMA | BAKI DEBET | PLAFOND | AMTREL | KOL
  const header0 = Array.isArray(data[0]) ? data[0].map((c) => String(c || '').trim().toUpperCase()) : []
  const isPrefilteredIDAS = header0.length >= 8
    && header0[0] === 'NO'
    && header0[1].includes('TIPE')
    && header0[2].includes('REKENING')
    && header0[3] === 'NAMA'
    && header0[4].includes('BAKI')
    && header0[5].includes('PLAF')
    && header0[6].includes('AMTREL')
    && header0[7].includes('KOL')

  if (isPrefilteredIDAS) {
    const rows = []
    const kolBreakdown = { 1: 0, 2: 0, '3+': 0 }

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const noStr = String(row[0] || '').trim()
      if (!noStr || !/^\d+$/.test(noStr)) continue

      const tipeProduk = String(row[1] || '').trim()
      const noRekening = String(row[2] || '').trim()
      const nama = String(row[3] || '').trim()
      const bakiDebet = parseNumber(row[4])
      const plafond = parseNumber(row[5])
      const amtrel = parseNumber(row[6])
      const kol = String(row[7] || '').trim()

      const kolNum = parseInt(String(kol).replace(/[^\d]/g, ''), 10)
      if (!Number.isNaN(kolNum)) {
        if (kolNum <= 1) kolBreakdown[1] += 1
        else if (kolNum === 2) kolBreakdown[2] += 1
        else kolBreakdown['3+'] += 1
      }

      rows.push({
        no: Number(noStr),
        tipeProduk,
        noRekening,
        nama,
        bakiDebet,
        plafond,
        amtrel,
        kol,
      })
    }

    return {
      type: 'prk_spbu',
      idasDate: null,
      rows,
      summary: {
        totalDebitur: rows.length,
        totalBakiDebet: rows.reduce((s, r) => s + (r.bakiDebet || 0), 0),
        totalPlafond: rows.reduce((s, r) => s + (r.plafond || 0), 0),
        totalAmtrel: rows.reduce((s, r) => s + (r.amtrel || 0), 0),
        kolBreakdown,
      },
      parsedAt: new Date().toISOString(),
    }
  }

  const norm = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, ' ')
  const headerRowIndex = data.findIndex((row) => Array.isArray(row) && row.some((c) => norm(c) === 'TIPE PRODUK' || norm(c).includes('TIPE PRODUK')))
  if (headerRowIndex === -1) {
    return {
      type: 'prk_spbu',
      idasDate: null,
      rows: [],
      summary: {
        totalDebitur: 0,
        totalBakiDebet: 0,
        totalPlafond: 0,
        totalAmtrel: 0,
        kolBreakdown: { 1: 0, 2: 0, '3+': 0 },
        nplCount: 0,
        cabangList: [],
      },
      cabangBreakdown: [],
      parsedAt: new Date().toISOString(),
    }
  }

  const headerRow = data[headerRowIndex].map(norm)
  const colIdx = (candidates) => {
    for (const cand of candidates) {
      const idx = headerRow.findIndex((h) => h === cand || h.includes(cand))
      if (idx !== -1) return idx
    }
    return -1
  }

  const idxTanggal = colIdx(['TANGGAL'])
  const idxTipeProduk = colIdx(['TIPE PRODUK'])
  const idxNama = colIdx(['NAMA'])
  const idxNoRek = colIdx(['NO. REKENING', 'NO REKENING', 'NO.REKENING', 'NO REK', 'NO. REK'])
  const idxBakiDebet = colIdx(['BAKI DEBET'])
  const idxPlafond = colIdx(['PLAFOND'])
  const idxAmtrel = colIdx(['AMTREL'])
  const idxKOL = colIdx(['KOL'])
  const idxPlNpl = colIdx(['PL/NPL', 'PL NPL', 'PLNPL'])
  const idxCabang = colIdx(['CABANG'])
  const idxKanwil = colIdx(['KANWIL', 'KANWIL/AREA', 'KANWIL AREA', 'KANWIL / AREA'])
  const idxTunggakan = colIdx(['TUNGGAKAN', 'TUNGGAKAN (RP)', 'TUNGGAKAN RP'])

  const parseDateISO = (value) => {
    if (!value) return null
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().split('T')[0]
    if (typeof value === 'number') {
      const d = excelDateToJS(value)
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
  }

  const PRODUCT_MATCHERS = [
    'B8. KUMK PRK',
    'BZ. KUMK PRK',
    'LL. SME - KMK PRK',
    'M8. SME - KMK PRK SPBU',
    'EY. KUMK KMK PRK SPBU PERTAMINA',
    'K4. PRK - KUR',
  ].map((s) => s.toLowerCase())

  const rows = []
  let idasDate = null

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length === 0) continue

    const tipeProduk = String(row[idxTipeProduk] || '').trim()
    if (!tipeProduk) continue

    const tipeLower = tipeProduk.toLowerCase()
    const isMatch = PRODUCT_MATCHERS.some((m) => tipeLower.includes(m))
    if (!isMatch) continue

    const tanggalISO = idxTanggal !== -1 ? parseDateISO(row[idxTanggal]) : null
    if (!idasDate && tanggalISO) idasDate = tanggalISO

    const bakiDebet = idxBakiDebet !== -1 ? parseNumber(row[idxBakiDebet]) : 0
    const plafond = idxPlafond !== -1 ? parseNumber(row[idxPlafond]) : 0
    const amtrel = idxAmtrel !== -1 ? parseNumber(row[idxAmtrel]) : 0
    const tunggakan = idxTunggakan !== -1 ? parseNumber(row[idxTunggakan]) : 0

    rows.push({
      tanggal: tanggalISO,
      tipeProduk,
      nama: String(row[idxNama] || '').trim(),
      noRekening: String(row[idxNoRek] || '').trim(),
      bakiDebet,
      plafond,
      amtrel,
      kol: String(row[idxKOL] || '').trim(),
      plNpl: String(row[idxPlNpl] || '').trim(),
      cabang: String(row[idxCabang] || '').trim(),
      kanwil: String(row[idxKanwil] || '').trim(),
      tunggakan,
    })
  }

  const kolBreakdown = { 1: 0, 2: 0, '3+': 0 }
  let nplCount = 0
  const cabangSet = new Set()
  const cabangMap = new Map()

  for (const r of rows) {
    const kolNum = parseInt(String(r.kol || '').replace(/[^\d]/g, ''), 10)
    if (!Number.isNaN(kolNum)) {
      if (kolNum <= 1) kolBreakdown[1] += 1
      else if (kolNum === 2) kolBreakdown[2] += 1
      else kolBreakdown['3+'] += 1
    }
    if (String(r.plNpl || '').toUpperCase().includes('NPL')) nplCount += 1

    if (r.cabang) cabangSet.add(r.cabang)
    const key = `${r.cabang}__${r.kanwil}`
    if (!cabangMap.has(key)) {
      cabangMap.set(key, { cabang: r.cabang, kanwil: r.kanwil, count: 0, totalBakiDebet: 0 })
    }
    const item = cabangMap.get(key)
    item.count += 1
    item.totalBakiDebet += r.bakiDebet || 0
  }

  const cabangBreakdown = Array.from(cabangMap.values())
    .sort((a, b) => (b.totalBakiDebet || 0) - (a.totalBakiDebet || 0))

  const summary = {
    totalDebitur: rows.length,
    totalBakiDebet: rows.reduce((s, r) => s + (r.bakiDebet || 0), 0),
    totalPlafond: rows.reduce((s, r) => s + (r.plafond || 0), 0),
    totalAmtrel: rows.reduce((s, r) => s + (r.amtrel || 0), 0),
    kolBreakdown,
    nplCount,
    cabangList: Array.from(cabangSet).sort(),
  }

  return {
    type: 'prk_spbu',
    idasDate,
    rows,
    summary,
    cabangBreakdown,
    parsedAt: new Date().toISOString(),
  }
}

export function parseMonitoringSPBU(workbook) {
  const sheetName = workbook.SheetNames.find((n) => String(n || '').trim().toLowerCase() === 'monitoring spbu')
    || workbook.SheetNames.find((n) => String(n || '').toLowerCase().includes('monitoring spbu'))

  if (!sheetName) {
    return { type: 'prk_spbu_manual', rows: [], parsedAt: new Date().toISOString() }
  }

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Corrected: fixed 3-row header layout (only cols 0–16 are needed), data starts at row 4.
  // Row 1: main header (col 2 "No Debitur", col 3 "Nama")
  // Row 3: sub header (CMS=14, EDC=15, QRIS=16)
  const mainHdr = Array.isArray(data[1]) ? data[1] : null
  const isFixedMaster = !!mainHdr
    && String(mainHdr[2] || '').toLowerCase().includes('debitur')
    && String(mainHdr[3] || '').toLowerCase().includes('nama')

  if (isFixedMaster) {
    const parseDateISO_fixed = (value) => {
      if (!value) return null
      if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().split('T')[0]
      if (typeof value === 'number') {
        const d = excelDateToJS(value)
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
      }
      const d = new Date(String(value))
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }

    const parseBoolFlag_fixed = (value) => {
      const s = String(value || '').trim().toLowerCase()
      return s === 'v' || s === '✓' || s === 'âœ“' || s === 'x' || s === '1' || s === 'ya' || s === 'y' || s === 'yes' || s === 'true'
    }

    const rows = []
    for (let i = 4; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const noStr = String(row[0] || '').trim()
      if (!noStr || !/^\d+$/.test(noStr)) continue

      rows.push({
        no: Number(noStr),
        cabang: String(row[1] || '').trim(),
        noDebitur: String(row[2] || '').trim(),
        nama: String(row[3] || '').trim(),
        produk: String(row[4] || '').trim(),
        telp: String(row[5] || '').trim(),
        tglAkad: parseDateISO_fixed(row[8]),
        tglJatuhTempo: parseDateISO_fixed(row[9]),
        agunan: String(row[10] || '').trim(),
        plafon: parseNumber(row[12]),
        hasCMS: parseBoolFlag_fixed(row[14]),
        hasEDC: parseBoolFlag_fixed(row[15]),
        hasQRIS: parseBoolFlag_fixed(row[16]),
      })
    }

    return { type: 'prk_spbu_manual', rows, parsedAt: new Date().toISOString() }
  }

  const norm = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, ' ')
  const headerRowIndex = data.findIndex((row) => Array.isArray(row) && row.some((c) => ['NAMA', 'CABANG'].includes(norm(c))))
  if (headerRowIndex === -1) {
    return { type: 'prk_spbu_manual', rows: [], parsedAt: new Date().toISOString() }
  }

  const headerRow = data[headerRowIndex].map(norm)
  const colIdx = (candidates) => {
    for (const cand of candidates) {
      const idx = headerRow.findIndex((h) => h === cand || h.includes(cand))
      if (idx !== -1) return idx
    }
    return -1
  }

  const idxNoDebitur = colIdx(['NO DEBITUR', 'NO. DEBITUR', 'NO NASABAH', 'NO. NASABAH'])
  const idxNama = colIdx(['NAMA'])
  const idxCabang = colIdx(['CABANG'])
  const idxPlafon = colIdx(['PLAFON', 'PLAFOND'])
  const idxTglAkad = colIdx(['TGL AKAD', 'TANGGAL AKAD'])
  const idxTglJt = colIdx(['TGL JATUH TEMPO', 'TGL JT TEMPO', 'JATUH TEMPO'])
  const idxAgunan = colIdx(['AGUNAN'])
  const idxCMS = colIdx(['CMS'])
  const idxEDC = colIdx(['EDC'])
  const idxQRIS = colIdx(['QRIS'])

  const parseDateISO = (value) => {
    if (!value) return null
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().split('T')[0]
    if (typeof value === 'number') {
      const d = excelDateToJS(value)
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
  }

  const parseBoolFlag = (value) => {
    const s = String(value || '').trim().toLowerCase()
    return s === 'v' || s === '✓' || s === 'x' || s === '1' || s === 'ya' || s === 'y' || s === 'yes' || s === 'true'
  }

  const rows = []

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length === 0) continue

    const nama = String(row[idxNama] || '').trim()
    const cabang = String(row[idxCabang] || '').trim()
    const noDebitur = idxNoDebitur !== -1 ? String(row[idxNoDebitur] || '').trim() : ''
    const plafon = idxPlafon !== -1 ? parseNumber(row[idxPlafon]) : 0
    const tglAkad = idxTglAkad !== -1 ? parseDateISO(row[idxTglAkad]) : null
    const tglJatuhTempo = idxTglJt !== -1 ? parseDateISO(row[idxTglJt]) : null
    const agunan = idxAgunan !== -1 ? String(row[idxAgunan] || '').trim() : ''
    const hasCMS = idxCMS !== -1 ? parseBoolFlag(row[idxCMS]) : false
    const hasEDC = idxEDC !== -1 ? parseBoolFlag(row[idxEDC]) : false
    const hasQRIS = idxQRIS !== -1 ? parseBoolFlag(row[idxQRIS]) : false

    if (!nama && !noDebitur) continue

    rows.push({
      noDebitur,
      nama,
      cabang,
      plafon,
      tglAkad,
      tglJatuhTempo,
      agunan,
      hasCMS,
      hasEDC,
      hasQRIS,
    })
  }

  return {
    type: 'prk_spbu_manual',
    rows,
    parsedAt: new Date().toISOString(),
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
