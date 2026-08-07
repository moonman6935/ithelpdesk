param(
    [Parameter(Mandatory = $true)]
    [string]$HeadsetRepairPs1Url,

    [int]$DelayBeforeStartSec = 8,
    [int]$RepairWaitSec = 90
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

function Focus-AnyDeskWindow {
    $proc = Get-Process -Name 'AnyDesk' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $proc) {
        throw 'AnyDesk penceresi bulunamadi.'
    }

    Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

    [Win32]::ShowWindow($proc.MainWindowHandle, 9) | Out-Null
    [Win32]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 700
}

Write-Host "Uzak oturum icin $DelayBeforeStartSec sn bekleniyor..."
Start-Sleep -Seconds $DelayBeforeStartSec

Focus-AnyDeskWindow

# Uzak masaustune Win+R ile komut calistir
$remoteCmd = @"
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { `$p = Join-Path `$env:TEMP 'DCS-HeadsetRepair.ps1'; Invoke-WebRequest -UseBasicParsing -Uri '$HeadsetRepairPs1Url' -OutFile `$p; powershell -NoProfile -ExecutionPolicy Bypass -File `$p -AutoYes }"
"@

Write-Host 'Uzak PCde kulaklik onarim komutu gonderiliyor...'
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait('^r')
Start-Sleep -Milliseconds 600
[System.Windows.Forms.SendKeys]::SendWait($remoteCmd)
Start-Sleep -Milliseconds 400
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')

Write-Host "Onarim tamamlanmasi icin $RepairWaitSec sn bekleniyor..."
Start-Sleep -Seconds $RepairWaitSec
Write-Host 'Uzak onarim adimi bitti.'
