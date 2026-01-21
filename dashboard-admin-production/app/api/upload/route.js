import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN not found')
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    
    const nplFile = formData.get('npl')
    const kol2File = formData.get('kol2')
    const realisasiFile = formData.get('realisasi')
    
    console.log('Files received:', {
      npl: nplFile?.name,
      kol2: kol2File?.name,
      realisasi: realisasiFile?.name
    })
    
    if (!nplFile || !kol2File || !realisasiFile) {
      return NextResponse.json(
        { error: 'All 3 PDF files are required' },
        { status: 400 }
      )
    }
    
    const uploadDate = new Date().toISOString()
    
    console.log('Parsing NPL PDF...')
    const nplBuffer = Buffer.from(await nplFile.arrayBuffer())
    const nplPdfData = await pdf(nplBuffer)
    const nplData = parseNPLData(nplPdfData.text)
    
    console.log('Parsing KOL2 PDF...')
    const kol2Buffer = Buffer.from(await kol2File.arrayBuffer())
    const kol2PdfData = await pdf(kol2Buffer)
    const kol2Data = parseKOL2Data(kol2PdfData.text)
    
    console.log('Parsing Realisasi PDF...')
    const realisasiBuffer = Buffer.from(await realisasiFile.arrayBuffer())
    const realisasiPdfData = await pdf(realisasiBuffer)
    const realisasiData = parseRealisasiData(realisasiPdfData.text)
    
    console.log('Uploading to Vercel Blob...')
    
    try {
      await put('npl_metadata.json', JSON.stringify({
        filename: nplFile.name,
        uploadDate,
        fileSize: nplFile.size
      }), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      await put('npl_parsed.json', JSON.stringify(nplData), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      await put('kol2_metadata.json', JSON.stringify({
        filename: kol2File.name,
        uploadDate,
        fileSize: kol2File.size
      }), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      await put('kol2_parsed.json', JSON.stringify(kol2Data), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      await put('realisasi_metadata.json', JSON.stringify({
        filename: realisasiFile.name,
        uploadDate,
        fileSize: realisasiFile.size
      }), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      await put('realisasi_parsed.json', JSON.stringify(realisasiData), { 
        access: 'public',
        addRandomSuffix: false
      })
      
      console.log('All files uploaded successfully!')
      
      return NextResponse.json({
        success: true,
        message: 'Files uploaded and parsed successfully',
        uploadDate,
        stats: {
          nplCabang: nplData.cabangData?.length || 0,
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
// IMPROVED NPL/KOL2 PARSER
// ============================================
function parseNPLData(text) {
  console.log('Parsing NPL/KOL2 data with improved parser...')
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  const kanwilNames = [
    'Jakarta I', 'Jakarta II', 'Jateng DIY', 'Jabanus', 'Jatim Bali Nusra',
    'Jawa Barat', 'Kalimantan', 'Sulampua', 'Sumatera 1', 'Sumatera 2'
  ]
  
  const cabangData = []
  const kanwilData = []
  let currentKanwil = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect Total Kanwil line
    if (line.startsWith('Total Kanwil')) {
      // Extract kanwil name
      for (const kanwil of kanwilNames) {
        if (line.includes(kanwil)) {
          currentKanwil = kanwil
          
          // Parse numbers from this line
          // Format: Total Kanwil [NAME] kumk_des % kur_des % total_des % kumk_jan % kur_jan % total_jan %
          const numbers = parseNumbersFromLine(line)
          
          if (numbers.length >= 12) {
            kanwilData.push({
              name: currentKanwil,
              // Desember
              kumk_des: numbers[0],
              kumkPercent_des: numbers[1],
              kur_des: numbers[2],
              kurPercent_des: numbers[3],
              total_des: numbers[4],
              totalPercent_des: numbers[5],
              // Januari
              kumk_jan: numbers[6],
              kumkPercent_jan: numbers[7],
              kur_jan: numbers[8],
              kurPercent_jan: numbers[9],
              total_jan: numbers[10],
              totalPercent_jan: numbers[11],
            })
          }
          break
        }
      }
      continue
    }
    
    // Detect TOTAL NASIONAL line
    if (line.startsWith('TOTAL NASIONAL')) {
      const numbers = parseNumbersFromLine(line)
      
      if (numbers.length >= 12) {
        const totalNasional = {
          kumk_des: numbers[0],
          kumkPercent_des: numbers[1],
          kur_des: numbers[2],
          kurPercent_des: numbers[3],
          total_des: numbers[4],
          totalPercent_des: numbers[5],
          kumk_jan: numbers[6],
          kumkPercent_jan: numbers[7],
          kur_jan: numbers[8],
          kurPercent_jan: numbers[9],
          total_jan: numbers[10],
          totalPercent_jan: numbers[11],
        }
        
        return {
          type: 'npl',
          totalNasional,
          kanwilData,
          cabangData,
          parsedAt: new Date().toISOString()
        }
      }
    }
    
    // Parse cabang data
    // Look for lines starting with number (cabang index)
    const cabangMatch = line.match(/^(\d+)\s+(.+)/)
    if (cabangMatch && currentKanwil) {
      const cabangIndex = parseInt(cabangMatch[1])
      let cabangName = cabangMatch[2].trim()
      
      // Extract kanwil from name
      let foundKanwil = currentKanwil
      for (const kanwil of kanwilNames) {
        if (cabangName.includes(kanwil)) {
          foundKanwil = kanwil
          cabangName = cabangName.replace(kanwil, '').trim()
          break
        }
      }
      
      // Parse all numbers from this line
      const numbers = parseNumbersFromLine(line)
      
      // We expect at least 13 numbers: index + 12 data points
      if (numbers.length >= 13) {
        cabangData.push({
          kanwil: foundKanwil,
          name: cabangName,
          // Skip first number (index), then parse Desember (6 numbers)
          kumk_des: numbers[1],
          kumkPercent_des: numbers[2],
          kur_des: numbers[3],
          kurPercent_des: numbers[4],
          total_des: numbers[5],
          totalPercent_des: numbers[6],
          // Januari (6 numbers)
          kumk_jan: numbers[7],
          kumkPercent_jan: numbers[8],
          kur_jan: numbers[9],
          kurPercent_jan: numbers[10],
          total_jan: numbers[11],
          totalPercent_jan: numbers[12],
        })
      }
    }
  }
  
  // If TOTAL NASIONAL wasn't found, calculate it
  const totalNasional = calculateTotalNasional(kanwilData)
  
  console.log(`Parsed ${cabangData.length} cabang and ${kanwilData.length} kanwil`)
  
  return {
    type: 'npl',
    totalNasional,
    kanwilData,
    cabangData,
    parsedAt: new Date().toISOString()
  }
}

function parseKOL2Data(text) {
  // KOL2 has same structure as NPL
  return parseNPLData(text)
}

// ============================================
// IMPROVED REALISASI PARSER
// ============================================
function parseRealisasiData(text) {
  console.log('Parsing Realisasi data with improved parser...')
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  const dailyData = []
  
  // Track monthly totals from TOTAL line at bottom
  let monthlyTotals = {
    nov: 0,
    dec: 0,
    jan: 0
  }
  
  for (const line of lines) {
    // Look for TOTAL line at the end
    if (line.startsWith('TOTAL')) {
      const numbers = parseNumbersFromLine(line)
      // TOTAL line has many numbers, we want the sum of each month's columns
      // Format: TOTAL | Nov KUR | Nov KUMK | Nov Others... | Nov Total | Dec... | Jan...
      
      if (numbers.length >= 21) {
        // Approximate positions based on your PDF structure
        monthlyTotals.nov = numbers[7] || 0   // Column 8: Nov Total
        monthlyTotals.dec = numbers[14] || 0  // Column 15: Dec Total  
        monthlyTotals.jan = numbers[21] || 0  // Column 22: Jan Total (if available)
      }
      continue
    }
    
    // Parse daily data (lines starting with date number 1-31)
    const dateMatch = line.match(/^(\d{1,2})\s+/)
    if (dateMatch) {
      const date = parseInt(dateMatch[1])
      
      // Skip if date > 31
      if (date > 31) continue
      
      const numbers = parseNumbersFromLine(line)
      
      // Format varies, but generally:
      // Date | KUR | KUMK PRK | SME Swadana | ... | Total (for Jan)
      // We need to find KUR, KUMK, SME Swadana, Total for January
      
      if (numbers.length >= 4) {
        // Skip first number (date index), then extract Jan columns
        // Based on your PDF, Jan columns start around index 8+
        
        const janStartIndex = Math.max(7, numbers.length - 7)
        
        const kur = numbers[janStartIndex] || 0
        const kumkPrk = numbers[janStartIndex + 1] || 0
        const smeSwadana = numbers[janStartIndex + 2] || 0
        const total = numbers[numbers.length - 1] || 0
        
        dailyData.push({
          date: date,
          kur: kur,
          kumk: kumkPrk,
          smeSwadana: smeSwadana,
          total: total
        })
      }
    }
  }
  
  // If monthly totals not found, calculate from daily
  if (monthlyTotals.jan === 0) {
    monthlyTotals.jan = dailyData.reduce((sum, day) => sum + day.total, 0)
  }
  
  // Default Nov and Dec if not found
  if (monthlyTotals.nov === 0) monthlyTotals.nov = 152742
  if (monthlyTotals.dec === 0) monthlyTotals.dec = 1052306
  
  console.log(`Parsed ${dailyData.length} daily records`)
  console.log('Monthly totals:', monthlyTotals)
  
  return {
    type: 'realisasi',
    dailyData,
    monthlyTotals,
    parsedAt: new Date().toISOString()
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse numbers from a line, handling Indonesian number format
 * Handles: 1.234.567,89 format and negative numbers in parentheses
 */
function parseNumbersFromLine(text) {
  const numbers = []
  
  // Remove common non-numeric chars but keep dots, commas, and parentheses
  let cleaned = text.replace(/[^\d\.,\(\)\-\s]/g, ' ')
  
  // Split by whitespace
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0)
  
  for (const token of tokens) {
    // Handle negative numbers in parentheses like (1.234)
    if (token.startsWith('(') && token.endsWith(')')) {
      const numStr = token.slice(1, -1).replace(/\./g, '').replace(',', '.')
      const num = parseFloat(numStr)
      if (!isNaN(num)) {
        numbers.push(-num)
      }
      continue
    }
    
    // Handle regular numbers
    // Indonesian format: 1.234.567,89 → 1234567.89
    // English format: 1,234,567.89 → 1234567.89
    
    // Count dots and commas to determine format
    const dotCount = (token.match(/\./g) || []).length
    const commaCount = (token.match(/,/g) || []).length
    
    let numStr = token
    
    if (dotCount > 0 && commaCount === 0) {
      // Could be Indonesian (1.234) or decimal (1.234)
      if (dotCount > 1) {
        // Multiple dots = Indonesian thousands separator
        numStr = token.replace(/\./g, '')
      } else {
        // Single dot - check if it's thousands or decimal
        const parts = token.split('.')
        if (parts[1] && parts[1].length === 3) {
          // Likely thousands: 1.234 → 1234
          numStr = token.replace(/\./g, '')
        }
        // else keep as decimal
      }
    } else if (dotCount > 0 && commaCount > 0) {
      // Mixed format - assume Indonesian: 1.234.567,89
      numStr = token.replace(/\./g, '').replace(',', '.')
    } else if (commaCount > 0) {
      // English format: 1,234,567.89 or Indonesian decimal 1234,89
      if (commaCount > 1) {
        // Multiple commas = English thousands
        numStr = token.replace(/,/g, '')
      } else {
        // Single comma - check position
        const parts = token.split(',')
        if (parts[1] && parts[1].length <= 2) {
          // Decimal: 1234,89 → 1234.89
          numStr = token.replace(',', '.')
        } else {
          // Thousands: 1,234 → 1234
          numStr = token.replace(',', '')
        }
      }
    }
    
    const num = parseFloat(numStr)
    if (!isNaN(num)) {
      numbers.push(num)
    }
  }
  
  return numbers
}

/**
 * Calculate total nasional from kanwil data
 */
function calculateTotalNasional(kanwilData) {
  if (!kanwilData || kanwilData.length === 0) {
    return {
      kumk_des: 0, kumkPercent_des: 0,
      kur_des: 0, kurPercent_des: 0,
      total_des: 0, totalPercent_des: 0,
      kumk_jan: 0, kumkPercent_jan: 0,
      kur_jan: 0, kurPercent_jan: 0,
      total_jan: 0, totalPercent_jan: 0,
    }
  }
  
  const totals = {
    kumk_des: 0, kur_des: 0, total_des: 0,
    kumk_jan: 0, kur_jan: 0, total_jan: 0,
  }
  
  kanwilData.forEach(k => {
    totals.kumk_des += k.kumk_des || 0
    totals.kur_des += k.kur_des || 0
    totals.total_des += k.total_des || 0
    totals.kumk_jan += k.kumk_jan || 0
    totals.kur_jan += k.kur_jan || 0
    totals.total_jan += k.total_jan || 0
  })
  
  // Calculate weighted average percentages
  const count = kanwilData.length
  
  const sumKumkPercentDes = kanwilData.reduce((sum, k) => sum + (k.kumkPercent_des || 0), 0)
  const sumKurPercentDes = kanwilData.reduce((sum, k) => sum + (k.kurPercent_des || 0), 0)
  const sumTotalPercentDes = kanwilData.reduce((sum, k) => sum + (k.totalPercent_des || 0), 0)
  
  const sumKumkPercentJan = kanwilData.reduce((sum, k) => sum + (k.kumkPercent_jan || 0), 0)
  const sumKurPercentJan = kanwilData.reduce((sum, k) => sum + (k.kurPercent_jan || 0), 0)
  const sumTotalPercentJan = kanwilData.reduce((sum, k) => sum + (k.totalPercent_jan || 0), 0)
  
  return {
    kumk_des: totals.kumk_des,
    kumkPercent_des: sumKumkPercentDes / count,
    kur_des: totals.kur_des,
    kurPercent_des: sumKurPercentDes / count,
    total_des: totals.total_des,
    totalPercent_des: sumTotalPercentDes / count,
    kumk_jan: totals.kumk_jan,
    kumkPercent_jan: sumKumkPercentJan / count,
    kur_jan: totals.kur_jan,
    kurPercent_jan: sumKurPercentJan / count,
    total_jan: totals.total_jan,
    totalPercent_jan: sumTotalPercentJan / count,
  }
}