<#
==============================================================================
  DCS IT - Agent Ilk Kurulum Araci
==============================================================================
  Yazan   : Bayram Can Aslan
  Tarih   : Temmuz 2026
  Amac    : Yeni agent bilgisayarinda AnyDesk, Rocket.Chat ve Citrix'i
            sirayla kurmak; ses servislerini duzenlemek; CAG ve Rocket.Chat
            adreslerini acmak.

  Sira:
    1) AnyDesk
    2) Rocket.Chat Desktop
    3) Citrix Workspace
    4) Ses servisleri / mikrofon erisimi
    5) Tarayici: https://cag.dmc-rz.com
       Rocket.Chat: https://rocket.dmc-rz.com

  Parametreler:
    -Force     Kurulu uygulamalari da yeniden kurmaya calisir
    -SkipAudio Ses adimini atlar
    -SkipOpen  Kurulum sonrasi URL acmayi atlar

  (c) Bayram Can Aslan - DCS Communication Center
==============================================================================
#>

# Imza: Bayram Can Aslan

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$SkipAudio,
    [switch]$SkipOpen
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.SecurityProtocolType]::Tls12 -bor
        [Net.SecurityProtocolType]::Tls11 -bor
        [Net.SecurityProtocolType]::Tls
} catch {}

$script:AppName     = 'DCS IT - Agent Ilk Kurulum'
$script:Version     = '1.0.0'
$script:Author      = 'Bayram Can Aslan'
$script:CagUrl      = 'https://cag.dmc-rz.com'
$script:RocketUrl   = 'https://rocket.dmc-rz.com'
$script:LogLines    = New-Object System.Collections.Generic.List[string]
$script:Results     = New-Object System.Collections.Generic.List[string]
$script:FatalError  = $null

$script:AnyDeskUrls = @(
    'https://download.anydesk.com/AnyDesk.exe'
)
$script:CitrixUrls = @(
    'https://downloadplugins.citrix.com/Windows/CitrixWorkspaceApp.exe',
    'https://downloadplugins.citrix.com/ReceiverUpdates/Prod/Receiver/Win/CitrixWorkspaceApp.exe'
)
$script:RocketPinnedUrl = 'https://github.com/RocketChat/Rocket.Chat.Electron/releases/download/4.15.6/rocketchat-4.15.6-win.exe'
$script:MinAnyDeskBytes  = 2MB
$script:MinRocketBytes   = 50MB
$script:MinCitrixBytes   = 80MB

#region ---------- Yardimci ----------
function Write-Log { param([string]$m, [string]$lvl = 'INFO') $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); $script:LogLines.Add("[$ts][$lvl] $m") }
function Write-Head { param([string]$t) Write-Host ''; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Host " $t" -ForegroundColor Cyan; Write-Host ('=' * 62) -ForegroundColor DarkCyan; Write-Log "== $t ==" }
function Write-Step { param([string]$t) Write-Host "  -> $t" -ForegroundColor Gray; Write-Log $t }
function Write-Ok   { param([string]$t) Write-Host "  [OK] $t" -ForegroundColor Green; Write-Log "OK: $t" }
function Write-Warn2{ param([string]$t) Write-Host "  [!]  $t" -ForegroundColor Yellow; Write-Log "WARN: $t" 'WARN' }
function Write-Err2 { param([string]$t) Write-Host "  [X]  $t" -ForegroundColor Red; Write-Log "ERROR: $t" 'ERROR'; $script:FatalError = $t }
function Add-Result { param([string]$Name, [string]$Status) $script:Results.Add("$Name : $Status"); Write-Log "SONUC $Name = $Status" }

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Format-Bytes {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) { return ('{0:N2} GB' -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ('{0:N1} MB' -f ($Bytes / 1MB)) }
    if ($Bytes -ge 1KB) { return ('{0:N0} KB' -f ($Bytes / 1KB)) }
    return "$Bytes B"
}

function Show-ProgressLine {
    param([int]$Percent, [string]$Label = 'Indiriliyor', [long]$Received = -1, [long]$Total = -1)
    if ($Percent -lt 0) { $Percent = 0 }
    if ($Percent -gt 100) { $Percent = 100 }
    $barWidth = 28
    $filled = [math]::Floor($barWidth * $Percent / 100)
    $bar = ('#' * $filled) + ('-' * ($barWidth - $filled))
    $sizePart = ''
    if ($Received -ge 0 -and $Total -gt 0) {
        $sizePart = "  $(Format-Bytes $Received) / $(Format-Bytes $Total)"
    } elseif ($Received -ge 0) {
        $sizePart = "  $(Format-Bytes $Received)"
    }
    Write-Host ("`r  {0}: [{1}] {2,3}%{3}" -f $Label, $bar, $Percent, $sizePart).PadRight(78) -NoNewline
}

function Test-ExeFile {
    param([string]$Path, [long]$MinBytes)
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    try {
        $item = Get-Item -LiteralPath $Path -ErrorAction Stop
        if ($item.Length -lt $MinBytes) { return $false }
        $fs = [System.IO.File]::OpenRead($Path)
        try {
            $b1 = $fs.ReadByte(); $b2 = $fs.ReadByte()
            if ($b1 -ne 0x4D -or $b2 -ne 0x5A) { return $false }
        } finally { $fs.Close() }
        return $true
    } catch { return $false }
}

function Download-WithStream {
    param([string]$Url, [string]$OutFile)
    if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue }
    $req = [System.Net.HttpWebRequest]::Create($Url)
    $req.Method = 'GET'
    $req.UserAgent = 'DCS-IT-Agent-Setup/1.0'
    $req.AllowAutoRedirect = $true
    $req.Timeout = 60000
    $req.ReadWriteTimeout = 600000
    $resp = $null; $inStream = $null; $outStream = $null
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
                $lastPct = $pct; $lastUi = $now
                if ($total -gt 0) { Show-ProgressLine -Percent $pct -Received $received -Total $total }
                else { Show-ProgressLine -Percent 0 -Label 'Indiriliyor' -Received $received }
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

function Download-WithCurl {
    param([string]$Url, [string]$OutFile)
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) { throw 'curl.exe bulunamadi' }
    if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue }
    $argList = @('-L', '--fail', '--retry', '3', '--retry-delay', '2', '--connect-timeout', '30',
        '-A', 'DCS-IT-Agent-Setup/1.0', '-o', $OutFile, $Url)
    $p = Start-Process -FilePath $curl.Source -ArgumentList $argList -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { throw "curl cikis kodu: $($p.ExitCode)" }
    return $true
}

function Invoke-Download {
    param([string[]]$Urls, [string]$OutFile, [long]$MinBytes, [string]$Label)
    $methods = @(
        @{ Name = 'HTTP'; Fn = { param($u, $o) Download-WithStream -Url $u -OutFile $o } },
        @{ Name = 'curl'; Fn = { param($u, $o) Download-WithCurl -Url $u -OutFile $o } }
    )
    foreach ($url in $Urls) {
        Write-Step "Kaynak: $url"
        foreach ($m in $methods) {
            try {
                Write-Step ("Yontem: {0}" -f $m.Name)
                & $m.Fn $url $OutFile
                if (Test-ExeFile -Path $OutFile -MinBytes $MinBytes) {
                    Write-Ok ("$Label indirme tamam ({0}, {1})" -f $m.Name, (Format-Bytes (Get-Item $OutFile).Length))
                    return $true
                }
                Write-Warn2 "$($m.Name): dosya bozuk veya cok kucuk"
                Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Warn2 ("{0}: {1}" -f $m.Name, $_.Exception.Message)
                Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
            }
        }
    }
    return $false
}

function Get-RocketChatDownloadUrl {
    try {
        Write-Step 'Rocket.Chat son surum GitHub uzerinden sorgulaniyor...'
        $headers = @{ 'User-Agent' = 'DCS-IT-Agent-Setup/1.0'; 'Accept' = 'application/vnd.github+json' }
        $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/RocketChat/Rocket.Chat.Electron/releases/latest' -Headers $headers -TimeoutSec 30
        $asset = $rel.assets | Where-Object { $_.name -match 'win\.exe$' -and $_.name -notmatch 'ia32|arm' } | Select-Object -First 1
        if (-not $asset) {
            $asset = $rel.assets | Where-Object { $_.name -match 'win\.exe$' } | Select-Object -First 1
        }
        if ($asset -and $asset.browser_download_url) {
            Write-Ok ("Rocket.Chat surum: {0} ({1})" -f $rel.tag_name, $asset.name)
            return [string]$asset.browser_download_url
        }
    } catch {
        Write-Warn2 "GitHub sorgu basarisiz: $($_.Exception.Message)"
    }
    Write-Warn2 'Sabit Rocket.Chat indirme adresi kullanilacak.'
    return $script:RocketPinnedUrl
}

function Find-InstalledApp {
    param([string]$NamePattern, [string[]]$ExePaths)
    foreach ($p in $ExePaths) {
        if ($p -and (Test-Path -LiteralPath $p)) { return $p }
    }
    $keys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    foreach ($k in $keys) {
        $hit = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match $NamePattern } |
            Select-Object -First 1
        if ($hit) {
            if ($hit.DisplayIcon) {
                $icon = ($hit.DisplayIcon -split ',')[0].Trim('"')
                if ($icon -and (Test-Path -LiteralPath $icon)) { return $icon }
            }
            if ($hit.InstallLocation) {
                $cand = Get-ChildItem -LiteralPath $hit.InstallLocation -Filter '*.exe' -ErrorAction SilentlyContinue |
                    Where-Object { $_.Name -match $NamePattern -or $_.Name -match 'AnyDesk|Rocket' } |
                    Select-Object -First 1
                if ($cand) { return $cand.FullName }
            }
            return $hit.DisplayName
        }
    }
    return $null
}
#endregion

#region ---------- Yonetici ----------
if (-not (Test-Admin)) {
    Write-Host 'Yonetici haklari gerekiyor, yeniden baslatiliyor (UAC)...' -ForegroundColor Yellow
    try {
        $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
        if ($Force) { $argList += '-Force' }
        if ($SkipAudio) { $argList += '-SkipAudio' }
        if ($SkipOpen) { $argList += '-SkipOpen' }
        Start-Process -FilePath (Get-Process -Id $PID).Path -Verb RunAs -ArgumentList $argList | Out-Null
        exit 0
    } catch {
        Write-Err2 'Yonetici yukseltmesi iptal edildi. Kurulum icin Yonetici izni zorunludur.'
        Write-Host "`n  Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
        try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
        exit 1
    }
}
#endregion

Clear-Host
Write-Host ''
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Host '  #     DCS IT - AGENT ILK KURULUM ARACI             #' -ForegroundColor White
Write-Host "  #     Surum $script:Version                                    #" -ForegroundColor DarkGray
Write-Host "  #     Gelistiren: $script:Author               #" -ForegroundColor DarkGray
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Host ''
Write-Host '  Kurulum sirasi: AnyDesk -> Rocket.Chat -> Citrix -> Ses -> CAG/Rocket' -ForegroundColor Cyan
Write-Log "$script:AppName v$script:Version basladi. Admin=$(Test-Admin) Force=$Force OS=$([Environment]::OSVersion.VersionString)"

#region 1) AnyDesk
Write-Head '1) AnyDesk'
$anyDeskExe = Find-InstalledApp -NamePattern 'AnyDesk' -ExePaths @(
    "${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe",
    "$env:ProgramFiles\AnyDesk\AnyDesk.exe"
)
if ($anyDeskExe -and -not $Force) {
    Write-Ok "AnyDesk zaten kurulu: $anyDeskExe"
    Add-Result 'AnyDesk' 'Zaten kurulu'
} else {
    $installer = Join-Path $env:TEMP 'DCS-AnyDesk.exe'
    $ok = Invoke-Download -Urls $script:AnyDeskUrls -OutFile $installer -MinBytes $script:MinAnyDeskBytes -Label 'AnyDesk'
    if ($ok) {
        Write-Step 'AnyDesk sessiz kuruluyor...'
        $installDir = "${env:ProgramFiles(x86)}\AnyDesk"
        $args = "--install `"$installDir`" --start-with-win --create-shortcuts --create-desktop-icon --silent"
        Write-Log "Kurulum: `"$installer`" $args"
        try {
            $proc = Start-Process -FilePath $installer -ArgumentList $args -Wait -PassThru -ErrorAction Stop
            $code = if ($null -ne $proc.ExitCode) { [int]$proc.ExitCode } else { 0 }
            Write-Log "AnyDesk cikis kodu: $code"
            Start-Sleep -Seconds 2
            $after = Find-InstalledApp -NamePattern 'AnyDesk' -ExePaths @(
                "$installDir\AnyDesk.exe",
                "$env:ProgramFiles\AnyDesk\AnyDesk.exe"
            )
            if ($after -or $code -eq 0) {
                Write-Ok 'AnyDesk kuruldu.'
                Add-Result 'AnyDesk' 'Kuruldu'
                try { Start-Process -FilePath (Join-Path $installDir 'AnyDesk.exe') -ErrorAction SilentlyContinue } catch {}
            } else {
                Write-Err2 "AnyDesk kurulumu dogrulanamadi (kod $code)."
                Add-Result 'AnyDesk' "Basarisiz ($code)"
            }
        } catch {
            Write-Err2 "AnyDesk kurulamadi: $($_.Exception.Message)"
            Add-Result 'AnyDesk' 'Hata'
        }
    } else {
        Write-Err2 'AnyDesk indirilemedi.'
        Add-Result 'AnyDesk' 'Indirme basarisiz'
    }
}
#endregion

#region 2) Rocket.Chat
Write-Head '2) Rocket.Chat Desktop'
$rocketExe = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
    "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
    "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe",
    "$env:ProgramFiles\Rocket.Chat\Rocket.Chat.exe",
    "${env:ProgramFiles(x86)}\Rocket.Chat\Rocket.Chat.exe"
)
if ($rocketExe -and -not $Force) {
    Write-Ok "Rocket.Chat zaten kurulu: $rocketExe"
    Add-Result 'Rocket.Chat' 'Zaten kurulu'
} else {
    $rocketUrl = Get-RocketChatDownloadUrl
    $installer = Join-Path $env:TEMP 'DCS-RocketChat-Setup.exe'
    $ok = Invoke-Download -Urls @($rocketUrl) -OutFile $installer -MinBytes $script:MinRocketBytes -Label 'Rocket.Chat'
    if ($ok) {
        Write-Step 'Rocket.Chat sessiz kuruluyor (/S /allusers)...'
        Write-Log "Kurulum: `"$installer`" /S /allusers"
        try {
            $proc = Start-Process -FilePath $installer -ArgumentList '/S','/allusers' -Wait -PassThru -ErrorAction Stop
            $code = if ($null -ne $proc.ExitCode) { [int]$proc.ExitCode } else { 0 }
            Write-Log "Rocket.Chat cikis kodu: $code"
            Start-Sleep -Seconds 3
            $after = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
                "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
                "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe",
                "$env:ProgramFiles\Rocket.Chat\Rocket.Chat.exe"
            )
            if ($after -or $code -eq 0) {
                Write-Ok 'Rocket.Chat kuruldu.'
                Add-Result 'Rocket.Chat' 'Kuruldu'
            } else {
                Write-Warn2 "Rocket.Chat dogrulama belirsiz (kod $code) - /currentuser ile tekrar deneniyor..."
                $proc2 = Start-Process -FilePath $installer -ArgumentList '/S','/currentuser' -Wait -PassThru -ErrorAction SilentlyContinue
                $code2 = if ($proc2 -and $null -ne $proc2.ExitCode) { [int]$proc2.ExitCode } else { -1 }
                Write-Log "Rocket.Chat currentuser cikis: $code2"
                $after2 = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
                    "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
                    "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe"
                )
                if ($after2) {
                    Write-Ok 'Rocket.Chat kuruldu (current user).'
                    Add-Result 'Rocket.Chat' 'Kuruldu'
                } else {
                    Write-Err2 'Rocket.Chat kurulumu dogrulanamadi.'
                    Add-Result 'Rocket.Chat' 'Basarisiz'
                }
            }
        } catch {
            Write-Err2 "Rocket.Chat kurulamadi: $($_.Exception.Message)"
            Add-Result 'Rocket.Chat' 'Hata'
        }
    } else {
        Write-Err2 'Rocket.Chat indirilemedi.'
        Add-Result 'Rocket.Chat' 'Indirme basarisiz'
    }
}
#endregion

#region 3) Citrix Workspace
Write-Head '3) Citrix Workspace'
function Get-CitrixInstall {
    $keys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    foreach ($k in $keys) {
        $found = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match 'Citrix Workspace|Citrix Receiver' } |
            Select-Object -First 1
        if ($found) {
            return [pscustomobject]@{ Name = $found.DisplayName; Version = $found.DisplayVersion }
        }
    }
    $exe = Join-Path ${env:ProgramFiles(x86)} 'Citrix\ICA Client\wfica32.exe'
    if (Test-Path $exe) {
        return [pscustomobject]@{ Name = 'Citrix Workspace (dosya)'; Version = (Get-Item $exe).VersionInfo.ProductVersion }
    }
    return $null
}

function Test-CitrixSuccessCode {
    param([int]$Code)
    return @(0, 3010, 1638, 40008, 40032, 40037) -contains $Code
}

$existingCitrix = Get-CitrixInstall
if ($existingCitrix -and -not $Force) {
    Write-Ok "Citrix zaten kurulu: $($existingCitrix.Name) ($($existingCitrix.Version))"
    Add-Result 'Citrix' 'Zaten kurulu'
} else {
    $installer = Join-Path $env:TEMP 'DCS-CitrixWorkspaceApp.exe'
    $ok = Invoke-Download -Urls $script:CitrixUrls -OutFile $installer -MinBytes $script:MinCitrixBytes -Label 'Citrix'
    if ($ok) {
        Write-Step 'Citrix Workspace sessiz kuruluyor (5-15 dk surebilir)...'
        $argLine = '/silent /noreboot /AutoUpdateCheck=disabled /EnableCEIP=false /FORCE_LITE_MODE=no'
        if ($existingCitrix) { $argLine += ' /forceinstall' }
        Write-Log "Kurulum: `"$installer`" $argLine"
        try {
            $proc = Start-Process -FilePath $installer -ArgumentList $argLine -Wait -PassThru -ErrorAction Stop
            $code = if ($null -ne $proc.ExitCode) { [int]$proc.ExitCode } else { 0 }
            Write-Log "Citrix cikis kodu: $code"
            Start-Sleep -Seconds 3
            $after = Get-CitrixInstall
            if ((Test-CitrixSuccessCode -Code $code) -or $after) {
                Write-Ok ("Citrix kurulum sonucu OK (kod {0})" -f $code)
                if ($after) { Write-Ok "$($after.Name) ($($after.Version))" }
                if ($code -eq 3010) { Write-Warn2 'Citrix icin yeniden baslatma onerilir.' }
                Add-Result 'Citrix' 'Kuruldu'
            } else {
                Write-Err2 "Citrix kurulumu basarisiz (kod $code)."
                Add-Result 'Citrix' "Basarisiz ($code)"
            }
        } catch {
            Write-Err2 "Citrix kurulamadi: $($_.Exception.Message)"
            Add-Result 'Citrix' 'Hata'
        }
    } else {
        Write-Err2 'Citrix indirilemedi.'
        Add-Result 'Citrix' 'Indirme basarisiz'
    }
}
#endregion

#region 4) Ses ayarlari
Write-Head '4) Ses servisleri ve mikrofon erisimi'
if ($SkipAudio) {
    Write-Warn2 'Ses adimi atlandi (-SkipAudio).'
    Add-Result 'Ses' 'Atlandi'
} else {
    $audioOk = $true
    foreach ($svcName in @('Audiosrv', 'AudioEndpointBuilder')) {
        try {
            $svc = Get-Service -Name $svcName -ErrorAction Stop
            if ($svc.Status -ne 'Running') {
                Write-Step "$svcName baslatiliyor..."
                Set-Service -Name $svcName -StartupType Automatic -ErrorAction SilentlyContinue
                Start-Service -Name $svcName -ErrorAction Stop
                Write-Ok "$svcName calisiyor."
            } else {
                Write-Ok "$svcName zaten calisiyor."
            }
        } catch {
            Write-Warn2 ("{0}: {1}" -f $svcName, $_.Exception.Message)
            $audioOk = $false
        }
    }

    # Mikrofon gizlilik erisimi (Windows 10/11)
    try {
        $micKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
        if (-not (Test-Path $micKey)) {
            New-Item -Path $micKey -Force | Out-Null
        }
        New-ItemProperty -Path $micKey -Name 'Value' -Value 'Allow' -PropertyType String -Force | Out-Null
        Write-Ok 'Mikrofon erisimi (sistem) Allow olarak ayarlandi.'
    } catch {
        Write-Warn2 "Mikrofon erisim ayari: $($_.Exception.Message)"
        $audioOk = $false
    }

    try {
        $userMic = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
        if (-not (Test-Path $userMic)) { New-Item -Path $userMic -Force | Out-Null }
        New-ItemProperty -Path $userMic -Name 'Value' -Value 'Allow' -PropertyType String -Force | Out-Null
        Write-Ok 'Mikrofon erisimi (kullanici) Allow olarak ayarlandi.'
    } catch {
        Write-Warn2 "Kullanici mikrofon ayari: $($_.Exception.Message)"
    }

    if ($audioOk) { Add-Result 'Ses' 'Tamam' } else { Add-Result 'Ses' 'Kismi / uyarili' }
    Write-Step 'Not: USB kulakligi varsayilan yapmak icin DCS-Kulaklik-Onarim aracini ayrica calistirabilirsiniz.'
}
#endregion

#region 5) CAG + Rocket.Chat ac
Write-Head '5) CAG ve Rocket.Chat aciliyor'
if ($SkipOpen) {
    Write-Warn2 'URL acma atlandi (-SkipOpen).'
    Add-Result 'CAG/Rocket acilis' 'Atlandi'
} else {
    try {
        Write-Step "Tarayici: $script:CagUrl"
        Start-Process $script:CagUrl | Out-Null
        Write-Ok 'CAG tarayicida acildi.'
    } catch {
        Write-Warn2 "CAG acilamadi: $($_.Exception.Message)"
    }

    $rocketLaunch = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
        "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
        "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe",
        "$env:ProgramFiles\Rocket.Chat\Rocket.Chat.exe",
        "${env:ProgramFiles(x86)}\Rocket.Chat\Rocket.Chat.exe"
    )
    if ($rocketLaunch -and (Test-Path -LiteralPath $rocketLaunch)) {
        try {
            Write-Step "Rocket.Chat uygulamasi baslatiliyor: $rocketLaunch"
            Start-Process -FilePath $rocketLaunch -ErrorAction Stop | Out-Null
            Write-Ok 'Rocket.Chat uygulamasi acildi.'
        } catch {
            Write-Warn2 "Rocket.Chat uygulamasi acilamadi: $($_.Exception.Message)"
        }
    } else {
        Write-Warn2 'Rocket.Chat.exe bulunamadi; tarayici ile acilacak.'
    }

    try {
        Write-Step "Rocket.Chat sunucu adresi: $script:RocketUrl"
        Start-Process $script:RocketUrl | Out-Null
        Write-Ok 'rocket.dmc-rz.com tarayicida acildi.'
        Add-Result 'CAG/Rocket acilis' 'Tamam'
    } catch {
        Write-Warn2 "Rocket URL acilamadi: $($_.Exception.Message)"
        Add-Result 'CAG/Rocket acilis' 'Kismi'
    }
}
#endregion

#region Rapor
Write-Head 'RAPOR'
Write-Host '  Kurulum ozeti:' -ForegroundColor White
foreach ($line in $script:Results) {
    $color = if ($line -match 'Basarisiz|Hata|Indirme') { 'Red' } elseif ($line -match 'uyari|Kismi|Atlandi') { 'Yellow' } else { 'Green' }
    Write-Host "   - $line" -ForegroundColor $color
}

$logPath = Join-Path ([Environment]::GetFolderPath('Desktop')) ("DCS-Agent-Ilk-Kurulum-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
try {
    $head = @(
        "$script:AppName v$script:Version",
        "Gelistiren : $script:Author",
        "Tarih      : $(Get-Date)",
        "Bilgisayar : $env:COMPUTERNAME",
        "Kullanici  : $env:USERNAME",
        "Yonetici   : $(Test-Admin)",
        ('-' * 50),
        'OZET:'
    ) + $script:Results + @('', 'AYRINTILI GUNLUK:')
    ($head -join "`r`n") + "`r`n" + ($script:LogLines -join "`r`n") | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host "  Rapor : $logPath" -ForegroundColor Cyan
} catch {
    Write-Warn2 "Rapor yazilamadi: $($_.Exception.Message)"
}

Write-Host ''
Write-Host "  CAG        : $script:CagUrl" -ForegroundColor Gray
Write-Host "  Rocket.Chat: $script:RocketUrl" -ForegroundColor Gray
Write-Host "`n  Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }

$failed = @($script:Results | Where-Object { $_ -match 'Basarisiz|Hata|Indirme basarisiz' })
if ($failed.Count -gt 0) { exit 1 } else { exit 0 }
#endregion

# ==============================================================================
#  Son. Kod: Bayram Can Aslan (DCS Communication Center) - Temmuz 2026
# ==============================================================================
