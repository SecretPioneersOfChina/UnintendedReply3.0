' Unintended Reply - stop the LAN Community Server and its silent launcher.
' Double-click it; no window stays open. Safe to run when nothing is running.
Option Explicit

Const PORT = 8787
Const SCRIPT_TAG = "community-launcher.vbs"

Dim sh, fso, q, done, lines, i, j, tok, pid
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
q = Chr(34)
done = 0

' --- 1. kill whatever listens on the port -------------------------------------
Dim tmp, txt, f, wmi, col, proc
tmp = fso.BuildPath(fso.GetSpecialFolder(2), "community-stop.tmp")
sh.Run "cmd /c netstat -ano | findstr /C:" & q & ":" & PORT & " " & q & _
       " | findstr /I LISTENING > " & q & tmp & q, 0, True
txt = ""
If fso.FileExists(tmp) Then
    Set f = fso.OpenTextFile(tmp, 1)
    If Not f.AtEndOfStream Then txt = f.ReadAll
    f.Close
    On Error Resume Next
    fso.DeleteFile tmp, True
    On Error GoTo 0
End If

If Len(txt) > 0 Then
    lines = Split(txt, vbCrLf)
    For i = 0 To UBound(lines)
        If Len(Trim(lines(i))) > 0 Then
            ' netstat rows contain runs of spaces, so grab the last non-empty token
            tok = Split(lines(i))
            pid = ""
            For j = UBound(tok) To 0 Step -1
                If Len(Trim(tok(j))) > 0 Then
                    pid = Trim(tok(j))
                    Exit For
                End If
            Next
            If IsNumeric(pid) Then
                sh.Run "cmd /c taskkill /PID " & pid & " /F >nul 2>nul", 0, True
                done = done + 1
            End If
        End If
    Next
End If

' --- 2. kill every launcher instance (wscript/cscript holding this script) ----
On Error Resume Next
Set wmi = GetObject("winmgmts:\\.\root\cimv2")
If Not wmi Is Nothing Then
    Set col = wmi.ExecQuery("Select ProcessId,CommandLine From Win32_Process " & _
        "Where Name='node.exe' Or Name='wscript.exe' Or Name='cscript.exe'")
    For Each proc In col
        Dim cl : cl = LCase(proc.CommandLine & "")
        If InStr(cl, "community-guard.js") > 0 _
           Or InStr(cl, "community.js") > 0 _
           Or InStr(cl, LCase(SCRIPT_TAG)) > 0 Then
            sh.Run "cmd /c taskkill /PID " & proc.ProcessId & " /F >nul 2>nul", 0, True
            done = done + 1
        End If
    Next
End If
On Error GoTo 0

If done > 0 Then
    MsgBox "Community server stopped." & vbCrLf & vbCrLf & _
           "Double-click the launcher shortcut to start it again.", _
           vbInformation, "Unintended Reply"
Else
    MsgBox "The community server was not running.", vbInformation, "Unintended Reply"
End If

WScript.Quit 0
