const XLSX = require('xlsx');
const path = require('path');

const filePath = "C:/Users/Lenovo/Documents/Ridwan/Intern-BTN/field-test (6. Web Monitor)/ref/idas/IDAS_290326_core.xlsx";

console.log("=== EXCEL FILE INSPECTION ===\n");

// Read the workbook
const workbook = XLSX.readFile(filePath);

// 1. List all sheet names
console.log("1. SHEET NAMES:");
console.log(workbook.SheetNames);
console.log();

// Get the first sheet
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

console.log(`2. FIRST SHEET: "${firstSheetName}"\n`);

// Read with header: 1 mode to get arrays
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Show first 5 rows as raw arrays
console.log("3. FIRST 5 ROWS (as arrays):");
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`Row ${i}: `, data[i]);
}
console.log();

// 4. Find header row and column names
console.log("4. COLUMN NAMES AND INDICES:");
let headerRowIndex = -1;
let headerRow = null;

// Search for header row - look for 'TIPE PRODUK', 'NAMA', 'BAKI DEBET', etc.
const headerIndicators = ['TIPE PRODUK', 'NAMA', 'BAKI DEBET', 'KOL'];

for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  if (row && row.some(cell => headerIndicators.some(indicator => String(cell).includes(indicator)))) {
    headerRowIndex = i;
    headerRow = row;
    break;
  }
}

if (headerRow) {
  console.log(`Header found at row ${headerRowIndex}:`);
  headerRow.forEach((col, idx) => {
    console.log(`  [${idx}] "${col}"`);
  });
} else {
  console.log("Header not found in first 10 rows, assuming row 0 is header");
  headerRow = data[0];
  headerRowIndex = 0;
  headerRow.forEach((col, idx) => {
    console.log(`  [${idx}] "${col}"`);
  });
}
console.log();

// 5. Filter PRK SPBU codes
const spbuCodes = [
  'B8. KUMK PRK',
  'BZ. KUMK PRK',
  'LL. SME - KMK PRK',
  'M8. SME - KMK PRK SPBU',
  'EY. KUMK KMK PRK SPBU PERTAMINA',
  'K4. PRK - KUR'
];

// Find the column index for TIPE PRODUK
const tipoIndex = headerRow.findIndex(col => String(col).trim() === 'TIPE PRODUK');
console.log(`5. TIPE PRODUK column index: ${tipoIndex}`);

let spbuRows = [];
for (let i = headerRowIndex + 1; i < data.length; i++) {
  const row = data[i];
  if (row && row[tipoIndex]) {
    const tipo = String(row[tipoIndex]).trim();
    if (spbuCodes.includes(tipo)) {
      spbuRows.push({ rowIndex: i, data: row });
    }
  }
}

console.log(`\nTotal rows matching SPBU filter: ${spbuRows.length}`);
console.log(`\n6. SAMPLE ROWS WITH SPBU FILTER (first 3):`);
spbuRows.slice(0, 3).forEach((item, idx) => {
  console.log(`\nSample ${idx + 1} (row ${item.rowIndex}):`);
  const row = item.data;
  headerRow.forEach((colName, colIdx) => {
    const value = row[colIdx];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      console.log(`  "${colName}": ${typeof value === 'string' ? `"${value}"` : value}`);
    }
  });
});

// 7. Show exact column names and sample values
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

console.log("\n7. COLUMN MAPPING (exact names and indices):");
columnsToCheck.forEach(colName => {
  const idx = headerRow.findIndex(h => {
    const headerStr = String(h).trim();
    // Try exact match first
    if (headerStr === colName) return true;
    // Try case-insensitive match
    if (headerStr.toUpperCase() === colName.toUpperCase()) return true;
    // Try partial match
    if (headerStr.includes(colName)) return true;
    return false;
  });
  
  if (idx !== -1) {
    const actualName = headerRow[idx];
    console.log(`  FOUND: "${colName}" => [${idx}] "${actualName}"`);
    
    // Get sample value from first SPBU row
    if (spbuRows.length > 0) {
      const sampleValue = spbuRows[0].data[idx];
      if (sampleValue !== undefined && sampleValue !== null) {
        console.log(`    Sample: ${typeof sampleValue === 'string' ? `"${sampleValue}"` : sampleValue}`);
      }
    }
  } else {
    console.log(`  NOT FOUND: "${colName}"`);
  }
});

console.log("\n=== END OF INSPECTION ===");
