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
<#
==============================================================================
  DCS IT - Otomatik Citrix Workspace Kurulum Araci
==============================================================================
  Yazan   : Bayram Can Aslan
  Tarih   : Temmuz 2026
  Amac    : Citrix Workspace uygulamasini kullanici mudahalesi olmadan
            indirip sessizce kurmak.

  Yaptiklari:
    - Citrix'in zaten kurulu olup olmadigini kontrol eder
    - Guncel Citrix Workspace kurulumunu Citrix CDN'inden indirir
      (internet yoksa/engelliyse arac ile ayni klasordeki yerel
       CitrixWorkspaceApp.exe dosyasini kullanir)
    - Sessiz (silent) kurulumu baslatir
    - Kurulumu dogrular ve masaustune bir kurulum raporu (log) birakir

  Parametreler:
    -CheckOnly   Sadece kurulu mu diye bakar, hicbir sey indirmez/kurmaz
    -Force       Zaten kuruluysa bile yeniden kurar
    -AutoYes     Onay sormadan devam eder

  (c) Bayram Can Aslan - DCS Communication Center
==============================================================================
#>

# Imza: Bayram Can Aslan

[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [switch]$Force,
    [switch]$AutoYes
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$script:AppName    = 'DCS IT - Citrix Kurulum Araci'
$script:Version    = '1.0.0'
$script:Author     = 'Bayram Can Aslan'
$script:RocketChat = 'https://rocket.dmc-rz.com'
$script:CdnUrl     = 'https://downloadplugins.citrix.com/Windows/CitrixWorkspaceApp.exe'
$script:LogLines   = New-Object System.Collections.Generic.List[string]

#region ---------- Yardimci ----------
function Write-Log { param([string]$m, [string]$lvl='INFO') $ts=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); $script:LogLines.Add("[$ts][$lvl] $m") }
function Write-Head { param([string]$t) Write-Host ''; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Host " $t" -ForegroundColor Cyan; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Log "== $t ==" }
function Write-Step { param([string]$t) Write-Host "  -> $t" -ForegroundColor Gray; Write-Log $t }
function Write-Ok   { param([string]$t) Write-Host "  [OK] $t" -ForegroundColor Green; Write-Log "OK: $t" }
function Write-Warn2{ param([string]$t) Write-Host "  [!]  $t" -ForegroundColor Yellow; Write-Log "WARN: $t" 'WARN' }
function Write-Err2 { param([string]$t) Write-Host "  [X]  $t" -ForegroundColor Red; Write-Log "ERROR: $t" 'ERROR' }

function Confirm-Step {
    param([string]$q)
    if ($AutoYes) { return $true }
    Write-Host "  ? $q " -ForegroundColor Yellow -NoNewline
    Write-Host '[E/H] ' -ForegroundColor White -NoNewline
    return ((Read-Host) -match '^(e|evet|y|yes|j|ja)$')
}

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Kurulu Citrix Workspace/Receiver surumunu dondurur (yoksa $null)
function Get-CitrixInstall {
    $keys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    foreach ($k in $keys) {
        $found = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue |
                 Where-Object { $_.DisplayName -match 'Citrix Workspace|Citrix Receiver' } |
                 Select-Object -First 1
        if ($found) { return [pscustomobject]@{ Name=$found.DisplayName; Version=$found.DisplayVersion } }
    }
    # Dosya bazli yedek kontrol
    $exe = Join-Path ${env:ProgramFiles(x86)} 'Citrix\ICA Client\wfica32.exe'
    if (Test-Path $exe) { return [pscustomobject]@{ Name='Citrix Workspace (dosya tespiti)'; Version=(Get-Item $exe).VersionInfo.ProductVersion } }
    return $null
}
#endregion

#region ---------- Yonetici yukseltme ----------
if (-not (Test-Admin) -and -not $CheckOnly) {
    Write-Host 'Yonetici haklari gerekiyor, yeniden baslatiliyor (UAC)...' -ForegroundColor Yellow
    try {
        $argList = @('-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"")
        if ($Force)   { $argList += '-Force' }
        if ($AutoYes) { $argList += '-AutoYes' }
        Start-Process -FilePath (Get-Process -Id $PID).Path -Verb RunAs -ArgumentList $argList
        return
    } catch {
        Write-Host 'Yukseltme iptal edildi. Kurulum yapilamayabilir.' -ForegroundColor Yellow
    }
}
#endregion

Clear-Host
Write-Host ''
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Host '  #        DCS IT - CITRIX KURULUM ARACI             #' -ForegroundColor White
Write-Host "  #        Surum $script:Version                             #" -ForegroundColor DarkGray
Write-Host "  #        Gelistiren: $script:Author            #" -ForegroundColor DarkGray
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Log "$script:AppName v$script:Version (Gelistiren: $script:Author) basladi. Admin=$(Test-Admin) CheckOnly=$CheckOnly Force=$Force"

#region 1) Mevcut kurulum kontrolu
Write-Head '1) Mevcut Citrix Kurulumu'
$existing = Get-CitrixInstall
if ($existing) {
    Write-Ok "Zaten kurulu: $($existing.Name) (surum $($existing.Version))"
    if ($CheckOnly) { Write-Host "`n  (Sadece kontrol modu.)`n" -ForegroundColor Yellow }
    if (-not $Force -and -not $CheckOnly) {
        if (-not (Confirm-Step 'Citrix zaten kurulu. Yine de yeniden kurmak/guncellemek ister misiniz?')) {
            Write-Host "`n  Islem iptal edildi. Mevcut kurulum korunuyor." -ForegroundColor Cyan
            $skip = $true
        }
    }
} else {
    Write-Warn2 'Citrix Workspace kurulu degil.'
}
#endregion

if ($CheckOnly) {
    Write-Host "`n  Kontrol tamamlandi. Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
    try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
    return
}

if (-not $skip) {
    #region 2) Kurulum dosyasini hazirla (yerel veya indir)
    Write-Head '2) Kurulum Dosyasi'
    $installer = $null
    $localCopy = Join-Path (Split-Path -Parent $PSCommandPath) 'CitrixWorkspaceApp.exe'
    if (Test-Path $localCopy) {
        Write-Ok "Yerel kurulum dosyasi bulundu: $localCopy"
        $installer = $localCopy
    } else {
        $installer = Join-Path $env:TEMP 'CitrixWorkspaceApp.exe'
        Write-Step "Citrix CDN'inden indiriliyor (birkac dakika surebilir)..."
        Write-Log "Indirme URL: $script:CdnUrl"
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $script:CdnUrl -OutFile $installer -UseBasicParsing -ErrorAction Stop
            $sizeMB = [math]::Round((Get-Item $installer).Length / 1MB, 1)
            Write-Ok "Indirildi ($sizeMB MB): $installer"
        } catch {
            Write-Err2 "Indirme basarisiz: $($_.Exception.Message)"
            Write-Host "`n  Internet/proxy engeli olabilir. Cozum: CitrixWorkspaceApp.exe dosyasini" -ForegroundColor Yellow
            Write-Host '  bu araci ile ayni klasore koyup tekrar calistirin.' -ForegroundColor Yellow
            $installer = $null
        }
    }
    #endregion

    #region 3) Sessiz kurulum
    if ($installer -and (Test-Path $installer)) {
        Write-Head '3) Sessiz Kurulum'
        Write-Step 'Citrix Workspace kuruluyor... (lutfen bekleyin)'
        $args = '/silent /noreboot /AutoUpdateCheck=disabled /EnableCEIP=false'
        Write-Log "Kurulum komutu: `"$installer`" $args"
        try {
            $proc = Start-Process -FilePath $installer -ArgumentList $args -Wait -PassThru -ErrorAction Stop
            $code = $proc.ExitCode
            Write-Log "Kurulum cikis kodu: $code"
            if ($code -eq 0 -or $code -eq 3010) {
                Write-Ok "Kurulum tamamlandi (cikis kodu: $code)."
                if ($code -eq 3010) { Write-Warn2 'Kurulumun tamamlanmasi icin yeniden baslatma gerekiyor.' }
            } else {
                Write-Err2 "Kurulum beklenmeyen kod dondurdu: $code"
            }
        } catch {
            Write-Err2 "Kurulum calistirilamadi: $($_.Exception.Message)"
        }
    }
    #endregion

    #region 4) Dogrulama
    Write-Head '4) Dogrulama'
    Start-Sleep -Seconds 2
    $after = Get-CitrixInstall
    if ($after) {
        Write-Ok "Citrix Workspace kurulu: $($after.Name) (surum $($after.Version))"
    } else {
        Write-Err2 'Kurulum dogrulanamadi. Lutfen bilgisayari yeniden baslatip tekrar deneyin veya IT ile iletisime gecin.'
    }
    #endregion
}

#region Rapor
Write-Head 'RAPOR'
$logPath = Join-Path ([Environment]::GetFolderPath('Desktop')) ("DCS-Citrix-Kurulum-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
try {
    $head = @(
        "$script:AppName v$script:Version",
        "Gelistiren : $script:Author",
        "Tarih      : $(Get-Date)",
        "Bilgisayar : $env:COMPUTERNAME",
        "Kullanici  : $env:USERNAME",
        ('-' * 50),
        'AYRINTILI GUNLUK:'
    ) -join "`r`n"
    ($head + "`r`n" + ($script:LogLines -join "`r`n")) | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host "  Rapor kaydedildi: $logPath" -ForegroundColor Cyan
} catch { Write-Warn2 "Rapor yazilamadi: $($_.Exception.Message)" }

Write-Host "`n  Sorun devam ederse Rocket.Chat: $script:RocketChat" -ForegroundColor Gray
Write-Host "`n  Islem tamamlandi. Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
#endregion

# ==============================================================================
#  Son. Kod: Bayram Can Aslan (DCS Communication Center) - Temmuz 2026
# ==============================================================================
