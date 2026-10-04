# Unintended Reply - one-click installer for the LAN community server (Windows).
# Creates: desktop shortcuts, Start-menu folder, "unintended-reply://" URL protocol,
#          and a logon task that keeps the server alive silently.
# Run:     powershell -ExecutionPolicy Bypass -File "%~dp0server\install-one-click.ps1"
# Undo:    powershell -ExecutionPolicy Bypass -File "%~dp0server\install-one-click.ps1" -Uninstall
param([switch]$Uninstall)

$here  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root  = Split-Path -Parent $here
$taskName = 'UnintendedReplyCommunity'
$user     = "$env:USERDOMAIN\$env:USERNAME"
$protoCmd = 'unintended-reply'
$launcher = Join-Path $here 'community-launcher.vbs'
$stopper  = Join-Path $here 'community-stop.vbs'

$desk = [Environment]::GetFolderPath('Desktop')
if (-not $desk -or -not (Test-Path $desk)) { $desk = Join-Path $HOME 'Desktop' }
$startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Unintended Reply'

function Write-IconFile($srcPng, $dstIco) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $bmp = New-Object System.Drawing.Bitmap($srcPng)
        $thumb = New-Object System.Drawing.Bitmap($bmp, 64, 64)
        $icon = [System.Drawing.Icon]::FromHandle($thumb.GetHicon())
        $fs = [System.IO.File]::Open($dstIco, 'Create', 'Write')
        $icon.Save($fs)
        $fs.Close()
        $thumb.Dispose(); $bmp.Dispose()
        if (Test-Path $dstIco) { return $dstIco }
    } catch { }
    return $null
}

$icoPath = Join-Path $here 'community-server.ico'
if (-not (Test-Path $icoPath)) { $icoPath = Write-IconFile (Join-Path $root 'img\logo.png') $icoPath }
if (-not $icoPath) { $icoPath = Join-Path $here 'community-server.ico' }

function Get-Shell() { return New-Object -ComObject WScript.Shell }

function Remove-Shortcut($path) { if (Test-Path $path) { Remove-Item $path -Force } }

if ($Uninstall) {
    Remove-Shortcut (Join-Path $desk 'Unintended Reply Community.lnk')
    Remove-Shortcut (Join-Path $desk 'Stop Community Server.lnk')
    Remove-Shortcut (Join-Path $startMenu 'Unintended Reply Community.lnk')
    Remove-Shortcut (Join-Path $startMenu 'Stop Community Server.lnk')
    Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'Unintended Reply Community Server.vbs') -Force -ErrorAction SilentlyContinue
    if (Test-Path "HKCU:\Software\Classes\$protoCmd") { Remove-Item "HKCU:\Software\Classes\$protoCmd" -Recurse -Force }
    try { Get-NetTCPConnection -LocalPort 8787 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } } catch { }
    Write-Host 'Removed shortcuts, start-up entry and URL protocol. Server stopped.'
    exit 0
}

if (-not (Test-Path $launcher)) { Write-Host "Launcher not found: $launcher" -ForegroundColor Red; exit 1 }

$ws = Get-Shell

function New-Shortcut($path, $target, $cmdArgs, $desc) {
    $dir = Split-Path -Parent $path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $s = $ws.CreateShortcut($path)
    $s.TargetPath  = $target
    $s.Arguments   = [string]$cmdArgs
    $s.WorkingDirectory = $root
    $s.Description = $desc
    if (Test-Path $icoPath) { $s.IconLocation = "$icoPath,0" }
    $s.Save()
}

$wscript = Join-Path $env:SystemRoot 'System32\wscript.exe'
New-Shortcut (Join-Path $desk 'Unintended Reply Community.lnk')      $wscript ('"' + $launcher + '"')      'Start the Unintended Reply LAN community server'
New-Shortcut (Join-Path $desk 'Stop Community Server.lnk')           $wscript ('"' + $stopper + '"')       'Stop the Unintended Reply LAN community server'
New-Shortcut (Join-Path $startMenu 'Unintended Reply Community.lnk') $wscript ('"' + $launcher + '"')      'Start the Unintended Reply LAN community server'
New-Shortcut (Join-Path $startMenu 'Stop Community Server.lnk')      $wscript ('"' + $stopper + '"')       'Stop the Unintended Reply LAN community server'

# --- URL protocol: unintended-reply://start  (lets the web/app page start the server) ---
$protoBase = "HKCU:\Software\Classes\$protoCmd"
New-Item -Path $protoBase -Force | Out-Null
Set-ItemProperty -Path $protoBase -Name '(Default)' -Value 'URL:Unintended Reply Protocol'
New-ItemProperty -Path $protoBase -Name 'URL Protocol' -Value '' -Force | Out-Null
$protoCmdKey = Join-Path $protoBase 'shell\open\command'
New-Item -Path $protoCmdKey -Force | Out-Null
Set-ItemProperty -Path $protoCmdKey -Name '(Default)' -Value ('"' + $wscript + '" "' + $launcher + '" "%1"')

# --- auto start at logon ----------------------------------------------------
# Preferred: a hidden scheduled task running the watchdog.
# Fallback (older machines): a tiny starter script in the Windows Startup folder.
$startup = [Environment]::GetFolderPath('Startup')
$proxy   = Join-Path $startup 'Unintended Reply Community Server.vbs'
Remove-Item $proxy -Force -ErrorAction SilentlyContinue

$nodeExe = 'node'
foreach ($cand in @(
    'node',
    (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'nodejs\node.exe'),
    (Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions\22.22.2-3\node.exe'),
    (Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions\22.12.0\node.exe'))) {
    if ($cand -and (Test-Path $cand)) { $nodeExe = $cand; break }
}
if ($nodeExe -eq 'node') {
    $found = Get-Command node -ErrorAction SilentlyContinue
    if ($found) { $nodeExe = $found.Source }
}
if ($nodeExe -eq 'node' -or -not (Test-Path $nodeExe)) {
    $nodeExe = Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions\22.22.2-3\node.exe'
}

$guard = Join-Path $here 'community-guard.js'
$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Unintended Reply LAN community server (silent, self restarting)</Description>
    <Author>$user</Author>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger><Enabled>true</Enabled><UserId>$user</UserId></LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author"><UserId>$user</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartOnFailure><Interval>PT1M</Interval><Count>3</Count></RestartOnFailure>
    <Hidden>true</Hidden>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec><Command>$nodeExe</Command><Arguments>"$guard" --quiet</Arguments></Exec>
  </Actions>
</Task>
"@

$taskOk = $false
try {
    Register-ScheduledTask -TaskName $taskName -Xml $taskXml -Force -ErrorAction Stop | Out-Null
    $taskOk = $true
} catch {
    Write-Host "Plan A (scheduled task) failed: $($_.Exception.Message)" -ForegroundColor Yellow
}
if (-not $taskOk) {
    $proxyBody = @'
' Unintended Reply - auto-start entry (placed in the Windows Startup folder).
' Runs silently at logon and hands over to the real launcher.
Dim sh, fso, target
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
target = "@@LAUNCHER@@"
If fso.FileExists(target) Then
    sh.Run "wscript.exe """ & target & """ /auto", 0, False
End If
'@
    Set-Content -Path $proxy -Value $proxyBody.Replace('@@LAUNCHER@@', $launcher) -Encoding ASCII
}

Write-Host ''
Write-Host '  Done. You can now start the server from any of these:' -ForegroundColor Green
Write-Host "    Desktop:            $desk\Unintended Reply Community.lnk"
Write-Host "    Start menu:         Unintended Reply"
Write-Host '    In-app button:      Community page > "Start this PC as server"'
Write-Host '    Automatic:          at Windows logon (scheduled task, silent)'
Write-Host ''
