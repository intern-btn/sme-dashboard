# VBA Macro Installation Guide
## ConsolidateExcelFiles - SME Dashboard

---

## Overview

This VBA macro automatically consolidates 5 separate Excel files into a single multi-sheet workbook, making it easier to upload to the SME Dashboard.

**What it does:**
- Prompts you to select a folder containing your Excel files
- Automatically finds and matches files by name
- Copies the first sheet from each file
- Renames sheets to standard names (NPL, KOL2, Realisasi, Realisasi Kredit, Posisi Kredit)
- Creates a consolidated file named `SME_Dashboard_YYYY-MM-DD.xlsx`
- Shows you the final file size and opens the folder

---

## Quick Installation (3 Steps)

### Step 1: Enable Developer Tab (One-time setup)
1. Open Excel
2. Click **File** → **Options**
3. Click **Customize Ribbon**
4. Check the box next to **Developer** on the right side
5. Click **OK**

### Step 2: Import the Macro
1. Open Excel (any workbook or create new one)
2. Click the **Developer** tab
3. Click **Visual Basic** (or press Alt+F11)
4. In VBA Editor: **File** → **Import File**
5. Browse to `ConsolidateExcelFiles.bas`
6. Click **Open**

### Step 3: Run the Macro
1. Press **Alt+F8** (or Developer tab → **Macros**)
2. Select **ConsolidateExcelFiles**
3. Click **Run**

---

## Alternative Installation Methods

### Method A: Quick Access Toolbar (Recommended for Frequent Use)

**Advantage:** One-click access from any Excel file

1. Right-click the Quick Access Toolbar (top-left icons)
2. Select **Customize Quick Access Toolbar**
3. In the dropdown, select **Macros**
4. Find and select **ConsolidateExcelFiles**
5. Click **Add >>**
6. Click **OK**

Now you'll see a button in your Quick Access Toolbar!

**Optional:** Change the button icon
- Click **Modify** before clicking OK
- Choose an icon (e.g., folder or document icon)

### Method B: Keyboard Shortcut

**Advantage:** Fast access via keyboard

1. Press **Alt+F8**
2. Select **ConsolidateExcelFiles**
3. Click **Options**
4. In "Shortcut key", type a letter (e.g., **C**)
   - This creates: **Ctrl+Shift+C**
5. Click **OK**

Now press **Ctrl+Shift+C** anytime to run the macro!

### Method C: Copy Code Manually

**Advantage:** Works without importing file

1. Open the file `ConsolidateExcelFiles.bas` in Notepad
2. Copy all the code (Ctrl+A, Ctrl+C)
3. In Excel, press **Alt+F11** (opens VBA Editor)
4. Click **Insert** → **Module**
5. Paste the code (Ctrl+V)
6. Close VBA Editor
7. Press **Alt+F8** to run

---

## 📝 How to Use

### Step-by-Step Usage

1. **Prepare your files**
   - Place all 5 Excel files in ONE folder
   - File names should contain: NPL, KOL2, Realisasi, Realisasi Kredit, Posisi Kredit
   - Example names:
     - `NPL SME 2026-02-02.xlsx`
     - `Kol 2 Feb 2026.xlsx`
     - `Realisasi Harian.xlsx`
     - `Realisasi Kredit.xlsx`
     - `Posisi Kredit.xlsx`

2. **Run the macro**
   - Use any method from above (Alt+F8, Quick Access, or Shortcut)

3. **Select the folder**
   - A dialog will appear: "Select Folder Containing Excel Files"
   - Browse to your folder
   - Click **Select Folder**

4. **Review and confirm**
   - A confirmation dialog shows:
     - ✓ Files found
     - ✗ Files missing (if any)
     - Total file size
   - Click **Yes** to proceed or **No** to cancel

5. **Done!**
   - The macro creates: `SME_Dashboard_YYYY-MM-DD.xlsx`
   - Windows Explorer opens showing your new file
   - Upload this file to the dashboard using **Multi-Sheet** mode

---

## File Name Patterns (Flexible Matching)

The macro is smart! It recognizes these variations:

| Data Type | Recognized File Names |
|-----------|----------------------|
| NPL | NPL, NPL SME, NPL_SME, npl |
| KOL2 | KOL2, KOL 2, Kol2, kol2 |
| Realisasi | Realisasi, Realisasi Harian, REALISASI |
| Realisasi Kredit | Realisasi Kredit, REALISASI KREDIT, RealisasiKredit |
| Posisi Kredit | Posisi Kredit, POSISI KREDIT, PosisiKredit |

**Tip:** If a file isn't detected, make sure the file name contains one of these keywords.

---

## ⚠️ Troubleshooting

### "Macro not found" or Cannot run macro

**Solution 1: Enable macros**
1. File → Options → Trust Center
2. Click **Trust Center Settings**
3. Click **Macro Settings**
4. Select "Enable all macros" or "Disable with notification"
5. Click OK and restart Excel

**Solution 2: Macro in wrong workbook**
- Macros are workbook-specific
- Re-import the macro or save it in PERSONAL.XLSB (see below)

### "File not found" or Missing files

**Check:**
- All files are in the SAME folder
- File extensions are .xlsx or .xls
- File names contain recognizable keywords (see table above)
- Files are not open in another program

**Partial consolidation:**
- The macro will show which files are missing
- You can choose to continue with partial data
- Missing sheets will be noted in the output

### Macro stops with error

**Common causes:**
- Files are password-protected → Remove password first
- Files are corrupted → Try opening them manually first
- Insufficient disk space → Free up space
- Files are in use → Close all Excel files

---

## 💾 Save Macro Permanently (Optional)

By default, macros are saved in the current workbook. To make the macro available in ALL workbooks:

### Save to Personal Macro Workbook

1. Press **Alt+F11** (VBA Editor)
2. In **Project Explorer**, look for **VBAProject (PERSONAL.XLSB)**
   - If it doesn't exist, record a dummy macro first:
     - Developer → Record Macro
     - Store macro in: **Personal Macro Workbook**
     - Stop recording immediately
3. Import `ConsolidateExcelFiles.bas` into PERSONAL.XLSB
4. Now the macro is available in ALL Excel files!

---

## Customization Options

### Change Output File Name

Edit line in code:
```vba
outputFileName = selectedFolder & "SME_Dashboard_" & Format(Date, "yyyy-mm-dd") & ".xlsx"
```

Change to:
```vba
outputFileName = selectedFolder & "MyCustomName_" & Format(Date, "yyyy-mm-dd") & ".xlsx"
```

### Add More File Types

Add to the `sheetMapping` section:
```vba
sheetMapping.Add "NewSheet", Array("NewSheet", "New Sheet", "newsheet")
```

---

## Support

### Common Questions

**Q: Can I use this on Mac?**
A: Yes! VBA works on Mac Excel, but folder dialogs may look different.

**Q: Will this work with .xls (old format)?**
A: Yes, both .xls and .xlsx are supported.

**Q: Can I consolidate more than 5 files?**
A: Yes, just add more sheet mappings in the code (see Customization).

**Q: Does it delete my original files?**
A: No, it only reads them. Original files are untouched.

**Q: Can I run this without opening Excel?**
A: No, it requires Excel to be open. But you can add it to Quick Access for one-click operation.

---

## Tips for Best Experience

1. **Create a dedicated folder** for your monthly Excel files
2. **Use consistent naming** for easier file detection
3. **Add macro to Quick Access Toolbar** for fastest access
4. **Test with a small file first** to verify everything works
5. **Keep backups** of original files (macro is read-only, but always be safe!)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  SME Dashboard - Quick Reference            │
├─────────────────────────────────────────────┤
│  RUN MACRO:     Alt + F8 → Run              │
│  VBA EDITOR:    Alt + F11                   │
│  SHORTCUTS:     Customize with Alt+F8       │
│                                             │
│  FILES NEEDED:                              │
│    ✓ NPL                                    │
│    ✓ KOL2                                   │
│    ✓ Realisasi                              │
│    ✓ Realisasi Kredit                       │
│    ✓ Posisi Kredit                          │
│                                             │
│  OUTPUT:                                    │
│    SME_Dashboard_YYYY-MM-DD.xlsx            │
│    (All sheets in one file)                 │
└─────────────────────────────────────────────┘
```

---

## Video Tutorial (Optional)

For a visual guide, consider recording a screen capture showing:
1. Importing the macro
2. Placing files in a folder
3. Running the macro
4. Uploading to dashboard

This can be shared with the Division team for easy onboarding.
