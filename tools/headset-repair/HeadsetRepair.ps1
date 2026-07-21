<#
==============================================================================
  DCS IT - Otomatik Kulaklik Onarim Araci
==============================================================================
  Yazan   : Bayram Can Aslan
  Tarih   : Temmuz 2026
  Amac    : USB kulaklik ile ilgili yaygin Windows sorunlarini kullanici
            mudahalesi olmadan tespit edip duzeltmek.

  Yaptiklari:
    - Windows Audio servislerini kontrol edip gerekirse baslatir
    - Devre disi birakilmis ses cihazlarini yeniden etkinlestirir
    - USB kulakligi varsayilan oynatma + kayit + iletisim cihazi yapar
    - Sesi acar, sessize alinmissa duzeltir, makul seviyeye getirir
    - Mikrofon gizlilik erisimini acar
    - Bitiste masaustune ayrintili bir teshis raporu (log) birakir

  Not: Sadece ses ile ilgili ayarlara dokunur, baska hicbir seyi degistirmez.

  (c) Bayram Can Aslan - DCS Communication Center
==============================================================================
#>

# Imza: Bayram Can Aslan

[CmdletBinding()]
param(
    [switch]$AutoYes,          # Onay sormadan tum duzeltmeleri uygular
    [switch]$DiagnoseOnly      # Sadece teshis yapar, hicbir sey degistirmez
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$script:AppName    = 'DCS IT - Kulaklik Onarim Araci'
$script:Version    = '1.0.0'
$script:Author     = 'Bayram Can Aslan'
$script:RocketChat = 'https://rocket.dmc-rz.com'
$script:LogLines   = New-Object System.Collections.Generic.List[string]

# Kulaklik/headset olarak taninacak marka & anahtar kelimeler
$script:HeadsetKeywords = @(
    'Jabra','Poly','Plantronics','Logitech','EPOS','Sennheiser','Yealink',
    'Headset','Headphone','Kulaklik','Kulakl','Handset','Speakerphone',
    'Blackwire','Savi','Evolve','Engage','IMPACT','DA45','DA75','DA85',
    'USB Audio','USB PnP','Voice','Wireless Headset','GN '
)

#region ---------- Yardimci fonksiyonlar ----------
function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $script:LogLines.Add("[$ts][$Level] $Message")
}

function Write-Head {
    param([string]$Text)
    Write-Host ''
    Write-Host ('=' * 62) -ForegroundColor DarkCyan
    Write-Host (" $Text") -ForegroundColor Cyan
    Write-Host ('=' * 62) -ForegroundColor DarkCyan
    Write-Log "== $Text =="
}

function Write-Step { param([string]$Text) Write-Host ("  -> $Text") -ForegroundColor Gray; Write-Log $Text }
function Write-Ok   { param([string]$Text) Write-Host ("  [OK] $Text") -ForegroundColor Green; Write-Log "OK: $Text" }
function Write-Warn2{ param([string]$Text) Write-Host ("  [!]  $Text") -ForegroundColor Yellow; Write-Log "WARN: $Text" 'WARN' }
function Write-Err2 { param([string]$Text) Write-Host ("  [X]  $Text") -ForegroundColor Red; Write-Log "ERROR: $Text" 'ERROR' }

function Confirm-Fix {
    param([string]$Question)
    if ($DiagnoseOnly) { return $false }
    if ($AutoYes)      { return $true }
    Write-Host ("  ? $Question " ) -ForegroundColor Yellow -NoNewline
    Write-Host '[E/H] ' -ForegroundColor White -NoNewline
    $ans = Read-Host
    return ($ans -match '^(e|evet|y|yes|j|ja)$')
}

function Test-IsHeadset {
    param([string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return $false }
    foreach ($k in $script:HeadsetKeywords) {
        if ($Name -like "*$k*") { return $true }
    }
    return $false
}
#endregion

#region ---------- Yonetici yukseltme ----------
function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p  = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin) -and -not $DiagnoseOnly) {
    Write-Host 'Yonetici haklari gerekiyor, yeniden baslatiliyor (UAC)...' -ForegroundColor Yellow
    try {
        $psi = @{
            FilePath     = (Get-Process -Id $PID).Path
            Verb         = 'RunAs'
            ArgumentList = @('-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"") + $(if ($AutoYes) {'-AutoYes'})
        }
        Start-Process @psi
    } catch {
        Write-Host 'Yukseltme iptal edildi. Sinirli modda devam ediliyor (bazi duzeltmeler yapilamayabilir).' -ForegroundColor Yellow
    }
    if ($LASTEXITCODE -eq $null) { }
}
#endregion

#region ---------- Core Audio COM (self-contained) ----------
# Windows Core Audio API sarmalayicisi - harici baginti yok. -- Bayram Can Aslan
$csharp = @'
// Core Audio COM wrapper
// Author: Bayram Can Aslan
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace DcsAudio
{
    public enum EDataFlow { eRender = 0, eCapture = 1, eAll = 2 }
    public enum ERole { eConsole = 0, eMultimedia = 1, eCommunications = 2 }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceEnumerator
    {
        int EnumAudioEndpoints(EDataFlow dataFlow, int stateMask, out IMMDeviceCollection devices);
        int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice device);
        int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice device);
    }
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }

    [Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceCollection
    {
        int GetCount(out int count);
        int Item(int index, out IMMDevice device);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevice
    {
        int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
        int OpenPropertyStore(int stgmAccess, out IPropertyStore properties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
        int GetState(out int state);
    }

    [Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPropertyStore
    {
        int GetCount(out int count);
        int GetAt(int index, out PROPERTYKEY key);
        int GetValue(ref PROPERTYKEY key, out PROPVARIANT value);
        int SetValue(ref PROPERTYKEY key, ref PROPVARIANT value);
        int Commit();
    }

    [StructLayout(LayoutKind.Sequential)]
    struct PROPERTYKEY { public Guid fmtid; public int pid; }

    // PROPVARIANT is 16 bytes on x86 and 24 bytes on x64. Declared large enough
    // for both so the COM callee never overruns the buffer (heap corruption).
    [StructLayout(LayoutKind.Sequential)]
    struct PROPVARIANT
    {
        public ushort vt;
        public ushort r1;
        public ushort r2;
        public ushort r3;
        public IntPtr pointerValue;
        public IntPtr pointerValue2;
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioEndpointVolume
    {
        int RegisterControlChangeNotify(IntPtr n);
        int UnregisterControlChangeNotify(IntPtr n);
        int GetChannelCount(out int c);
        int SetMasterVolumeLevel(float level, ref Guid ctx);
        int SetMasterVolumeLevelScalar(float level, ref Guid ctx);
        int GetMasterVolumeLevel(out float level);
        int GetMasterVolumeLevelScalar(out float level);
        int SetChannelVolumeLevel(int ch, float level, ref Guid ctx);
        int SetChannelVolumeLevelScalar(int ch, float level, ref Guid ctx);
        int GetChannelVolumeLevel(int ch, out float level);
        int GetChannelVolumeLevelScalar(int ch, out float level);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx);
        int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
    }

    [Guid("f8679f50-850a-41cf-9c72-430f290290c8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPolicyConfig
    {
        int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr f);
        int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, bool def, IntPtr f);
        int ResetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id);
        int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr e, IntPtr m);
        int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, bool def, IntPtr a, IntPtr b);
        int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr p);
        int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr m);
        int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr m);
        int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, bool store, ref PROPERTYKEY key, out PROPVARIANT value);
        int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, bool store, ref PROPERTYKEY key, ref PROPVARIANT value);
        int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string id, ERole role);
        int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string id, bool visible);
    }
    [ComImport, Guid("870af99c-171d-4f9e-af0d-e63df40c2bc9")] class PolicyConfigClient { }

    public class Device
    {
        public string Id;
        public string Name;
        public int State;   // 1=Active, 2=Disabled, 4=NotPresent, 8=Unplugged
        public bool IsDefault;
        public bool Mute;
        public float Volume; // 0..1, -1 if unknown
    }

    public static class AudioApi
    {
        public const string Author = "Bayram Can Aslan";

        static PROPERTYKEY PKEY_FriendlyName = new PROPERTYKEY {
            fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), pid = 14 };

        static IMMDeviceEnumerator CreateEnum()
        {
            return (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
        }

        static string GetName(IMMDevice dev)
        {
            try {
                IPropertyStore store; dev.OpenPropertyStore(0, out store);
                PROPVARIANT val; store.GetValue(ref PKEY_FriendlyName, out val);
                string name = Marshal.PtrToStringUni(val.pointerValue);
                return name ?? "(bilinmeyen cihaz)";
            } catch { return "(bilinmeyen cihaz)"; }
        }

        static IAudioEndpointVolume GetVol(IMMDevice dev)
        {
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object o; dev.Activate(ref iid, 1, IntPtr.Zero, out o);
            return (IAudioEndpointVolume)o;
        }

        public static List<Device> List(int dataFlow)
        {
            var result = new List<Device>();
            var en = CreateEnum();
            string defId = "";
            try { IMMDevice d; if (en.GetDefaultAudioEndpoint((EDataFlow)dataFlow, ERole.eMultimedia, out d) == 0) { d.GetId(out defId); } } catch {}
            IMMDeviceCollection col;
            en.EnumAudioEndpoints((EDataFlow)dataFlow, 0x0000000F, out col); // all states
            int count; col.GetCount(out count);
            for (int i = 0; i < count; i++)
            {
                IMMDevice dev; col.Item(i, out dev);
                var item = new Device();
                dev.GetId(out item.Id);
                item.Name = GetName(dev);
                int st; dev.GetState(out st); item.State = st;
                item.IsDefault = (item.Id == defId);
                item.Volume = -1;
                if (st == 1) {
                    try { var v = GetVol(dev); bool m; v.GetMute(out m); item.Mute = m; float lv; v.GetMasterVolumeLevelScalar(out lv); item.Volume = lv; } catch {}
                }
                result.Add(item);
            }
            return result;
        }

        public static void SetDefault(string id)
        {
            var pc = (IPolicyConfig)(new PolicyConfigClient());
            pc.SetDefaultEndpoint(id, ERole.eConsole);
            pc.SetDefaultEndpoint(id, ERole.eMultimedia);
            pc.SetDefaultEndpoint(id, ERole.eCommunications);
        }

        public static void SetVolume(string id, float scalar, bool mute)
        {
            var en = CreateEnum();
            IMMDevice dev; if (en.GetDevice(id, out dev) != 0) return;
            var v = GetVol(dev);
            Guid ctx = Guid.Empty;
            v.SetMute(mute, ref ctx);
            if (scalar >= 0) v.SetMasterVolumeLevelScalar(scalar, ref ctx);
        }
    }
}
'@

$audioReady = $false
try {
    Add-Type -TypeDefinition $csharp -Language CSharp -ErrorAction Stop
    $audioReady = $true
} catch {
    Write-Warn2 "Ses API'si yuklenemedi: $($_.Exception.Message)"
}
#endregion

Clear-Host
Write-Host ''
Write-Host '  ####################################################' -ForegroundColor Red
Write-Host '  #        DCS IT - KULAKLIK ONARIM ARACI            #' -ForegroundColor White
Write-Host "  #        Surum $script:Version                             #" -ForegroundColor DarkGray
Write-Host "  #        Gelistiren: $script:Author            #" -ForegroundColor DarkGray
Write-Host '  ####################################################' -ForegroundColor Red
Write-Log "$script:AppName v$script:Version (Gelistiren: $script:Author) basladi. Admin=$(Test-Admin) DiagnoseOnly=$DiagnoseOnly AutoYes=$AutoYes"

if ($DiagnoseOnly) { Write-Host "`n  (Sadece teshis modu - hicbir ayar degistirilmeyecek)`n" -ForegroundColor Yellow }

$issues = New-Object System.Collections.Generic.List[string]
$fixed  = New-Object System.Collections.Generic.List[string]

#region 1) Windows Audio servisleri
Write-Head '1) Windows Audio Servisleri'
foreach ($svc in @('Audiosrv','AudioEndpointBuilder')) {
    try {
        $s = Get-Service -Name $svc -ErrorAction Stop
        if ($s.Status -ne 'Running') {
            Write-Warn2 "$svc calismiyor (durum: $($s.Status))."
            $issues.Add("Servis durmus: $svc")
            if (Confirm-Fix "$svc servisini baslatalim mi?") {
                Set-Service -Name $svc -StartupType Automatic -ErrorAction SilentlyContinue
                Start-Service -Name $svc -ErrorAction Stop
                Write-Ok "$svc baslatildi."
                $fixed.Add("Servis baslatildi: $svc")
            }
        } else {
            Write-Ok "$svc calisiyor."
        }
    } catch {
        Write-Err2 "$svc kontrol edilemedi: $($_.Exception.Message)"
    }
}
#endregion

#region 2) Devre disi ses cihazlari
Write-Head '2) Devre Disi Birakilmis Ses Cihazlari'
try {
    $disabled = Get-PnpDevice -Class 'AudioEndpoint','Media' -ErrorAction SilentlyContinue |
                Where-Object { $_.Status -eq 'Error' -or $_.Status -eq 'Disabled' }
    if ($disabled) {
        foreach ($d in $disabled) {
            Write-Warn2 "Devre disi cihaz: $($d.FriendlyName)"
            $issues.Add("Devre disi cihaz: $($d.FriendlyName)")
            if (Confirm-Fix "Bu cihazi etkinlestirelim mi?") {
                try { Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction Stop; Write-Ok "Etkinlestirildi: $($d.FriendlyName)"; $fixed.Add("Cihaz etkinlestirildi: $($d.FriendlyName)") }
                catch { Write-Err2 "Etkinlestirilemedi (yonetici gerekli olabilir): $($d.FriendlyName)" }
            }
        }
    } else {
        Write-Ok 'Devre disi ses cihazi bulunamadi.'
    }
    if (-not $DiagnoseOnly) {
        Write-Step 'Yeni donanim taraniyor...'
        Start-Process -FilePath 'pnputil.exe' -ArgumentList '/scan-devices' -WindowStyle Hidden -Wait -ErrorAction SilentlyContinue
    }
} catch {
    Write-Warn2 "Cihaz taramasi yapilamadi: $($_.Exception.Message)"
}
#endregion

#region 3) Cihazlari listele + kulaklik tespiti
Write-Head '3) Ses Cihazlari Tespiti'
$renderDevices = @(); $captureDevices = @()
if ($audioReady) {
    try { $renderDevices  = [DcsAudio.AudioApi]::List(0) } catch { Write-Warn2 "Oynatma cihazlari okunamadi: $($_.Exception.Message)" }
    try { $captureDevices = [DcsAudio.AudioApi]::List(1) } catch { Write-Warn2 "Kayit cihazlari okunamadi: $($_.Exception.Message)" }
}

function Show-And-FixDevices {
    param($Devices, [string]$Title, [int]$Kind) # Kind 0=render 1=capture

    Write-Host "  ${Title}:" -ForegroundColor White
    $active = @()
    foreach ($d in $Devices) {
        $stateText = switch ($d.State) { 1 {'Aktif'} 2 {'Devre disi'} 4 {'Yok'} 8 {'Cikarilmis'} default {"$($d.State)"} }
        $mark = if ($d.IsDefault) { '*' } else { ' ' }
        $volTxt = if ($d.Volume -ge 0) { (" ses:{0}% {1}" -f [int]($d.Volume*100), $(if($d.Mute){'(SESSIZ)'}else{''})) } else { '' }
        Write-Host ("   $mark [$stateText] $($d.Name)$volTxt") -ForegroundColor $(if($d.IsDefault){'Green'}else{'Gray'})
        Write-Log "  Cihaz($Title): $($d.Name) durum=$stateText default=$($d.IsDefault) vol=$($d.Volume) mute=$($d.Mute)"
        if ($d.State -eq 1) { $active += $d }
    }

    if (-not $active) { Write-Warn2 "Aktif $Title cihazi yok. Kulakligin takili oldugundan emin olun."; $issues.Add("Aktif $Title cihazi yok"); return }

    $headset = $active | Where-Object { Test-IsHeadset $_.Name } | Select-Object -First 1
    if (-not $headset) {
        Write-Warn2 "USB kulaklik olarak taninan bir $Title cihazi bulunamadi."
        $issues.Add("Kulaklik taninmadi ($Title)")
        return
    }

    Write-Ok "Kulaklik bulundu: $($headset.Name)"

    if (-not $headset.IsDefault) {
        $issues.Add("Kulaklik varsayilan degil ($Title): $($headset.Name)")
        if (Confirm-Fix "Kulakligi varsayilan $Title cihazi yapalim mi?") {
            try { [DcsAudio.AudioApi]::SetDefault($headset.Id); Write-Ok "Varsayilan $Title cihazi ayarlandi: $($headset.Name)"; $fixed.Add("Varsayilan ${Title}: $($headset.Name)") }
            catch { Write-Err2 "Varsayilan cihaz ayarlanamadi: $($_.Exception.Message)" }
        }
    } else {
        Write-Ok "Kulaklik zaten varsayilan $Title cihazi."
    }

    if ($headset.Mute -or ($headset.Volume -ge 0 -and $headset.Volume -lt 0.10)) {
        $issues.Add("Kulaklik sessiz/dusuk ses ($Title)")
        if (Confirm-Fix "Sesi acip %80 seviyesine getirelim mi?") {
            try { [DcsAudio.AudioApi]::SetVolume($headset.Id, 0.80, $false); Write-Ok "Ses acildi ve %80 yapildi."; $fixed.Add("Ses %80 + mute kaldirildi ($Title)") }
            catch { Write-Err2 "Ses ayarlanamadi: $($_.Exception.Message)" }
        }
    }
}

if ($audioReady) {
    Show-And-FixDevices -Devices $renderDevices -Title 'Oynatma (Hoparlor/Kulaklik)' -Kind 0
    Write-Host ''
    Show-And-FixDevices -Devices $captureDevices -Title 'Kayit (Mikrofon)' -Kind 1
} else {
    Write-Warn2 "Ses API'si kullanilamadigi icin cihaz duzeltmeleri atlandi."
}
#endregion

#region 4) Mikrofon gizlilik erisimi
Write-Head '4) Mikrofon Gizlilik Erisimi'
$consentPaths = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone',
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
)
foreach ($p in $consentPaths) {
    try {
        if (Test-Path $p) {
            $val = (Get-ItemProperty -Path $p -Name 'Value' -ErrorAction SilentlyContinue).Value
            if ($val -ne 'Allow') {
                Write-Warn2 "Mikrofon erisimi kapali: $p"
                $issues.Add('Mikrofon gizlilik erisimi kapali')
                if (Confirm-Fix 'Mikrofon erisimini acalim mi?') {
                    try { Set-ItemProperty -Path $p -Name 'Value' -Value 'Allow' -ErrorAction Stop; Write-Ok "Mikrofon erisimi acildi: $p"; $fixed.Add('Mikrofon erisimi acildi') }
                    catch { Write-Err2 "Ayarlanamadi (yonetici gerekli olabilir): $p" }
                }
            } else {
                Write-Ok "Mikrofon erisimi acik: $p"
            }
        }
    } catch { Write-Warn2 "Kontrol edilemedi: $p" }
}
#endregion

#region Ozet + rapor
Write-Head 'OZET'
if ($issues.Count -eq 0) {
    Write-Host '  Herhangi bir sorun tespit edilmedi. Kulakliginiz calismaya hazir gorunuyor.' -ForegroundColor Green
} else {
    Write-Host ("  Tespit edilen sorun sayisi : {0}" -f $issues.Count) -ForegroundColor Yellow
    Write-Host ("  Uygulanan duzeltme sayisi  : {0}" -f $fixed.Count) -ForegroundColor Green
    if ($DiagnoseOnly) { Write-Host '  (Teshis modu oldugu icin degisiklik yapilmadi.)' -ForegroundColor Yellow }
}

$logPath = Join-Path ([Environment]::GetFolderPath('Desktop')) ("DCS-Kulaklik-Onarim-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
try {
    $header = @(
        "$script:AppName v$script:Version",
        "Gelistiren : $script:Author",
        "Tarih      : $(Get-Date)",
        "Bilgisayar : $env:COMPUTERNAME",
        "Kullanici  : $env:USERNAME",
        "Yonetici   : $(Test-Admin)",
        ('-' * 50),
        'TESPIT EDILEN SORUNLAR:',
        $(if ($issues.Count) { ($issues | ForEach-Object { "  - $_" }) -join "`r`n" } else { '  (yok)' }),
        '',
        'UYGULANAN DUZELTMELER:',
        $(if ($fixed.Count) { ($fixed | ForEach-Object { "  - $_" }) -join "`r`n" } else { '  (yok)' }),
        ('-' * 50),
        'AYRINTILI GUNLUK:'
    ) -join "`r`n"
    ($header + "`r`n" + ($script:LogLines -join "`r`n")) | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host ("`n  Teshis raporu kaydedildi:`n  $logPath") -ForegroundColor Cyan
} catch {
    Write-Warn2 "Rapor yazilamadi: $($_.Exception.Message)"
}

if ($issues.Count -gt $fixed.Count -and -not $DiagnoseOnly) {
    Write-Host "`n  Bazi sorunlar cozulemedi. IT ekibinden yardim alin:" -ForegroundColor Yellow
    Write-Host "  Rocket.Chat: $script:RocketChat" -ForegroundColor White
    Write-Host '  Raporu (masaustundeki .log dosyasi) ve AnyDesk ID''nizi paylasin.' -ForegroundColor Gray
    if (Confirm-Fix 'Rocket.Chat''i simdi acalim mi?') { Start-Process $script:RocketChat }
}

Write-Host "`n  Islem tamamlandi. Kapatmak icin bir tusa basin..." -ForegroundColor DarkGray
try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
#endregion

# ==============================================================================
#  Son. Kod: Bayram Can Aslan (DCS Communication Center) - Temmuz 2026
# ==============================================================================
