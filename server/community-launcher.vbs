' Unintended Reply - LAN Community Server launcher (silent)
' Double-click and no black window stays open: it hands over to Node,
' which starts the server, keeps it alive, and opens your browser.
'
' Usage:
'   wscript.exe community-launcher.vbs /auto   <- silent start at logon (no popups)
Option Explicit

Const SCRIPT_TAG = "community-launcher.vbs"

Dim sh, fso, projDir, mode, nodeBin, list, i, rc, extra
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projDir = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

mode = ""
If WScript.Arguments.Count > 0 Then mode = LCase(WScript.Arguments(0))

' --- locate Node.js -------------------------------------------------------
list = Array( _
    "node", _
    fso.BuildPath(projDir, "runtime\node.exe"), _
    "C:\Users\" & sh.ExpandEnvironmentStrings("%USERNAME%") & _
        "\.workbuddy\binaries\node\versions\22.22.2-3\node.exe", _
    "C:\Users\" & sh.ExpandEnvironmentStrings("%USERNAME%") & _
        "\.workbuddy\binaries\node\versions\22.12.0\node.exe", _
    "C:\Program Files\nodejs\node.exe", _
    "C:\Program Files (x86)\nodejs\node.exe")

nodeBin = ""
For i = 0 To UBound(list)
    rc = sh.Run("cmd /c " & Chr(34) & list(i) & Chr(34) & " -v >nul 2>nul", 0, True)
    If rc = 0 Then
        nodeBin = list(i)
        Exit For
    End If
Next

If Len(nodeBin) = 0 Then
    MsgBox "Node.js was not found on this computer, so the server cannot start." & vbCrLf & vbCrLf & _
           "Please install Node.js (https://nodejs.org) and try again.", vbCritical, "Unintended Reply"
    WScript.Quit 1
End If

' --- start the watchdog in a hidden window --------------------------------
If mode = "/auto" Then
    extra = " --quiet"
Else
    extra = " --open"
End If

sh.Run "cmd /c cd /d " & Chr(34) & projDir & Chr(34) & " & " & Chr(34) & nodeBin & Chr(34) & _
       " " & Chr(34) & fso.BuildPath(projDir, "server\community-guard.js") & Chr(34) & extra, 0, False

WScript.Quit 0
