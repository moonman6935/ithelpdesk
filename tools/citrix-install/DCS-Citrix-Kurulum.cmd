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
  Amac    : Citrix Workspace'i mumkun olan her bilgisayarda, net ilerleme
            ve acik hata mesajlariyla indirip sessizce kurmak.

  Yaptiklari:
    - Kurulu surumu kontrol eder
    - Birden fazla CDN / indirme yontemini dener (WebClient, BITS, curl)
    - Indirme sirasinda yuzdelik ilerleme gosterir
    - Bozuk/eksik dosyayi tespit edip yeniden dener
    - Sessiz kurulum yapar, sonuc kodunu aciklar
    - Masaustune detayli log birakir

  Parametreler:
    -CheckOnly   Sadece kurulu mu diye bakar
    -Force       Kuruluysa bile yeniden kurar
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
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls } catch {}

$script:AppName    = 'DCS IT - Citrix Kurulum Araci'
$script:Version    = '1.1.1'
$script:Author     = 'Bayram Can Aslan'
$script:RocketChat = 'https://rocket.dmc-rz.com'
$script:LogLines   = New-Object System.Collections.Generic.List[string]
$script:FatalError = $null
$script:MinInstallerBytes = 80MB   # gercek paket ~400MB+; 80MB alti bozuk kabul
$script:DownloadUrls = @(
    'https://downloadplugins.citrix.com/Windows/CitrixWorkspaceApp.exe',
    'https://downloadplugins.citrix.com/ReceiverUpdates/Prod/Receiver/Win/CitrixWorkspaceApp.exe'
)

#region ---------- Yardimci ----------
function Write-Log { param([string]$m, [string]$lvl='INFO') $ts=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); $script:LogLines.Add("[$ts][$lvl] $m") }
function Write-Head { param([string]$t) Write-Host ''; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Host " $t" -ForegroundColor Cyan; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Log "== $t ==" }
function Write-Step { param([string]$t) Write-Host "  -> $t" -ForegroundColor Gray; Write-Log $t }
function Write-Ok   { param([string]$t) Write-Host "  [OK] $t" -ForegroundColor Green; Write-Log "OK: $t" }
function Write-Warn2{ param([string]$t) Write-Host "  [!]  $t" -ForegroundColor Yellow; Write-Log "WARN: $t" 'WARN' }
function Write-Err2 { param([string]$t) Write-Host "  [X]  $t" -ForegroundColor Red; Write-Log "ERROR: $t" 'ERROR'; $script:FatalError = $t }

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
    $exe = Join-Path ${env:ProgramFiles(x86)} 'Citrix\ICA Client\wfica32.exe'
    if (Test-Path $exe) {
        return [pscustomobject]@{ Name='Citrix Workspace (dosya tespiti)'; Version=(Get-Item $exe).VersionInfo.ProductVersion }
    }
    return $null
}

function Format-Bytes {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) { return ('{0:N2} GB' -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ('{0:N1} MB' -f ($Bytes / 1MB)) }
    if ($Bytes -ge 1KB) { return ('{0:N0} KB' -f ($Bytes / 1KB)) }
    return "$Bytes B"
}

function Show-ProgressLine {
    param(
        [int]$Percent,
        [string]$Label = 'Indiriliyor',
        [long]$Received = -1,
        [long]$Total = -1
    )
    if ($Percent -lt 0) { $Percent = 0 }
    if ($Percent -gt 100) { $Percent = 100 }
    $barWidth = 28
    $filled = [math]::Floor($barWidth * $Percent / 100)
    $empty = $barWidth - $filled
    $bar = ('#' * $filled) + ('-' * $empty)
    $sizePart = ''
    if ($Received -ge 0 -and $Total -gt 0) {
        $sizePart = "  $(Format-Bytes $Received) / $(Format-Bytes $Total)"
    } elseif ($Received -ge 0) {
        $sizePart = "  $(Format-Bytes $Received)"
    }
    $line = ("  {0}: [{1}] {2,3}%{3}" -f $Label, $bar, $Percent, $sizePart)
    Write-Host ("`r" + $line.PadRight(78)) -NoNewline
}

function Test-InstallerFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    try {
        $item = Get-Item -LiteralPath $Path -ErrorAction Stop
        if ($item.Length -lt $script:MinInstallerBytes) { return $false }
        # PE/EXE imza baslangici (MZ)
        $fs = [System.IO.File]::OpenRead($Path)
        try {
            $b1 = $fs.ReadByte(); $b2 = $fs.ReadByte()
            if ($b1 -ne 0x4D -or $b2 -ne 0x5A) { return $false } # 'MZ'
        } finally { $fs.Close() }
        return $true
    } catch { return $false }
}

function Get-InstallExitMeaning {
    param([int]$Code)
    switch ($Code) {
        0     { 'Basarili' }
        3010  { 'Basarili - yeniden baslatma gerekli' }
        1602  { 'Kullanici kurulumu iptal etti' }
        1603  { 'Kurulum sirasinda kritik hata' }
        1618  { 'Baska bir kurulum devam ediyor - bekleyip tekrar deneyin' }
        1619  { 'Kurulum paketi acilamadi (bozuk indirme olabilir)' }
        1620  { 'Kurulum paketi gecersiz' }
        1633  { 'Bu platform desteklenmiyor' }
        1638  { 'Daha yeni / ayni surum zaten kurulu' }
        40001 { 'Citrix daha once yonetici tarafindan kurulmus' }
        40002 { 'Onceki kurulum kalintisi var - once kaldirin' }
        40004 { 'Kurulum iptal edildi' }
        40007 { 'Isletim sistemi desteklenmiyor' }
        40008 { 'Daha yeni bir surum mevcut (onerilen)' }
        40017 { 'Kurulum iptal edildi' }
        40026 { 'Surec/surucu durdurulamadi - yeniden baslatin' }
        40027 { 'Citrix guncellemesi devam ediyor - bekleyin' }
        40028 { 'Yonetici izni gerekli' }
        40032 { 'Citrix zaten guncel (yeniden kurulum gerekmedi)' }
        40034 { 'Windows Installer hatasi' }
        40036 { 'Once Citrix HDX RealTime Media Engine kaldirilmali' }
        40037 { 'Kismi basari - zorunlu bilesenler kuruldu' }
        50001 { 'Mevcut kurulum yalnizca yonetici ile guncellenebilir' }
        50002 { 'Desteklenmeyen yukseltme yolu' }
        default { "Bilinmeyen kod ($Code)" }
    }
}

function Test-InstallSuccessCode {
    param([int]$Code)
    # 40032 = ayni surum zaten guncel (Citrix bunu hata gibi dondurur ama basari sayilmali)
    # 40037 = zorunlu bilesenler tamam
    return @(0, 3010, 1638, 40008, 40032, 40037) -contains $Code
}
#endregion

#region ---------- Indirme yontemleri ----------
function Download-WithStream {
    param([string]$Url, [string]$OutFile)

    if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue }

    $req = [System.Net.HttpWebRequest]::Create($Url)
    $req.Method = 'GET'
    $req.UserAgent = 'DCS-IT-Citrix-Installer/1.1'
    $req.AllowAutoRedirect = $true
    $req.Timeout = 60000
    $req.ReadWriteTimeout = 600000

    $resp = $null
    $inStream = $null
    $outStream = $null
    try {
        $resp = $req.GetResponse()
        $total = [int64]$resp.ContentLength
        $inStream = $resp.GetResponseStream()
        $outStream = [System.IO.File]::Create($OutFile)
        $buffer = New-Object byte[] 262144
        $received = [int64]0
        $lastPct = -1
        $lastUi = Get-Date

        while ($true) {
            $read = $inStream.Read($buffer, 0, $buffer.Length)
            if ($read -le 0) { break }
            $outStream.Write($buffer, 0, $read)
            $received += $read

            $now = Get-Date
            $pct = if ($total -gt 0) { [int](100.0 * $received / $total) } else { 0 }
            if ($pct -ne $lastPct -or ($now - $lastUi).TotalMilliseconds -ge 400) {
                $lastPct = $pct
                $lastUi = $now
                if ($total -gt 0) {
                    Show-ProgressLine -Percent $pct -Received $received -Total $total
                } else {
                    Show-ProgressLine -Percent 0 -Label 'Indiriliyor' -Received $received
                }
            }
        }
        Write-Host ''
        if ($received -le 0) { throw 'Sunucudan veri gelmedi (0 byte).' }
        return $true
    } finally {
        if ($outStream) { $outStream.Close() }
        if ($inStream) { $inStream.Close() }
        if ($resp) { $resp.Close() }
    }
}

function Download-WithBits {
    param([string]$Url, [string]$OutFile)
    if (-not (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue)) {
        throw 'BITS bu sistemde yok'
    }
    if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue }
    Write-Step 'BITS ile indiriliyor...'
    $job = Start-BitsTransfer -Source $Url -Destination $OutFile -Asynchronous -DisplayName 'DCS-Citrix-Download' -ErrorAction Stop
    try {
        while ($true) {
            $job = Get-BitsTransfer -Id $job.Id -ErrorAction Stop
            $state = [string]$job.JobState
            if ($state -eq 'Transferred') { break }
            if ($state -eq 'Error') {
                $err = $job.ErrorDescription
                throw ("BITS hata: {0}" -f $err)
            }
            if ($state -eq 'TransientError') {
                Resume-BitsTransfer -BitsJob $job -ErrorAction SilentlyContinue
            }
            $pct = 0
            if ($job.BytesTotal -gt 0) {
                $pct = [int](100 * $job.BytesTransferred / $job.BytesTotal)
                Show-ProgressLine -Percent $pct -Label 'BITS' -Received $job.BytesTransferred -Total $job.BytesTotal
            } else {
                Show-ProgressLine -Percent 0 -Label 'BITS baglaniyor'
            }
            Start-Sleep -Milliseconds 500
        }
        Write-Host ''
        Complete-BitsTransfer -BitsJob $job
        return $true
    } catch {
        try { Remove-BitsTransfer -BitsJob $job -Confirm:$false -ErrorAction SilentlyContinue } catch {}
        throw
    }
}

function Download-WithCurl {
    param([string]$Url, [string]$OutFile)
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) { throw 'curl.exe bulunamadi' }
    if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue }
    Write-Step 'curl ile indiriliyor (ilerleme asagida)...'
    $argList = @(
        '-L', '--fail', '--retry', '3', '--retry-delay', '2',
        '--connect-timeout', '30',
        '-A', 'DCS-IT-Citrix-Installer/1.1',
        '-o', $OutFile,
        $Url
    )
    $p = Start-Process -FilePath $curl.Source -ArgumentList $argList -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { throw "curl cikis kodu: $($p.ExitCode)" }
    return $true
}

function Invoke-RobustDownload {
    param([string]$OutFile)

    $methods = @(
        @{ Name = 'HTTP'; Fn = { param($u,$o) Download-WithStream -Url $u -OutFile $o } },
        @{ Name = 'BITS'; Fn = { param($u,$o) Download-WithBits -Url $u -OutFile $o } },
        @{ Name = 'curl'; Fn = { param($u,$o) Download-WithCurl -Url $u -OutFile $o } }
    )

    $errors = New-Object System.Collections.Generic.List[string]

    foreach ($url in $script:DownloadUrls) {
        Write-Step "Kaynak: $url"
        Write-Log "Indirme denemesi URL: $url"
        foreach ($m in $methods) {
            try {
                Write-Step ("Yontem: {0}" -f $m.Name)
                & $m.Fn $url $OutFile
                if (Test-InstallerFile -Path $OutFile) {
                    $size = (Get-Item -LiteralPath $OutFile).Length
                    Write-Ok ("Indirme tamam ({0}, {1})" -f $m.Name, (Format-Bytes $size))
                    return $true
                }
                $msg = "{0} | dosya bozuk veya cok kucuk" -f $m.Name
                $errors.Add("$msg | $url")
                Write-Warn2 $msg
                Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
            } catch {
                $msg = "{0}: {1}" -f $m.Name, $_.Exception.Message
                $errors.Add("$msg | $url")
                Write-Warn2 $msg
                Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
            }
        }
    }

    Write-Err2 'Citrix kurulum dosyasi indirilemedi.'
    Write-Host ''
    Write-Host '  Denenen yollar ve hatalar:' -ForegroundColor Yellow
    foreach ($e in $errors) { Write-Host "   - $e" -ForegroundColor DarkYellow; Write-Log "FAIL: $e" 'ERROR' }
    Write-Host ''
    Write-Host '  Ne yapabilirsiniz?' -ForegroundColor Cyan
    Write-Host '   1) Internet / proxy baglantinizi kontrol edin' -ForegroundColor Gray
    Write-Host '   2) Antivirusun indirmeyi engellemediginden emin olun' -ForegroundColor Gray
    Write-Host '   3) CitrixWorkspaceApp.exe dosyasini elle indirip' -ForegroundColor Gray
    Write-Host '      bu araci ile AYNI KLASORE koyup tekrar calistirin' -ForegroundColor Gray
    Write-Host '   4) IT ekibine bildirin: ' -NoNewline -ForegroundColor Gray
    Write-Host $script:RocketChat -ForegroundColor White
    return $false
}
#endregion

#region ---------- Yonetici yukseltme ----------
if (-not (Test-Admin) -and -not $CheckOnly) {
    Write-Host 'Yonetici haklari gerekiyor, yeniden baslatiliyor (UAC)...' -ForegroundColor Yellow
    try {
        $argList = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"")
        if ($Force)   { $argList += '-Force' }
        if ($AutoYes) { $argList += '-AutoYes' }
        Start-Process -FilePath (Get-Process -Id $PID).Path -Verb RunAs -ArgumentList $argList | Out-Null
        exit 0
    } catch {
        Write-Err2 'Yonetici yukseltmesi iptal edildi veya basarisiz. Kurulum icin Yonetici izni zorunludur.'
        Write-Host "`n  Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
        try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
        exit 1
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
Write-Log "$script:AppName v$script:Version basladi. Admin=$(Test-Admin) CheckOnly=$CheckOnly Force=$Force OS=$([Environment]::OSVersion.VersionString)"

$skip = $false
$installOk = $false
$reinstall = $false

#region 1) Mevcut kurulum
Write-Head '1) Mevcut Citrix Kurulumu'
try {
    $existing = Get-CitrixInstall
    if ($existing) {
        Write-Ok "Zaten kurulu: $($existing.Name) (surum $($existing.Version))"
        if ($CheckOnly) { Write-Host "`n  (Sadece kontrol modu.)`n" -ForegroundColor Yellow }
        if (-not $Force -and -not $CheckOnly) {
            if (-not (Confirm-Step 'Citrix zaten kurulu. Yine de yeniden kurmak/guncellemek ister misiniz?')) {
                Write-Host "`n  Islem iptal edildi. Mevcut kurulum korunuyor." -ForegroundColor Cyan
                $skip = $true
            } else {
                $reinstall = $true
            }
        } elseif ($Force -and -not $CheckOnly) {
            $reinstall = $true
        }
    } else {
        Write-Warn2 'Citrix Workspace kurulu degil.'
    }
} catch {
    Write-Warn2 "Kurulum kontrolu sirasinda uyari: $($_.Exception.Message)"
}
#endregion

if ($CheckOnly) {
    Write-Host "`n  Kontrol tamamlandi. Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
    try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
    exit 0
}

if (-not $skip) {
    #region 2) Kurulum dosyasi
    Write-Head '2) Kurulum Dosyasi'
    $installer = $null

    $scriptDir = $null
    try { $scriptDir = Split-Path -Parent $PSCommandPath } catch {}
    $localCandidates = @()
    if ($scriptDir) {
        $localCandidates += (Join-Path $scriptDir 'CitrixWorkspaceApp.exe')
        $localCandidates += (Join-Path $scriptDir 'CitrixWorkspaceAppWeb.exe')
    }
    $localCandidates += (Join-Path $env:USERPROFILE 'Downloads\CitrixWorkspaceApp.exe')
    $localCandidates += (Join-Path ([Environment]::GetFolderPath('Desktop')) 'CitrixWorkspaceApp.exe')
    $localCandidates += (Join-Path $env:TEMP 'CitrixWorkspaceApp.exe')
    $localCandidates += (Join-Path $env:TEMP 'DCS-CitrixWorkspaceApp.exe')

    foreach ($cand in $localCandidates) {
        if (Test-InstallerFile -Path $cand) {
            Write-Ok "Yerel kurulum dosyasi kullanilacak: $cand ($(Format-Bytes (Get-Item $cand).Length))"
            $installer = $cand
            break
        }
    }

    if (-not $installer) {
        $installer = Join-Path $env:TEMP 'DCS-CitrixWorkspaceApp.exe'
        Write-Step 'Internetten indirilecek (~400 MB, agina gore 2-15 dk surebilir)...'
        $ok = Invoke-RobustDownload -OutFile $installer
        if (-not $ok) { $installer = $null }
    }
    #endregion

    #region 3) Sessiz kurulum
    if ($installer -and (Test-InstallerFile -Path $installer)) {
        Write-Head '3) Sessiz Kurulum'
        Write-Step 'Citrix Workspace kuruluyor... (5-15 dakika surebilir, pencereyi kapatmayin)'
        $argLine = '/silent /noreboot /AutoUpdateCheck=disabled /EnableCEIP=false /FORCE_LITE_MODE=no'
        # Ayni surumde yeniden kurulum: Citrix 40032 doner; /forceinstall ile temiz yeniden kurulum dener
        if ($reinstall) {
            $argLine += ' /forceinstall'
            Write-Step 'Mevcut kurulum uzerine /forceinstall ile yeniden kuruluyor...'
        }
        Write-Log "Kurulum: `"$installer`" $argLine"

        try {
            # Calisan eski kurulum var mi?
            $blockers = @('CitrixWorkspaceApp','InstallAgent','Installer','TrolleyExpress') |
                ForEach-Object { Get-Process -Name $_ -ErrorAction SilentlyContinue }
            if ($blockers) {
                Write-Warn2 'Baska bir kurulum sureci calisiyor olabilir; yine de denenecek.'
            }

            $proc = Start-Process -FilePath $installer -ArgumentList $argLine -Wait -PassThru -ErrorAction Stop
            $code = 0
            if ($null -ne $proc.ExitCode) { $code = [int]$proc.ExitCode }
            $meaning = Get-InstallExitMeaning -Code $code
            Write-Log "Kurulum cikis kodu: $code ($meaning)"

            if (Test-InstallSuccessCode -Code $code) {
                Write-Ok "Kurulum sonucu: $meaning"
                if ($code -eq 3010) {
                    Write-Warn2 'Yeniden baslatma gerekli. Bilgisayari yeniden baslatin.'
                }
                if ($code -eq 40032) {
                    Write-Ok 'Citrix zaten guncel - ek kurulum yapilmadi (bu bir hata degil).'
                }
                $installOk = $true
                $script:FatalError = $null
            } else {
                Write-Err2 "Kurulum basarisiz: $meaning"
                Write-Host '  Cozum onerileri:' -ForegroundColor Yellow
                Write-Host '   - Bilgisayari yeniden baslatip araci tekrar calistirin' -ForegroundColor Gray
                Write-Host '   - Gecici olarak antivirusu kapatip deneyin' -ForegroundColor Gray
                Write-Host '   - Eski Citrix/Receiver varsa Kaldirin, sonra tekrar deneyin' -ForegroundColor Gray
                Write-Host "   - Rocket.Chat: $script:RocketChat" -ForegroundColor Gray
            }
        } catch {
            Write-Err2 "Kurulum calistirilamadi: $($_.Exception.Message)"
        }
    } elseif (-not $script:FatalError) {
        Write-Err2 'Kurulum dosyasi hazir degil; kurulum atlaniyor.'
    }
    #endregion

    #region 4) Dogrulama
    Write-Head '4) Dogrulama'
    Start-Sleep -Seconds 3
    try {
        $after = Get-CitrixInstall
        if ($after) {
            Write-Ok "Citrix Workspace kurulu: $($after.Name) (surum $($after.Version))"
            $installOk = $true
            if ($script:FatalError -and $script:FatalError -match 'Kurulum basarisiz') {
                # Kuruluysa fatal'i yumusat
                $script:FatalError = $null
            }
        } else {
            if ($installOk) {
                Write-Warn2 'Kurulum kodu basariliydi ama kayit henuz gorunmuyor. Yeniden baslattiktan sonra kontrol edin.'
            } else {
                Write-Err2 'Citrix kurulu olarak dogrulanamadi.'
            }
        }
    } catch {
        Write-Warn2 "Dogrulama uyarisi: $($_.Exception.Message)"
    }
    #endregion
}

#region Rapor
Write-Head 'RAPOR'
if ($script:FatalError) {
    Write-Host "  SONUC : BASARISIZ" -ForegroundColor Red
    Write-Host "  HATA  : $script:FatalError" -ForegroundColor Red
} elseif ($skip) {
    Write-Host '  SONUC : ATLANDI (mevcut kurulum korundu)' -ForegroundColor Cyan
} elseif ($installOk) {
    Write-Host '  SONUC : BASARILI' -ForegroundColor Green
} else {
    Write-Host '  SONUC : BELIRSIZ - logu kontrol edin' -ForegroundColor Yellow
}

$logPath = Join-Path ([Environment]::GetFolderPath('Desktop')) ("DCS-Citrix-Kurulum-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
try {
    $head = @(
        "$script:AppName v$script:Version",
        "Gelistiren : $script:Author",
        "Tarih      : $(Get-Date)",
        "Bilgisayar : $env:COMPUTERNAME",
        "Kullanici  : $env:USERNAME",
        "Yonetici   : $(Test-Admin)",
        "Sonuc      : $(if ($script:FatalError) { 'BASARISIZ - ' + $script:FatalError } elseif ($installOk) { 'BASARILI' } elseif ($skip) { 'ATLANDI' } else { 'BELIRSIZ' })",
        ('-' * 50),
        'AYRINTILI GUNLUK:'
    ) -join "`r`n"
    ($head + "`r`n" + ($script:LogLines -join "`r`n")) | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host "  Rapor : $logPath" -ForegroundColor Cyan
} catch { Write-Warn2 "Rapor yazilamadi: $($_.Exception.Message)" }

Write-Host "`n  Sorun devam ederse Rocket.Chat: $script:RocketChat" -ForegroundColor Gray
Write-Host "`n  Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }

if ($script:FatalError) { exit 1 } else { exit 0 }
#endregion

# ==============================================================================
#  Son. Kod: Bayram Can Aslan (DCS Communication Center) - Temmuz 2026
# ==============================================================================
