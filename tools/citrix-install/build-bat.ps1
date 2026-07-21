<#
==============================================================================
  Uretici - CitrixInstall.ps1 -> tek dosya .cmd
==============================================================================
  Yazan  : Bayram Can Aslan
  Cikti  : tools/citrix-install/DCS-Citrix-Kurulum.cmd

  Neden .cmd?
    Imzasiz .exe indirildiginde Windows SmartScreen "taninmayan uygulama"
    mavi ekranini gosterir. .cmd/.bat dosyalari bu ekrani tetiklemez;
    en fazla standart UAC (yonetici) onayi cikar. Bu yuzden PowerShell
    kodunu tek bir .cmd dosyasinin icine gomuyoruz.

  Kullanim:
      powershell -ExecutionPolicy Bypass -File .\build-bat.ps1
==============================================================================
#>

$ErrorActionPreference = 'Stop'

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ps1 = Get-Content -LiteralPath (Join-Path $dir 'CitrixInstall.ps1') -Raw
$out = Join-Path $dir 'DCS-Citrix-Kurulum.cmd'

# Batch baslatici: yonetici degilse UAC ile yeniden baslar, sonra gomulu
# PowerShell kodunu %TEMP% icine ayiklayip calistirir.
$stub = @'
@echo off
title DCS IT - Citrix Kurulum Araci
:: DCS IT - Otomatik Citrix Workspace Kurulum Araci  ^|  Yazan: Bayram Can Aslan

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "PS1=%TEMP%\DCS-Citrix-Kurulum.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m='###CITRIX'+'_INSTALL_PAYLOAD###'; $raw=Get-Content -LiteralPath '%~f0' -Raw; $i=$raw.IndexOf($m); if($i -ge 0){ Set-Content -LiteralPath (Join-Path $env:TEMP 'DCS-Citrix-Kurulum.ps1') -Value $raw.Substring($i+$m.Length) -Encoding UTF8 }"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
del "%PS1%" >nul 2>&1
exit /b
###CITRIX_INSTALL_PAYLOAD###
'@

$content = ($stub -replace "`r?`n", "`r`n") + "`r`n" + $ps1

# UTF-8 (BOM'suz) yaz - BOM batch dosyasini bozar.
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, $content, $enc)

Write-Host "Olusturuldu: $out" -ForegroundColor Green
Get-Item $out | Select-Object Name, Length, LastWriteTime | Format-List
