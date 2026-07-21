<#
==============================================================================
  Derleyici - HeadsetRepair.ps1 -> tek dosya .exe (ps2exe)
==============================================================================
  Yazan  : Bayram Can Aslan
  Cikti  : frontend/public/tools/DCS-Kulaklik-Onarim.exe

  Kullanim:
      pwsh -ExecutionPolicy Bypass -File .\build.ps1
  veya
      powershell -ExecutionPolicy Bypass -File .\build.ps1

  Not: Kod imzalama (Authenticode) sertifikaniz varsa derlemeden sonra
  signtool ile imzalayin; imzasiz .exe SmartScreen/AV uyarisi verebilir.
==============================================================================
#>

$ErrorActionPreference = 'Stop'

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcPs1     = Join-Path $scriptDir 'HeadsetRepair.ps1'
$outDir     = Resolve-Path (Join-Path $scriptDir '..\..\frontend\public\tools') -ErrorAction SilentlyContinue
if (-not $outDir) {
    $outDir = Join-Path $scriptDir '..\..\frontend\public\tools'
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    $outDir = Resolve-Path $outDir
}
$outExe = Join-Path $outDir 'DCS-Kulaklik-Onarim.exe'

Write-Host "Kaynak : $srcPs1"
Write-Host "Cikti  : $outExe"

# ps2exe modulunu garanti et
if (-not (Get-Module -ListAvailable -Name ps2exe)) {
    Write-Host 'ps2exe modulu kuruluyor (CurrentUser)...' -ForegroundColor Yellow
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
            Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -Scope CurrentUser | Out-Null
        }
        Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber
    } catch {
        throw "ps2exe kurulamadi: $($_.Exception.Message). Elle: Install-Module ps2exe -Scope CurrentUser"
    }
}
Import-Module ps2exe -Force

Invoke-PS2EXE `
    -InputFile  $srcPs1 `
    -OutputFile $outExe `
    -requireAdmin `
    -noConsole:$false `
    -title       'DCS IT Kulaklik Onarim Araci' `
    -product     'DCS IT Helpdesk' `
    -company     'DCS Communication Center' `
    -version     '1.0.0' `
    -copyright   'Bayram Can Aslan'

if (Test-Path $outExe) {
    Write-Host "`nBASARILI: $outExe" -ForegroundColor Green
    Get-Item $outExe | Select-Object Name, Length, LastWriteTime | Format-List
} else {
    throw 'Derleme basarisiz: cikti dosyasi olusmadi.'
}
