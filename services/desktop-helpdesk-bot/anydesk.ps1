param(
    [string]$AnyDeskId = '',

    [Parameter(Mandatory = $true)]
    [ValidateSet('connect', 'disconnect')]
    [string]$Action,

    [string]$AnyDeskExe = "$env:ProgramFiles(x86)\AnyDesk\AnyDesk.exe",
    [int]$ConnectTimeoutSec = 120,
    [string]$Password = $env:ANYDESK_PASSWORD
)

$ErrorActionPreference = 'Stop'

function Resolve-AnyDeskExe {
    param([string]$Preferred)
    if (Test-Path -LiteralPath $Preferred) { return $Preferred }
    $fallback = Join-Path $env:ProgramFiles 'AnyDesk\AnyDesk.exe'
    if (Test-Path -LiteralPath $fallback) { return $fallback }
    throw "AnyDesk bulunamadi: $Preferred"
}

function Test-AnyDeskSession {
    $proc = Get-Process -Name 'AnyDesk' -ErrorAction SilentlyContinue
    return [bool]$proc
}

$exe = Resolve-AnyDeskExe -Preferred $AnyDeskExe
$id = ($AnyDeskId -replace '\D', '')

if ($Action -eq 'connect') {
    if ($id.Length -ne 9) {
        throw "Gecersiz AnyDesk ID: $AnyDeskId"
    }

    $args = @($id)
    if ($Password) {
        $args += @('--with-password', $Password)
    }

    Start-Process -FilePath $exe -ArgumentList $args | Out-Null
    Write-Host "AnyDesk baglanti istegi gonderildi: $id"

    $deadline = (Get-Date).AddSeconds($ConnectTimeoutSec)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        $windows = Get-Process -Name 'AnyDesk' -ErrorAction SilentlyContinue
        if ($windows) {
            Write-Host 'AnyDesk oturumu aktif gorunuyor.'
            exit 0
        }
    }

    Write-Error 'AnyDesk baglantisi zaman asimina ugradi.'
    exit 1
}

if ($Action -eq 'disconnect') {
    Start-Process -FilePath $exe -ArgumentList @('--disconnect') -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Seconds 2
    Write-Host 'AnyDesk baglantisi kesildi.'
    exit 0
}
