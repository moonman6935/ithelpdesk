$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$venvPython = Join-Path $backend "venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Virtual environment bulunamadi. Olusturuluyor..."
    $py = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
    if (-not (Test-Path $py)) { $py = "python" }
    Set-Location $backend
    & $py -m venv venv
    & $venvPython -m pip install --upgrade pip
    & "$backend\venv\Scripts\pip.exe" install fastapi uvicorn motor python-dotenv "bcrypt==4.1.3" python-jose python-multipart pydantic email-validator
}

if (-not (Test-Path (Join-Path $backend ".env"))) {
    Copy-Item (Join-Path $backend ".env.example") (Join-Path $backend ".env")
    Write-Host ".env dosyasi .env.example'dan olusturuldu."
}

$mongoRunning = (Test-NetConnection localhost -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $mongoRunning) {
    Write-Host "MongoDB calismiyor. Servis baslatiliyor..."
    try {
        Start-Service MongoDB -ErrorAction Stop
        Start-Sleep -Seconds 3
    } catch {
        Write-Warning "MongoDB servisi baslatilamadi. 'net start MongoDB' komutunu yonetici olarak calistirin."
    }
}

Write-Host "Backend baslatiliyor: http://localhost:8000"
Set-Location $backend
& $venvPython -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
