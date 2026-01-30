const XLSX = require('xlsx');

const workbook = XLSX.readFile('../ref/xsl/Realisasi_Kredit_260126.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Find Purwokerto row (from Jateng DIY)
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const col2 = String(row[2] || '').trim();
  
  if (col2.toLowerCase().includes('purwokerto')) {
    console.log(`\nFound Purwokerto at row ${i}`);
    console.log('Columns 0-10:');
    for (let j = 0; j <= 10; j++) {
      console.log(`  col[${j}] = ${row[j]}`);
    }
    console.log('\nColumns 11-30:');
    for (let j = 11; j <= 30; j++) {
      console.log(`  col[${j}] = ${row[j]}`);
    }
    console.log('\nColumns 31-50:');
    for (let j = 31; j <= 50; j++) {
      console.log(`  col[${j}] = ${row[j]}`);
    }
    break;
  }
}

// Also show the header row structure
console.log('\n=== HEADER ANALYSIS ===');
for (let i = 0; i < 10; i++) {
  const row = data[i];
  if (row && row.length > 5) {
    console.log(`\nRow ${i}:`);
    console.log(`  Columns 0-3: ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]}`);
    console.log(`  Columns 4-10: ${row[4]} | ${row[5]} | ${row[6]} | ${row[7]} | ${row[8]} | ${row[9]} | ${row[10]}`);
  }
}
