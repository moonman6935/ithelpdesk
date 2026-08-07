$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfileDir = Join-Path $Root 'chrome-profile'
$Port = 9222

$chromeCandidates = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chrome = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chrome) {
    throw 'Google Chrome bulunamadi.'
}

New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

$channelUrl = 'https://rocket.dmc-rz.com/channel/IT_Helpdesk'
Write-Host "Chrome baslatiliyor (remote debugging port $Port)..."
Write-Host "Profil: $ProfileDir"
Write-Host "Acilacak kanal: $channelUrl"

Start-Process -FilePath $chrome -ArgumentList @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    $channelUrl
)

Write-Host 'Chrome acildi. Bot kullanicisi ile giris yapip kanali acik birakin.'
