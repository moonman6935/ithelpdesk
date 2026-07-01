$root = Split-Path -Parent $PSScriptRoot

Write-Host "IT Helpdesk gelistirme ortami baslatiliyor..."
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Admin giris: admin / admin123"
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-File", (Join-Path $PSScriptRoot "start-backend.ps1")
Start-Sleep -Seconds 4
Start-Process powershell -ArgumentList "-NoExit", "-File", (Join-Path $PSScriptRoot "start-frontend.ps1")
