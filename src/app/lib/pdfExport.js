import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const BTN_BLUE = '#003d7a'
const BTN_ORANGE = '#e84e0f'

// Format number to Indonesian locale
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0)
const formatPercent = (n) => `${(n || 0).toFixed(2)}%`

// Generate timestamp for export
const getTimestamp = () => {
  const now = new Date()
  return now.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Sanitize filename
const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Core PDF export function
 */
export function exportTableToPDF({
  title,
  subtitle,
  headers,
  data,
  fileName,
  orientation = 'landscape',
  columnStyles = {}
}) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(0, 61, 122) // BTN Blue
  doc.rect(0, 0, pageWidth, 25, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 19)

  // Timestamp on right
  const timestamp = `Diekspor: ${getTimestamp()}`
  doc.setFontSize(8)
  doc.text(timestamp, pageWidth - 14, 19, { align: 'right' })

  // Table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 30,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 61, 122],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: columnStyles,
    margin: { top: 30, left: 10, right: 10 },
    didDrawPage: function (data) {
      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
      doc.text(
        'Generated from SME Dashboard - BTN',
        pageWidth - 10,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      )
    }
  })

  doc.save(fileName)
}

// ==================== NPL Formatters ====================

export function formatNPLKanwilData(kanwilData, monthInfo) {
  const headers = ['No', 'Kanwil', 'KUMK (Jt)', 'KUMK %', 'KUR (Jt)', 'KUR %', 'Total (Jt)', 'Total %']

  const data = kanwilData.map((k, i) => [
    i + 1,
    k.name,
    formatNumber(k.kumk_current || 0),
    formatPercent(k.kumkPercent_current),
    formatNumber(k.kur_current || 0),
    formatPercent(k.kurPercent_current),
    formatNumber(k.total_current || 0),
    formatPercent(k.totalPercent_current)
  ])

  const period = monthInfo?.current?.fullLabel || 'Current'
  return {
    title: 'LAPORAN NPL PER KANWIL',
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `NPL_Kanwil_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 45 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 30 },
      7: { halign: 'right', cellWidth: 25 }
    }
  }
}

export function formatNPLCabangData(cabangData, kanwilName, monthInfo) {
  const headers = ['No', 'Cabang', 'NPL (Jt)', '%', 'Gap', 'KUMK (Jt)', '%', 'Gap', 'KUR (Jt)', '%', 'Gap']

  const sortedCabang = [...cabangData].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const data = sortedCabang.map((c, i) => {
    const gapTotal = c.gap_total || 0
    const gapKumk = c.gap_kumk || 0
    const gapKur = c.gap_kur || 0

    return [
      i + 1,
      c.name,
      formatNumber(c.total_current || 0),
      formatPercent(c.totalPercent_current),
      gapTotal !== 0 ? (gapTotal > 0 ? '+ ' : '- ') + formatNumber(Math.abs(gapTotal)) : '-',
      formatNumber(c.kumk_current || 0),
      formatPercent(c.kumkPercent_current),
      gapKumk !== 0 ? (gapKumk > 0 ? '+ ' : '- ') + formatNumber(Math.abs(gapKumk)) : '-',
      formatNumber(c.kur_current || 0),
      formatPercent(c.kurPercent_current),
      gapKur !== 0 ? (gapKur > 0 ? '+ ' : '- ') + formatNumber(Math.abs(gapKur)) : '-'
    ]
  })

  const period = monthInfo?.current?.fullLabel || 'Current'
  const sanitizedKanwil = sanitizeFileName(kanwilName)

  return {
    title: `LAPORAN NPL CABANG - KANWIL ${kanwilName.toUpperCase()}`,
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `NPL_Cabang_${sanitizedKanwil}_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 22 },
      9: { halign: 'right', cellWidth: 18 },
      10: { halign: 'right', cellWidth: 22 }
    }
  }
}

// ==================== KOL2 Formatters ====================

export function formatKOL2KanwilData(kanwilData, monthInfo) {
  const headers = ['No', 'Kanwil', 'KUMK (Jt)', 'KUMK %', 'KUR (Jt)', 'KUR %', 'Total (Jt)', 'Total %']

  const data = kanwilData.map((k, i) => [
    i + 1,
    k.name,
    formatNumber(k.kumk_current || 0),
    formatPercent(k.kumkPercent_current),
    formatNumber(k.kur_current || 0),
    formatPercent(k.kurPercent_current),
    formatNumber(k.total_current || 0),
    formatPercent(k.totalPercent_current)
  ])

  const period = monthInfo?.current?.fullLabel || 'Current'
  return {
    title: 'LAPORAN KOL 2 PER KANWIL',
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `KOL2_Kanwil_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 45 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 30 },
      7: { halign: 'right', cellWidth: 25 }
    }
  }
}

export function formatKOL2CabangData(cabangData, kanwilName, monthInfo) {
  const headers = ['No', 'Cabang', 'KOL 2 (Jt)', '%', 'KUMK (Jt)', '%', 'KUR (Jt)', '%']

  const sortedCabang = [...cabangData].sort((a, b) => (b.total_current || 0) - (a.total_current || 0))

  const data = sortedCabang.map((c, i) => [
    i + 1,
    c.name,
    formatNumber(c.total_current || 0),
    formatPercent(c.totalPercent_current),
    formatNumber(c.kumk_current || 0),
    formatPercent(c.kumkPercent_current),
    formatNumber(c.kur_current || 0),
    formatPercent(c.kurPercent_current)
  ])

  const period = monthInfo?.current?.fullLabel || 'Current'
  const sanitizedKanwil = sanitizeFileName(kanwilName)

  return {
    title: `LAPORAN KOL 2 CABANG - KANWIL ${kanwilName.toUpperCase()}`,
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `KOL2_Cabang_${sanitizedKanwil}_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 30 },
      7: { halign: 'right', cellWidth: 25 }
    }
  }
}

// ==================== Realisasi Kredit Formatters ====================

export function formatRealisasiKreditKanwilData(kanwilData, monthInfo) {
  const headers = ['No', 'Kanwil', 'KUMK (Jt)', 'KUR (Jt)', 'UMKM (Jt)', 'Total (Jt)', '% Vs. RKAP']

  const data = kanwilData.map((k, i) => {
    const totalRealisasi = (k.kumk_real_current || 0) + (k.kur_total_current || 0) + (k.umkm_real_current || 0)
    const avgPcpRkap = ((k.kumk_pcp_rkap || 0) + (k.kur_pcp_rkap || 0) + (k.umkm_pcp_rkap || 0)) / 3

    return [
      i + 1,
      k.name,
      formatNumber(k.kumk_real_current || 0),
      formatNumber(k.kur_total_current || 0),
      formatNumber(k.umkm_real_current || 0),
      formatNumber(totalRealisasi),
      `${avgPcpRkap.toFixed(1)}%`
    ]
  })

  const period = monthInfo?.current?.fullLabel || 'Current'
  return {
    title: 'LAPORAN REALISASI KREDIT PER KANWIL',
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `RealisasiKredit_Kanwil_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 35 },
      6: { halign: 'right', cellWidth: 30 }
    }
  }
}

export function formatRealisasiKreditCabangData(cabangData, kanwilName, monthInfo) {
  const headers = ['No', 'Cabang', 'KUMK (Jt)', 'KUR (Jt)', 'UMKM (Jt)', 'Total (Jt)', 'Gap (Jt)']

  const sortedCabang = [...cabangData].sort((a, b) => (b.kumk_real_current || 0) - (a.kumk_real_current || 0))

  const data = sortedCabang.map((c, i) => {
    const totalRealisasi = (c.kumk_real_current || 0) + (c.kur_total_current || 0) + (c.umkm_real_current || 0)
    const totalGap = (c.kumk_gap_prev || 0) + (c.kur_gap_prev || 0) + (c.umkm_gap_prev || 0)

    return [
      i + 1,
      c.name,
      formatNumber(c.kumk_real_current || 0),
      formatNumber(c.kur_total_current || 0),
      formatNumber(c.umkm_real_current || 0),
      formatNumber(totalRealisasi),
      formatNumber(totalGap)
    ]
  })

  const period = monthInfo?.current?.fullLabel || 'Current'
  const sanitizedKanwil = sanitizeFileName(kanwilName)

  return {
    title: `LAPORAN REALISASI KREDIT CABANG - KANWIL ${kanwilName.toUpperCase()}`,
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `RealisasiKredit_Cabang_${sanitizedKanwil}_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 55 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 35 },
      6: { halign: 'right', cellWidth: 30 }
    }
  }
}

// ==================== Posisi Kredit Formatters ====================

export function formatPosisiKreditKanwilData(kanwilData, monthInfo) {
  const headers = ['No', 'Kanwil', 'Posisi Jan (Jt)', 'Realisasi (Jt)', 'Run Off (Jt)', 'Posisi Current (Jt)', 'Gap MTD (Jt)', 'Gap YoY (Jt)']

  const data = kanwilData.map((k, i) => [
    i + 1,
    k.name,
    formatNumber(k.posisi_jan || 0),
    formatNumber(k.realisasi || 0),
    formatNumber(k.runoff || 0),
    formatNumber(k.posisi_current || 0),
    formatNumber(k.gap_mtd || 0),
    formatNumber(k.gap_yoy || 0)
  ])

  const period = monthInfo?.current?.fullLabel || 'Current'
  return {
    title: 'LAPORAN POSISI KREDIT PER KANWIL',
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `PosisiKredit_Kanwil_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 35 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', cellWidth: 28 }
    }
  }
}

export function formatPosisiKreditCabangData(cabangData, kanwilName, monthInfo) {
  const headers = ['No', 'Cabang', 'Posisi Awal (Jt)', 'Posisi Current (Jt)', 'Gap MTD (Jt)', 'Gap YoY (Jt)']

  const sortedCabang = [...cabangData].sort((a, b) => (b.posisi_current || 0) - (a.posisi_current || 0))

  const data = sortedCabang.map((c, i) => [
    i + 1,
    c.name,
    formatNumber(c.posisi_jan || 0),
    formatNumber(c.posisi_current || 0),
    formatNumber(c.gap_mtd || 0),
    formatNumber(c.gap_yoy || 0)
  ])

  const period = monthInfo?.current?.fullLabel || 'Current'
  const sanitizedKanwil = sanitizeFileName(kanwilName)

  return {
    title: `LAPORAN POSISI KREDIT CABANG - KANWIL ${kanwilName.toUpperCase()}`,
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `PosisiKredit_Cabang_${sanitizedKanwil}_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 45 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 35 }
    }
  }
}

// ==================== Realisasi Daily Formatter ====================

export function formatRealisasiDailyData(dailyData, monthInfo) {
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num || 0)
  }

  const headers = ['Tanggal', 'KUR', 'KUMK PRK', 'SME Swadana', 'KUMK Lainnya', 'KPP Supply', 'KPP Demand', 'Total', 'Trend']

  const data = dailyData.map((day, idx) => {
    const prevDay = idx > 0 ? dailyData[idx - 1] : null
    const diff = prevDay ? day.total - prevDay.total : 0
    let trend = '-'
    if (idx > 0) {
      if (diff > 0) trend = `+ ${formatCurrency(Math.abs(diff))}`
      else if (diff < 0) trend = `- ${formatCurrency(Math.abs(diff))}`
    }

    return [
      `${day.date} ${monthInfo?.current?.shortName || ''}`,
      formatCurrency(day.kur),
      formatCurrency(day.kumk),
      formatCurrency(day.smeSwadana),
      formatCurrency(day.kumkLainnya || 0),
      formatCurrency(day.kppSupply || 0),
      formatCurrency(day.kppDemand || 0),
      formatCurrency(day.total),
      trend
    ]
  })

  const period = monthInfo?.current?.fullLabel || 'Current'
  return {
    title: 'LAPORAN REALISASI KREDIT HARIAN',
    subtitle: `Periode: ${period}`,
    headers,
    data,
    fileName: `Realisasi_Harian_${monthInfo?.current?.shortName || 'Data'}_${monthInfo?.current?.year || new Date().getFullYear()}.pdf`,
    columnStyles: {
      0: { halign: 'left', cellWidth: 25 },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 25 },
      8: { halign: 'center', cellWidth: 30 }
    }
  }
}
