$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host 'Python bagimliliklari kuruluyor...'
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m playwright install chromium

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host '.env olusturuldu. Lutfen BOT_DISPLAY_NAME ve HEADSET_REPAIR_PS1_URL degerlerini guncelleyin.'
}

New-Item -ItemType Directory -Force -Path 'data\logs' | Out-Null

Write-Host ''
Write-Host 'Kurulum tamam.'
Write-Host '1) .\start-chrome.ps1'
Write-Host '2) Rocket.Chat bot hesabi ile giris yap'
Write-Host '3) python bot.py'
