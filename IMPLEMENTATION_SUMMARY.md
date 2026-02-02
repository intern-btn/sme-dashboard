# Multi-Sheet Excel Upload - Implementation Summary

## Implementation Complete

All components of the multi-sheet Excel upload feature have been implemented according to the plan.

---

## Files Created

### 1. **src/lib/excel-parsers.js** (NEW)
Shared parser module containing all Excel parsing functions:
- `parseNPLExcel(workbook)`
- `parseKOL2Excel(workbook)`
- `parseRealisasiExcel(workbook)`
- `parseRealisasiKreditExcel(workbook)`
- `parsePosisiKreditExcel(workbook)`
- Helper functions for month parsing and date conversion

### 2. **src/app/api/upload/token/route.js** (NEW)
Token generation endpoint for client-side uploads:
- Generates signed upload URLs using `@vercel/blob/client`
- Validates Excel file types (.xlsx, .xls)
- Sets 15MB maximum file size
- Returns upload token to client

### 3. **src/app/api/upload/process/route.js** (NEW)
Processing endpoint for multi-sheet Excel:
- Downloads file from Vercel Blob
- Parses multi-sheet workbook using XLSX
- Flexible sheet name matching (handles variations like "NPL", "NPL SME", etc.)
- Processes each sheet with appropriate parser
- Uploads parsed JSON to blob storage
- Updates history index
- Returns stats and missing sheet warnings

### 4. **ConsolidateExcelFiles.bas** (NEW)
VBA macro for Excel file consolidation:
- Interactive folder selection dialog
- Automatic file detection with pattern matching
- Confirmation dialog showing found/missing files
- Creates SME_Dashboard_YYYY-MM-DD.xlsx
- Shows file size and opens Explorer
- Handles partial consolidation (missing files)

---

## Files Modified

### 1. **src/app/api/upload/route.js**
- Removed all parser function definitions
- Added imports from shared `@/lib/excel-parsers` module
- Maintains backward compatibility for separate file uploads

### 2. **src/app/admin/page.js**
- Added `@vercel/blob/client` import for direct uploads
- New state variables:
  - `multiSheetFile` - stores multi-sheet file
  - `uploadMode` - toggles between 'separate' and 'multi'
  - `uploadProgress` - tracks upload progress (0-100)
- New functions:
  - `handleMultiSheetUpload()` - uploads directly to blob, then processes
  - `handleSeparateFilesUpload()` - renamed from `handleUpload`
  - `handleUpload()` - router function that calls appropriate handler
- UI enhancements:
  - Mode toggle buttons (Separate Files / Multi-Sheet)
  - Conditional rendering based on upload mode
  - Multi-sheet file input with size display
  - Progress bar showing upload percentage
  - Enhanced error messages with sheet info

---

## How It Works

### Architecture Flow

#### **Separate Files Mode (Original)**
```
Client → FormData → /api/upload (4.5MB limit) → Parse → Blob Storage
```

#### **Multi-Sheet Mode (NEW)**
```
Client → /api/upload/token → Get signed URL
      ↓
Direct upload to Vercel Blob (bypasses API, up to 15MB)
      ↓
/api/upload/process → Download → Parse → Save results
```

### Sheet Name Matching

The system uses **flexible pattern matching** to identify sheets:
- **NPL**: Matches "NPL", "NPL SME", "NPL_SME", etc.
- **KOL2**: Matches "KOL2", "KOL 2", "Kol2", etc.
- **Realisasi**: Matches "Realisasi", "Realisasi Harian", etc.
- **Realisasi Kredit**: Matches "Realisasi Kredit", "RealisasiKredit", etc.
- **Posisi Kredit**: Matches "Posisi Kredit", "PosisiKredit", etc.

---

## Testing Checklist

### Test 1: Multi-Sheet Upload Success
- [ ] Create Excel with all 5 sheets
- [ ] Upload via multi-sheet mode
- [ ] Verify progress bar shows 0→100%
- [ ] Check success message appears
- [ ] Confirm all data types appear on dashboard
- [ ] Check history shows new entry

### Test 2: Large File (10MB)
- [ ] Create 10MB multi-sheet file
- [ ] Upload successfully
- [ ] Verify no 413 error
- [ ] Processing completes without timeout

### Test 3: Backward Compatibility
- [ ] Upload 5 separate files via "separate mode"
- [ ] Verify original workflow still works
- [ ] Check all files process correctly

### Test 4: Missing Sheets
- [ ] Create multi-sheet with only 3 sheets
- [ ] Upload
- [ ] Verify partial success message
- [ ] Check warning lists missing sheets
- [ ] Confirm available sheets are processed

### Test 5: VBA Script
- [ ] Place 5 files in folder
- [ ] Run macro (Alt+F8 → ConsolidateExcelFiles)
- [ ] Verify consolidation succeeds
- [ ] Check file name format: SME_Dashboard_YYYY-MM-DD.xlsx
- [ ] Confirm all sheets are present and correctly named

### Test 6: VBA - Missing Files
- [ ] Place only 3 files in folder
- [ ] Run macro
- [ ] Verify warning dialog shows missing files
- [ ] Choose to continue
- [ ] Check partial consolidation completes

### Test 7: File Size Validation
- [ ] Try to upload file > 15MB
- [ ] Verify client-side error message
- [ ] Confirm upload is blocked

### Test 8: Invalid File Type
- [ ] Try to upload non-Excel file (.pdf, .txt)
- [ ] Verify error message
- [ ] Confirm upload is rejected

---

## User Workflows

### Option A: Division Uses VBA Script (Recommended)
1. Division creates 5 Excel files as usual
2. Places all files in one folder
3. Runs VBA macro `ConsolidateExcelFiles`
   - Press Alt+F8, select macro, click Run
4. Macro creates `SME_Dashboard_YYYY-MM-DD.xlsx`
5. Upload single file to web app using **Multi-Sheet** mode

### Option B: Manual Multi-Sheet Creation
1. Division manually creates Excel with 5 sheets
2. Upload to web app using **Multi-Sheet** mode

### Option C: Keep Current Workflow
1. Upload 5 separate files using **Separate Files** mode
2. Works for files < 4.5MB total (original workflow)

---

## VBA Macro Installation

### Method 1: Quick Access Toolbar (Recommended)
1. Open Excel
2. Right-click Quick Access Toolbar
3. Select "Customize Quick Access Toolbar"
4. Choose "Macros" from dropdown
5. Select "ConsolidateExcelFiles"
6. Click "Add"

### Method 2: Import Module
1. Open Excel, press Alt+F11 (VBA Editor)
2. File → Import File
3. Select `ConsolidateExcelFiles.bas`
4. Press F5 to run, or create button

### Method 3: Copy Code Directly
1. Open Excel, press Alt+F11
2. Insert → Module
3. Copy entire code from `ConsolidateExcelFiles.bas`
4. Paste into module
5. Press F5 to run

---

## Important Notes

1. **@vercel/blob package**: Already installed (v0.23.0) - no npm install needed
2. **Backward compatibility**: All existing separate file uploads still work
3. **No breaking changes**: Original `/api/upload` endpoint unchanged
4. **File size limits**:
   - Separate files: 4.5MB per request (Vercel limit)
   - Multi-sheet: 15MB (Vercel Blob limit)
5. **Processing timeout**: 60 seconds max for multi-sheet processing

---

## Troubleshooting

### Error: "Only Excel files allowed"
- Ensure file extension is .xlsx or .xls
- Check file is not corrupted

### Error: "File too large"
- Multi-sheet mode: Max 15MB
- Try compressing images in Excel or removing unused data

### Error: "Sheet not found"
- Check sheet names match expected patterns
- Sheet names are case-insensitive
- Use VBA script for automatic naming

### Upload stuck at 0%
- Check internet connection
- Verify Vercel Blob storage is configured
- Check browser console for errors

### VBA macro not found
- Ensure macro security is not blocking
- Go to File → Options → Trust Center → Macro Settings
- Select "Enable all macros" (or "Disable with notification")

---

## Expected Results

### Success Response (Multi-Sheet)
```json
{
  "success": true,
  "message": "Successfully parsed 5 sheet(s) (NPL, KOL2, Realisasi, Realisasi Kredit, Posisi Kredit)",
  "parsedSheets": ["NPL", "KOL2", "Realisasi", "Realisasi Kredit", "Posisi Kredit"],
  "missingSheets": [],
  "stats": {
    "nplKanwil": 10,
    "nplCabang": 150,
    "kol2Kanwil": 10,
    "kol2Cabang": 150,
    "realisasiDays": 26,
    "realisasiKreditKanwil": 10,
    "realisasiKreditCabang": 150,
    "posisiKreditKanwil": 10,
    "posisiKreditCabang": 150
  }
}
```

### Partial Success (Missing Sheets)
```json
{
  "success": true,
  "message": "Successfully parsed 3 sheet(s) (NPL, KOL2, Realisasi)",
  "parsedSheets": ["NPL", "KOL2", "Realisasi"],
  "missingSheets": ["Realisasi Kredit", "Posisi Kredit"]
}
```

---

## Benefits

✅ Upload single multi-sheet file instead of 5 separate files
✅ Bypasses 4.5MB API limit (direct upload to blob storage)
✅ Shows upload progress to user
✅ Maintains backward compatibility
✅ Includes VBA automation for easy consolidation
✅ Flexible sheet name matching
✅ Better error messages with detailed feedback

---

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify all environment variables are set (BLOB_READ_WRITE_TOKEN)
3. Test with smaller file first
4. Ensure Excel file is not password-protected
