<#
==============================================================================
  Uretici - AgentFirstSetup.ps1 + UiStrings.ps1 -> dillere gore .cmd
==============================================================================
  Yazan  : Bayram Can Aslan
  Cikti  :
    tools/agent-setup/DCS-Agent-Ilk-Kurulum.cmd          (varsayilan: de)
    tools/agent-setup/DCS-Agent-Ilk-Kurulum-{lang}.cmd
    frontend/public/tools/ ayni dosyalar

  Kullanim:
      powershell -ExecutionPolicy Bypass -File .\build-bat.ps1
==============================================================================
#>

$ErrorActionPreference = 'Stop'

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent $dir)
$publicTools = Join-Path $repoRoot 'frontend\public\tools'

$utf8 = New-Object System.Text.UTF8Encoding($false)
$ps1 = [System.IO.File]::ReadAllText((Join-Path $dir 'AgentFirstSetup.ps1'), $utf8)
$ui  = [System.IO.File]::ReadAllText((Join-Path $dir 'UiStrings.ps1'), $utf8)
$langs = @('tr', 'de', 'en', 'fr', 'ka')

function New-AgentCmd {
    param([string]$Lang, [string]$OutPath)

    # Embed AFTER param() — PowerShell forbids statements before [CmdletBinding()]/param
    $payloadPs1 = $ps1.Replace('###BUNDLED_LANG###', $Lang).Replace('###EMBED_UI_STRINGS###', $ui.TrimEnd())

    $stub = @"
@echo off
title DCS IT - Agent Setup [$Lang]
:: DCS IT - Agent Ilk Kurulum Araci ($Lang)  ^|  Yazan: Bayram Can Aslan
:: Sira: AnyDesk -> Rocket.Chat -> Citrix -> Ses -> CAG / Rocket

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "PS1=%TEMP%\DCS-Agent-Ilk-Kurulum-$Lang.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "`$m='###AGENT'+'_SETUP_PAYLOAD###'; `$raw=Get-Content -LiteralPath '%~f0' -Raw -Encoding UTF8; `$i=`$raw.IndexOf(`$m); if(`$i -ge 0){ Set-Content -LiteralPath (Join-Path `$env:TEMP 'DCS-Agent-Ilk-Kurulum-$Lang.ps1') -Value `$raw.Substring(`$i+`$m.Length) -Encoding UTF8 }"
if not exist "%PS1%" (
    echo [X] Setup script extract failed.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -Lang $Lang
set "ERR=%ERRORLEVEL%"
del "%PS1%" >nul 2>&1
if not "%ERR%"=="0" (
    echo.
    echo [X] Setup ended with error. Code: %ERR%
    pause
)
exit /b %ERR%
###AGENT_SETUP_PAYLOAD###
"@

    $content = ($stub -replace "`r?`n", "`r`n") + "`r`n" + $payloadPs1
    # UTF-8 BOM so PowerShell 5.1 parses non-ASCII UI strings correctly
    $enc = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($OutPath, $content, $enc)
    Write-Host "OK $OutPath ($((Get-Item $OutPath).Length) bytes)" -ForegroundColor Green
}

if (-not (Test-Path $publicTools)) { New-Item -ItemType Directory -Path $publicTools -Force | Out-Null }

foreach ($lang in $langs) {
    $name = "DCS-Agent-Ilk-Kurulum-$lang.cmd"
    $out1 = Join-Path $dir $name
    $out2 = Join-Path $publicTools $name
    New-AgentCmd -Lang $lang -OutPath $out1
    Copy-Item -LiteralPath $out1 -Destination $out2 -Force
}

# Default download name (German = site default)
$default = Join-Path $dir 'DCS-Agent-Ilk-Kurulum.cmd'
Copy-Item (Join-Path $dir 'DCS-Agent-Ilk-Kurulum-de.cmd') $default -Force
Copy-Item $default (Join-Path $publicTools 'DCS-Agent-Ilk-Kurulum.cmd') -Force
Write-Host "Default -> de" -ForegroundColor Cyan
