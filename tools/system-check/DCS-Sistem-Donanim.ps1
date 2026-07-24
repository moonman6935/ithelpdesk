# DCS IT - Sistem Donanim Okuyucu
# Yazan: Bayram Can Aslan
# Okunan bilgileri sistem-kontrol sayfasina ?hw= ile aktarir.

$ErrorActionPreference = 'Stop'
$Site = if ($env:DCS_SITE) { $env:DCS_SITE } else { 'https://ithelpdesk-dxv7.vercel.app/sistem-kontrol' }

function Test-CpuOk([string]$name) {
    if ($name -match 'Intel.*?Core.*?i[3579][\s\-]?(\d{4,5})') {
        $m = $Matches[1]
        if ($m.Length -eq 4) { return ([int]$m.Substring(0, 1) -ge 9) }
        if ($m.Length -ge 5) { return ([int]$m.Substring(0, 2) -ge 9) }
    }
    if ($name -match 'Ryzen\s+[3579]\s+(\d{4})') {
        return ([int]$Matches[1] -ge 3000)
    }
    return $false
}

try {
    Write-Host ''
    Write-Host '  DCS IT - Donanim okuyucu'
    Write-Host '  ----------------------------------------'

    $cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
    $cpuOk = Test-CpuOk $cpu
    $ramGb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 0)

    $ssdOk = $false
    try {
        foreach ($d in (Get-PhysicalDisk -ErrorAction Stop)) {
            $gb = [math]::Round($d.Size / 1GB, 0)
            $media = [string]$d.MediaType
            if ($gb -ge 128 -and ($media -match 'SSD' -or $d.BusType -eq 'NVMe')) {
                $ssdOk = $true
            }
        }
    } catch {
        $total = ((Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3') | Measure-Object Size -Sum).Sum
        if ($total -ge 128GB) { $ssdOk = $true }
    }

    $gpuOk = $false
    $gpuName = ''
    foreach ($g in @(Get-CimInstance Win32_VideoController | Where-Object {
                $_.Name -and $_.Name -notmatch 'Basic|Remote|Microsoft'
            })) {
        if (-not $gpuName) { $gpuName = [string]$g.Name }
        $vram = 0.0
        try {
            $raw = $g.AdapterRAM
            if ($null -ne $raw) {
                if ([int64]$raw -lt 0) { $vram = [double]([uint32]$raw) }
                else { $vram = [double]$raw }
            }
        } catch { $vram = 0 }
        if (($vram / 1GB) -ge 2) { $gpuOk = $true }
    }
    if (-not $gpuOk -and $gpuName -match 'RX|RTX|GTX|Radeon|GeForce') { $gpuOk = $true }

    $caption = (Get-CimInstance Win32_OperatingSystem).Caption
    $os = 'other'
    if ($caption -match 'Windows 11') { $os = 'windows11' }
    elseif ($caption -match 'Windows 10') { $os = 'windows10' }

    $obj = [ordered]@{
        v       = 1
        source  = 'cmd'
        os      = $os
        cpuName = "$cpu"
        cpuOk   = [bool]$cpuOk
        ramGb   = [int]$ramGb
        diskOk  = [bool]$ssdOk
        gpuName = "$gpuName"
        gpuOk   = [bool]$gpuOk
    }

    $json = ($obj | ConvertTo-Json -Compress)
    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
    $url = $Site.TrimEnd('/') + '?hw=' + [uri]::EscapeDataString($b64)

    Write-Host ("  CPU : {0} (ok={1})" -f $cpu, $cpuOk)
    Write-Host ("  RAM : {0} GB" -f $ramGb)
    Write-Host ("  SSD : ok={0}" -f $ssdOk)
    Write-Host ("  GPU : {0} (ok={1})" -f $gpuName, $gpuOk)
    Write-Host ("  OS  : {0}" -f $os)
    Write-Host ''
    Write-Host '  Tarayici aciliyor...'
    Start-Process $url
    Write-Host '  Tamam.'
    Write-Host ''
    exit 0
} catch {
    Write-Host ''
    Write-Host ('  [HATA] ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host ''
    exit 1
}
