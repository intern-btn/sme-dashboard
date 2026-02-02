Attribute VB_Name = "ConsolidateExcelFiles"
Option Explicit

'====================================================================
' SME Dashboard - Excel File Consolidation Macro
'====================================================================
' Purpose: Consolidates 5 separate Excel files into one multi-sheet workbook
' Required files: NPL, KOL2, Realisasi, Realisasi Kredit, Posisi Kredit
' Output: SME_Dashboard_YYYY-MM-DD.xlsx (single file with 5 sheets)
'
' Installation:
' 1. Press Alt+F11 in Excel to open VBA Editor
' 2. Insert > Module
' 3. Copy and paste this entire code
' 4. Press F5 to run, or add to Quick Access Toolbar
'====================================================================

Sub ConsolidateExcelFiles()
    Dim folderPath As String
    Dim outputFileName As String
    Dim newWorkbook As Workbook
    Dim sourceWorkbook As Workbook
    Dim fileDialog As FileDialog
    Dim selectedFolder As String
    Dim files As Object
    Dim fileNames As Object
    Dim sheetMapping As Object
    Dim fileName As Variant
    Dim sheetName As String
    Dim fileFound As Boolean
    Dim missingFiles As String
    Dim foundFiles As String
    Dim totalSize As Long
    Dim i As Integer

    ' Initialize collections
    Set files = CreateObject("Scripting.Dictionary")
    Set fileNames = CreateObject("Scripting.Dictionary")
    Set sheetMapping = CreateObject("Scripting.Dictionary")

    ' Define sheet name mappings based on BTN's Excel structure
    ' Maps target sheet names to patterns found in source files
    sheetMapping.Add "NPL", Array("49c", "NPLKC", "NPL")
    sheetMapping.Add "KOL2", Array("49b", "Kol 2 KC", "KOL2")
    sheetMapping.Add "Realisasi", Array("22a", "Real sub", "Realisasi")
    sheetMapping.Add "Realisasi Kredit", Array("44a1", "Real Komit", "Realisasi Kredit")
    sheetMapping.Add "Posisi Kredit", Array("44b", "Posisi KC", "Posisi Kredit")

    ' Prompt user to select folder
    Set fileDialog = Application.FileDialog(msoFileDialogFolderPicker)
    With fileDialog
        .Title = "Select Folder Containing Excel Files"
        .AllowMultiSelect = False
        If .Show = -1 Then
            selectedFolder = .SelectedItems(1)
        Else
            MsgBox "No folder selected. Operation cancelled.", vbInformation, "Cancelled"
            Exit Sub
        End If
    End With

    ' Ensure folder path ends with backslash
    If Right(selectedFolder, 1) <> "\" Then
        selectedFolder = selectedFolder & "\"
    End If

    ' Turn off screen updating and alerts for better performance
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False

    On Error GoTo ErrorHandler

    ' Scan folder for Excel files and match them to expected types
    Dim fso As Object
    Dim folder As Object
    Dim file As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set folder = fso.GetFolder(selectedFolder)

    For Each file In folder.files
        If LCase(fso.GetExtensionName(file.Name)) = "xlsx" Or _
           LCase(fso.GetExtensionName(file.Name)) = "xls" Then

            ' Check if filename matches any expected patterns
            Dim targetSheet As Variant
            For Each targetSheet In sheetMapping.Keys
                Dim patterns As Variant
                patterns = sheetMapping(targetSheet)

                Dim pattern As Variant
                For Each pattern In patterns
                    If InStr(1, file.Name, pattern, vbTextCompare) > 0 Then
                        If Not files.Exists(targetSheet) Then
                            files.Add targetSheet, file.Path
                            fileNames.Add targetSheet, file.Name
                            totalSize = totalSize + file.Size
                            Exit For
                        End If
                    End If
                Next pattern
            Next targetSheet
        End If
    Next file

    ' Check which files are missing
    missingFiles = ""
    foundFiles = ""
    For Each targetSheet In sheetMapping.Keys
        If files.Exists(targetSheet) Then
            foundFiles = foundFiles & vbCrLf & "  ✓ " & targetSheet & ": " & fileNames(targetSheet)
        Else
            missingFiles = missingFiles & vbCrLf & "  ✗ " & targetSheet
        End If
    Next targetSheet

    ' Show summary and ask for confirmation
    Dim confirmMsg As String
    confirmMsg = "Files Found in: " & selectedFolder & vbCrLf & vbCrLf
    confirmMsg = confirmMsg & "FOUND:" & foundFiles & vbCrLf

    If Len(missingFiles) > 0 Then
        confirmMsg = confirmMsg & vbCrLf & "MISSING:" & missingFiles & vbCrLf & vbCrLf
        confirmMsg = confirmMsg & "Continue with partial consolidation?"
    Else
        confirmMsg = confirmMsg & vbCrLf & "Total size: " & Format(totalSize / 1024 / 1024, "0.00") & " MB" & vbCrLf & vbCrLf
        confirmMsg = confirmMsg & "Proceed with consolidation?"
    End If

    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Consolidation") = vbNo Then
        MsgBox "Operation cancelled by user.", vbInformation, "Cancelled"
        GoTo CleanUp
    End If

    ' Create new workbook for consolidated data
    Set newWorkbook = Workbooks.Add

    ' Remove default sheets except one
    Application.DisplayAlerts = False
    Do While newWorkbook.Worksheets.Count > 1
        newWorkbook.Worksheets(newWorkbook.Worksheets.Count).Delete
    Loop
    Application.DisplayAlerts = True

    ' Process each file type
    Dim sheetIndex As Integer
    sheetIndex = 1

    For Each targetSheet In sheetMapping.Keys
        If files.Exists(targetSheet) Then
            ' Open source workbook
            Set sourceWorkbook = Workbooks.Open(files(targetSheet), ReadOnly:=True)

            ' Copy first sheet to new workbook
            If sheetIndex = 1 Then
                ' For first sheet, just rename it
                sourceWorkbook.Worksheets(1).Copy Before:=newWorkbook.Worksheets(1)
                newWorkbook.Worksheets(1).Name = targetSheet
                Application.DisplayAlerts = False
                newWorkbook.Worksheets(2).Delete ' Delete the default sheet
                Application.DisplayAlerts = True
            Else
                ' For subsequent sheets, add after last sheet
                sourceWorkbook.Worksheets(1).Copy After:=newWorkbook.Worksheets(newWorkbook.Worksheets.Count)
                newWorkbook.Worksheets(newWorkbook.Worksheets.Count).Name = targetSheet
            End If

            ' Close source workbook
            sourceWorkbook.Close SaveChanges:=False
            sheetIndex = sheetIndex + 1
        End If
    Next targetSheet

    ' Generate output filename with current date
    outputFileName = selectedFolder & "SME_Dashboard_" & Format(Date, "yyyy-mm-dd") & ".xlsx"

    ' Save consolidated workbook
    newWorkbook.SaveAs fileName:=outputFileName, FileFormat:=xlOpenXMLWorkbook

    ' Get final file size
    Dim finalSize As Long
    finalSize = fso.GetFile(outputFileName).Size

    ' Close the new workbook
    newWorkbook.Close SaveChanges:=False

    ' Show success message
    MsgBox "Consolidation complete!" & vbCrLf & vbCrLf & _
           "File: " & fso.GetFileName(outputFileName) & vbCrLf & _
           "Location: " & selectedFolder & vbCrLf & _
           "Size: " & Format(finalSize / 1024 / 1024, "0.00") & " MB" & vbCrLf & _
           "Sheets: " & (sheetIndex - 1) & " of 5", _
           vbInformation, "Success"

    ' Open folder in Explorer
    Shell "explorer.exe /select," & Chr(34) & outputFileName & Chr(34), vbNormalFocus

CleanUp:
    ' Restore settings
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True

    ' Clean up objects
    Set newWorkbook = Nothing
    Set sourceWorkbook = Nothing
    Set fileDialog = Nothing
    Set files = Nothing
    Set fileNames = Nothing
    Set sheetMapping = Nothing
    Set fso = Nothing
    Set folder = Nothing
    Set file = Nothing

    Exit Sub

ErrorHandler:
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True

    MsgBox "An error occurred: " & vbCrLf & vbCrLf & _
           "Error " & Err.Number & ": " & Err.Description, _
           vbCritical, "Error"

    ' Clean up
    If Not newWorkbook Is Nothing Then
        newWorkbook.Close SaveChanges:=False
    End If
    If Not sourceWorkbook Is Nothing Then
        sourceWorkbook.Close SaveChanges:=False
    End If

    Resume CleanUp
End Sub

'====================================================================
' INSTALLATION INSTRUCTIONS
'====================================================================
' METHOD 1: Quick Access Toolbar (Recommended)
' 1. Right-click Quick Access Toolbar
' 2. Select "Customize Quick Access Toolbar"
' 3. Choose "Macros" from dropdown
' 4. Select "ConsolidateExcelFiles"
' 5. Click "Add"
' 6. Optional: Click "Modify" to change icon
'
' METHOD 2: Keyboard Shortcut
' 1. Press Alt+F8
' 2. Select "ConsolidateExcelFiles"
' 3. Click "Options"
' 4. Assign shortcut key (e.g., Ctrl+Shift+C)
'
' METHOD 3: Developer Tab Button
' 1. Enable Developer tab: File > Options > Customize Ribbon > Developer
' 2. Click "Insert" > Button (Form Control)
' 3. Draw button on sheet
' 4. Select "ConsolidateExcelFiles" from list
'====================================================================
