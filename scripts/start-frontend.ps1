$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location $frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "npm paketleri kuruluyor..."
    npm install
}

Write-Host "Frontend baslatiliyor: http://localhost:3000"
npm start
