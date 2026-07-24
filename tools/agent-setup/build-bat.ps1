<#
==============================================================================
  Uretici - AgentFirstSetup.ps1 -> tek dosya .cmd
==============================================================================
  Yazan  : Bayram Can Aslan
  Cikti  : tools/agent-setup/DCS-Agent-Ilk-Kurulum.cmd

  Kullanim:
      powershell -ExecutionPolicy Bypass -File .\build-bat.ps1
==============================================================================
#>

$ErrorActionPreference = 'Stop'

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ps1 = Get-Content -LiteralPath (Join-Path $dir 'AgentFirstSetup.ps1') -Raw
$out = Join-Path $dir 'DCS-Agent-Ilk-Kurulum.cmd'

$stub = @'
@echo off
title DCS IT - Agent Ilk Kurulum
:: DCS IT - Agent Ilk Kurulum Araci  ^|  Yazan: Bayram Can Aslan
:: Sira: AnyDesk -> Rocket.Chat -> Citrix -> Ses -> CAG / Rocket

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "PS1=%TEMP%\DCS-Agent-Ilk-Kurulum.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m='###AGENT'+'_SETUP_PAYLOAD###'; $raw=Get-Content -LiteralPath '%~f0' -Raw; $i=$raw.IndexOf($m); if($i -ge 0){ Set-Content -LiteralPath (Join-Path $env:TEMP 'DCS-Agent-Ilk-Kurulum.ps1') -Value $raw.Substring($i+$m.Length) -Encoding UTF8 }"
if not exist "%PS1%" (
    echo [X] Kurulum betigi ayiklanamadi.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
set "ERR=%ERRORLEVEL%"
del "%PS1%" >nul 2>&1
if not "%ERR%"=="0" (
    echo.
    echo [X] Kurulum hata ile sonlandi. Kod: %ERR%
    pause
)
exit /b %ERR%
###AGENT_SETUP_PAYLOAD###
'@

$content = ($stub -replace "`r?`n", "`r`n") + "`r`n" + $ps1

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, $content, $enc)

Write-Host "Olusturuldu: $out" -ForegroundColor Green
Get-Item $out | Select-Object Name, Length, LastWriteTime | Format-List
