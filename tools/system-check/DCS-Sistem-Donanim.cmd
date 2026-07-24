@echo off
title DCS IT - Sistem Donanim Okuyucu
:: DCS IT - Sistem Uygunluk: donanim bilgilerini okuyup tarayiciya aktarir
:: Yazan: Bayram Can Aslan

setlocal EnableExtensions
set "SITE=https://ithelpdesk-dxv7.vercel.app/sistem-kontrol"

net session >nul 2>&1
rem Admin not required for WMI read

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; ^
  function Test-CpuOk([string]$name) { ^
    if ($name -match 'Intel.*Core.*i[3579][\s\-]?(\d{4,5})') { ^
      $m=$Matches[1]; if ($m.Length -eq 4) { return ([int]$m[0].ToString() -ge 9) }; ^
      if ($m.Length -ge 5) { return ([int]$m.Substring(0,2) -ge 9) } ^
    }; ^
    if ($name -match 'Ryzen\s+[3579]\s+(\d{4})') { return ([int]$Matches[1] -ge 3000) }; ^
    if ($name -match 'Ryzen\s+[3579]\s+(\d)(\d{3})') { return ([int]($Matches[1]+'000') -ge 3000) }; ^
    return $false ^
  }; ^
  $cpu=(Get-CimInstance Win32_Processor | Select-Object -First 1).Name; ^
  $cpuOk=Test-CpuOk $cpu; ^
  $ramGb=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,0); ^
  $ssdOk=$false; ^
  try { ^
    $disks=Get-PhysicalDisk -ErrorAction Stop; ^
    foreach($d in $disks){ ^
      $gb=[math]::Round($d.Size/1GB,0); ^
      $media=[string]$d.MediaType; ^
      if ($gb -ge 128 -and ($media -match 'SSD|4' -or $d.BusType -eq 'NVMe')) { $ssdOk=$true } ^
    } ^
  } catch { ^
    $vols=Get-CimInstance Win32_LogicalDisk -Filter \"DriveType=3\"; ^
    $total=($vols | Measure-Object Size -Sum).Sum; ^
    if ($total -ge 128GB) { $ssdOk=$true } ^
  }; ^
  $gpuOk=$false; $gpuName=''; ^
  $gpus=@(Get-CimInstance Win32_VideoController | Where-Object { $_.Name -and $_.Name -notmatch 'Basic|Remote|Microsoft' }); ^
  foreach($g in $gpus){ ^
    if (-not $gpuName) { $gpuName=[string]$g.Name }; ^
    $vram=[double]($g.AdapterRAM); if ($vram -lt 0) { $vram = [uint32]$g.AdapterRAM }; ^
    if (($vram/1GB) -ge 2) { $gpuOk=$true } ^
  }; ^
  if (-not $gpuOk -and $gpuName -match 'RX|RTX|GTX|Radeon|GeForce') { $gpuOk=$true }; ^
  $caption=(Get-CimInstance Win32_OperatingSystem).Caption; ^
  $os='other'; ^
  if ($caption -match 'Windows 11') { $os='windows11' } elseif ($caption -match 'Windows 10') { $os='windows10' }; ^
  $obj=[ordered]@{ v=1; source='cmd'; os=$os; cpuName=$cpu; cpuOk=$cpuOk; ramGb=$ramGb; diskOk=$ssdOk; gpuName=$gpuName; gpuOk=$gpuOk }; ^
  $json=($obj | ConvertTo-Json -Compress); ^
  $b64=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json)); ^
  $url='%SITE%?hw=' + [uri]::EscapeDataString($b64); ^
  Write-Host $json; ^
  Start-Process $url"

echo.
echo Tarayici acildi. Pencereyi kapatabilirsiniz.
timeout /t 4 >nul
exit /b 0
