const XLSX = require('xlsx');

const filePath = "C:/Users/Lenovo/Documents/Ridwan/Intern-BTN/field-test (6. Web Monitor)/ref/idas/IDAS_290326_core.xlsx";

console.log("=== EXCEL FILE INSPECTION (Optimized) ===\n");

console.log("Reading workbook...");
const workbook = XLSX.readFile(filePath, { defval: '' });

// 1. List all sheet names
console.log("\n1. SHEET NAMES:");
console.log(workbook.SheetNames);

// Get the first sheet
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

console.log(`\n2. FIRST SHEET: "${firstSheetName}"`);
console.log(`   Dimensions: ${worksheet['!ref']}`);

// Read with header: 1 mode to get arrays
console.log("\n3. READING DATA (header: 1 mode)...");
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`Total rows: ${data.length}`);

// Show first 5 rows
console.log("\nFirst 5 rows (as arrays):");
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`  Row ${i}: [${data[i].slice(0, 10).map(v => `"${v}"`).join(', ')}${data[i].length > 10 ? '...' : ''}]`);
}

// Find header row
const headerRow = data[0];
console.log(`\n4. HEADER ROW (${headerRow.length} columns):`);
headerRow.forEach((col, idx) => {
  console.log(`  [${idx}] "${col}"`);
});

// Find TIPE PRODUK column
const tipoIndex = headerRow.findIndex(col => String(col).trim() === 'TIPE PRODUK');
console.log(`\n5. TIPE PRODUK column: [${tipoIndex}]`);

// Filter codes
const spbuCodes = [
  'B8. KUMK PRK',
  'BZ. KUMK PRK',
  'LL. SME - KMK PRK',
  'M8. SME - KMK PRK SPBU',
  'EY. KUMK KMK PRK SPBU PERTAMINA',
  'K4. PRK - KUR'
];

console.log(`\nSearching for rows matching SPBU codes...`);
let spbuRows = [];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (row && row[tipoIndex]) {
    const tipo = String(row[tipoIndex]).trim();
    if (spbuCodes.includes(tipo)) {
      spbuRows.push({ rowIndex: i, data: row });
      if (spbuRows.length % 1000 === 0) {
        console.log(`  Found ${spbuRows.length} matches so far...`);
      }
    }
  }
}

console.log(`\n6. TOTAL ROWS MATCHING SPBU FILTER: ${spbuRows.length}`);

// Show samples
console.log(`\nSAMPLE ROWS (first 3 matches):`);
spbuRows.slice(0, 3).forEach((item, idx) => {
  console.log(`\n  Sample ${idx + 1} (row ${item.rowIndex}):`);
  const row = item.data;
  headerRow.forEach((colName, colIdx) => {
    const value = row[colIdx];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      console.log(`    "${colName}": "${value}"`);
    }
  });
});

// Column mapping
const columnsToCheck = [
  'TANGGAL',
  'TIPE PRODUK',
  'NAMA',
  'NO. REKENING',
  'BAKI DEBET',
  'PLAFOND',
  'AMTREL',
  'KOL',
  'PL/NPL',
  'CABANG',
  'KANWIL',
  'Tunggakan'
];

console.log(`\n7. COLUMN MAPPING (exact names):`);
columnsToCheck.forEach(colName => {
  const idx = headerRow.findIndex(h => {
    const headerStr = String(h).trim();
    if (headerStr === colName) return true;
    if (headerStr.toUpperCase() === colName.toUpperCase()) return true;
    return false;
  });
  
  if (idx !== -1) {
    const actualName = headerRow[idx];
    console.log(`  "${colName}" => [${idx}] "${actualName}"`);
    
    if (spbuRows.length > 0) {
      const sampleValue = spbuRows[0].data[idx];
      if (sampleValue !== undefined && sampleValue !== null && String(sampleValue).trim() !== '') {
        console.log(`    Sample: "${sampleValue}"`);
      }
    }
  } else {
    console.log(`  NOT FOUND: "${colName}"`);
  }
});

console.log("\n=== END OF INSPECTION ===");
