Attribute VB_Name = "SeparateSheets"
Option Explicit

'====================================================================
' Separate & Compile Sheets
'====================================================================
' Scans this workbook for 5 target sheets by matching name patterns.
' Confirms findings, then copies them AS-IS into a new .xlsx.
' Sheets are NOT renamed or modified in any way.
'
' How to use:
'   1. Save this workbook as .xlsm (macro-enabled)
'   2. Alt+F8  ->  select "SeparateSheets"  ->  Run
'   3. Confirm the found sheets  ->  compiled file is saved
'====================================================================

Sub SeparateSheets()

    Dim thisWB             As Workbook
    Dim newWB              As Workbook
    Dim fso                As Object
    Dim sheetMapping       As Object

    Dim i                  As Integer
    Dim j                  As Integer
    Dim sheetIdx           As Integer
    Dim foundCount         As Integer

    Dim confirmMsg         As String
    Dim missingList        As String
    Dim outputPath         As String
    Dim outputFile         As String
    Dim baseName           As String
    Dim outName            As String
    Dim shName             As String

    Dim foundTargetNames() As String
    Dim foundSheetNames()  As String
    Dim targetKeys         As Variant
    Dim patterns           As Variant

    Dim matched            As Boolean
    Dim fileSize           As Long

    Set thisWB = ThisWorkbook

    ' ── Define the 5 target sheets & search patterns ─────────────────
    Set sheetMapping = CreateObject("Scripting.Dictionary")
    sheetMapping.Add "NPL",              Array("49c")
    sheetMapping.Add "KOL2",             Array("49b")
    sheetMapping.Add "Realisasi Harian", Array("22a")
    sheetMapping.Add "Realisasi Kredit", Array("44a1")
    sheetMapping.Add "Posisi Kredit",    Array("44b")

    ' ── Scan workbook sheets against patterns ────────────────────────
    targetKeys = sheetMapping.Keys
    ReDim foundTargetNames(0 To sheetMapping.Count - 1)
    ReDim foundSheetNames(0 To sheetMapping.Count - 1)
    foundCount  = 0
    missingList = ""

    For i = 0 To UBound(targetKeys)
        patterns = sheetMapping(targetKeys(i))
        matched  = False

        For sheetIdx = 1 To thisWB.Sheets.Count
            shName = thisWB.Sheets(sheetIdx).Name
            For j = 0 To UBound(patterns)
                If InStr(1, shName, patterns(j), vbTextCompare) = 1 Then
                    foundTargetNames(foundCount) = targetKeys(i)
                    foundSheetNames(foundCount)  = shName
                    foundCount = foundCount + 1
                    matched = True
                    Exit For
                End If
            Next j
            If matched Then Exit For
        Next sheetIdx

        If Not matched Then
            missingList = missingList & "  x  " & targetKeys(i) & vbCrLf
        End If
    Next i

    If foundCount = 0 Then
        MsgBox "No target sheets found in this workbook.", vbInformation, "No Matches"
        Set sheetMapping = Nothing
        Exit Sub
    End If

    ' ── Confirm what was found ───────────────────────────────────────
    confirmMsg = "Source: " & thisWB.Name & vbCrLf & vbCrLf
    confirmMsg = confirmMsg & "Found:" & vbCrLf
    For i = 0 To foundCount - 1
        confirmMsg = confirmMsg & "  " & foundTargetNames(i) & "  (" & foundSheetNames(i) & ")" & vbCrLf
    Next i

    If missingList <> "" Then
        confirmMsg = confirmMsg & vbCrLf & "Not found:" & vbCrLf & missingList
    End If

    confirmMsg = confirmMsg & vbCrLf & "Compile " & foundCount & " sheet(s) into new file?"

    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Compilation") = vbNo Then
        Set sheetMapping = Nothing
        Exit Sub
    End If

    ' ── Build new workbook ───────────────────────────────────────────
    Application.ScreenUpdating = False
    Application.DisplayAlerts  = False
    On Error GoTo ErrHandler

    Set newWB = Workbooks.Add

    ' Trim to 1 placeholder sheet
    Do While newWB.Sheets.Count > 1
        newWB.Sheets(newWB.Sheets.Count).Delete
    Loop
    newWB.Sheets(1).Name = "___placeholder___"

    ' Copy sheets exactly as-is — no rename, no changes
    For i = 0 To foundCount - 1
        thisWB.Sheets(foundSheetNames(i)).Copy After:=newWB.Sheets(newWB.Sheets.Count)
    Next i

    ' Remove placeholder
    newWB.Sheets("___placeholder___").Delete

    ' ── Save ─────────────────────────────────────────────────────────
    outputPath = Environ("USERPROFILE") & "\Downloads\"

    baseName = thisWB.Name
    If InStr(baseName, ".") > 0 Then
        baseName = Left(baseName, InStr(baseName, ".") - 1)
    End If

    outName    = baseName & "_Compiled_" & Format(Now, "YYYY-MM-DD") & ".xlsx"
    outputFile = outputPath & outName

    newWB.SaveAs FileName:=outputFile, FileFormat:=xlOpenXMLWorkbook

    ' ── Done ─────────────────────────────────────────────────────────
    Application.ScreenUpdating = True
    Application.DisplayAlerts  = True

    Set fso = CreateObject("Scripting.FileSystemObject")
    fileSize = fso.GetFile(outputFile).Size

    MsgBox "Compilation complete!" & vbCrLf & vbCrLf & _
           "File:     " & outName & vbCrLf & _
           "Location: " & outputPath & vbCrLf & _
           "Size:     " & Format(fileSize / 1024, "0.00") & " KB" & vbCrLf & _
           "Sheets:   " & foundCount, _
           vbInformation, "Success"

    Shell "explorer.exe /select," & Chr(34) & outputFile & Chr(34), vbNormalFocus

    Set fso          = Nothing
    Set newWB        = Nothing
    Set sheetMapping = Nothing
    Exit Sub

' ── Error handler ────────────────────────────────────────────────────
ErrHandler:
    Application.ScreenUpdating = True
    Application.DisplayAlerts  = True
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "Error"

    On Error Resume Next
    If Not newWB Is Nothing Then
        newWB.Close SaveChanges:=False
    End If
    Set newWB        = Nothing
    Set fso          = Nothing
    Set sheetMapping = Nothing
    On Error GoTo 0
End Sub
