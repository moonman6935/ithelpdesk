@echo off
title DCS IT - Agent Setup [fr]
:: DCS IT - Agent Ilk Kurulum Araci (fr)  ^|  Yazan: Bayram Can Aslan
:: Sira: AnyDesk -> Rocket.Chat -> Citrix -> Ses -> CAG / Rocket

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "PS1=%TEMP%\DCS-Agent-Ilk-Kurulum-fr.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m='###AGENT'+'_SETUP_PAYLOAD###'; $raw=Get-Content -LiteralPath '%~f0' -Raw -Encoding UTF8; $i=$raw.IndexOf($m); if($i -ge 0){ Set-Content -LiteralPath (Join-Path $env:TEMP 'DCS-Agent-Ilk-Kurulum-fr.ps1') -Value $raw.Substring($i+$m.Length) -Encoding UTF8 }"
if not exist "%PS1%" (
    echo [X] Setup script extract failed.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -Lang fr
set "ERR=%ERRORLEVEL%"
del "%PS1%" >nul 2>&1
if not "%ERR%"=="0" (
    echo.
    echo [X] Setup ended with error. Code: %ERR%
    pause
)
exit /b %ERR%
###AGENT_SETUP_PAYLOAD###
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
    [switch]$SkipOpen,
    [ValidateSet('tr','de','en','fr','ka','')]
    [string]$Lang = ''
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.SecurityProtocolType]::Tls12 -bor
        [Net.SecurityProtocolType]::Tls11 -bor
        [Net.SecurityProtocolType]::Tls
} catch {}

# Build-time default language (overridden by -Lang). Marker replaced by build-bat.ps1
$script:BundledLang = 'fr'
if (-not $Lang) {
    if ($script:BundledLang -and $script:BundledLang -notmatch 'BUNDLED_LANG') { $Lang = $script:BundledLang }
    else { $Lang = 'de' }
}
$Lang = $Lang.ToLowerInvariant()
if (@('tr','de','en','fr','ka') -notcontains $Lang) { $Lang = 'de' }
$script:Lang = $Lang

# Load UI strings (same folder when running as .ps1; inlined by build-bat.ps1 for .cmd)
# DCS Agent setup UI strings - Bayram Can Aslan
# Used by AgentFirstSetup.ps1 via T 'key' / T 'key' @($a)

$script:UiCatalog = @{
  tr = @{
    AppTitle = 'DCS IT - Agent Ilk Kurulum'
    BannerTitle = 'DCS IT - AGENT ILK KURULUM ARACI'
    VersionLine = 'Surum {0}'
    AuthorLine = 'Gelistiren: {0}'
    OrderLine = 'Kurulum sirasi: AnyDesk -> Rocket.Chat -> Citrix -> Ses -> CAG/Rocket'
    Elevating = 'Yonetici haklari gerekiyor, yeniden baslatiliyor (UAC)...'
    ElevateFailed = 'Yonetici yukseltmesi iptal edildi. Kurulum icin Yonetici izni zorunludur.'
    PressKey = 'Kapatmak icin bir tusa basin...'
    Downloading = 'Indiriliyor'
    Source = 'Kaynak: {0}'
    Method = 'Yontem: {0}'
    DownloadOk = '{0} indirme tamam ({1}, {2})'
    DownloadBad = '{0}: dosya bozuk veya cok kucuk'
    HeadAnyDesk = '1) AnyDesk'
    HeadRocket = '2) Rocket.Chat Desktop'
    HeadCitrix = '3) Citrix Workspace'
    HeadAudio = '4) Ses servisleri ve mikrofon erisimi'
    HeadOpen = '5) CAG ve Rocket.Chat aciliyor'
    HeadReport = 'RAPOR'
    Already = 'Zaten kurulu'
    Installed = 'Kuruldu'
    Failed = 'Basarisiz'
    Error = 'Hata'
    DownloadFail = 'Indirme basarisiz'
    Skipped = 'Atlandi'
    Partial = 'Kismi / uyarili'
    OkStatus = 'Tamam'
    AnyDeskAlready = 'AnyDesk zaten kurulu: {0}'
    AnyDeskSilent = 'AnyDesk sessiz kuruluyor...'
    AnyDeskOk = 'AnyDesk kuruldu.'
    AnyDeskVerifyFail = 'AnyDesk kurulumu dogrulanamadi (kod {0}).'
    AnyDeskFail = 'AnyDesk kurulamadi: {0}'
    AnyDeskDlFail = 'AnyDesk indirilemedi.'
    RocketAlready = 'Rocket.Chat zaten kurulu: {0}'
    RocketQuery = 'Rocket.Chat son surum GitHub uzerinden sorgulaniyor...'
    RocketVer = 'Rocket.Chat surum: {0} ({1})'
    RocketPinned = 'Sabit Rocket.Chat indirme adresi kullanilacak.'
    RocketSilent = 'Rocket.Chat sessiz kuruluyor (/S /allusers)...'
    RocketOk = 'Rocket.Chat kuruldu.'
    RocketRetry = 'Rocket.Chat dogrulama belirsiz (kod {0}) - /currentuser ile tekrar deneniyor...'
    RocketOkUser = 'Rocket.Chat kuruldu (current user).'
    RocketVerifyFail = 'Rocket.Chat kurulumu dogrulanamadi.'
    RocketFail = 'Rocket.Chat kurulamadi: {0}'
    RocketDlFail = 'Rocket.Chat indirilemedi.'
    CitrixAlready = 'Citrix zaten kurulu: {0} ({1})'
    CitrixSilent = 'Citrix Workspace sessiz kuruluyor (5-15 dk surebilir)...'
    CitrixOk = 'Citrix kurulum sonucu OK (kod {0})'
    CitrixReboot = 'Citrix icin yeniden baslatma onerilir.'
    CitrixFailCode = 'Citrix kurulumu basarisiz (kod {0}).'
    CitrixFail = 'Citrix kurulamadi: {0}'
    CitrixDlFail = 'Citrix indirilemedi.'
    AudioSkip = 'Ses adimi atlandi (-SkipAudio).'
    SvcStarting = '{0} baslatiliyor...'
    SvcRunning = '{0} calisiyor.'
    SvcAlready = '{0} zaten calisiyor.'
    MicSystem = 'Mikrofon erisimi (sistem) Allow olarak ayarlandi.'
    MicUser = 'Mikrofon erisimi (kullanici) Allow olarak ayarlandi.'
    MicWarn = 'Mikrofon erisim ayari: {0}'
    MicUserWarn = 'Kullanici mikrofon ayari: {0}'
    AudioNote = 'Not: USB kulakligi varsayilan yapmak icin DCS-Kulaklik-Onarim aracini ayrica calistirabilirsiniz.'
    OpenSkip = 'URL acma atlandi (-SkipOpen).'
    BrowserCag = 'Tarayici: {0}'
    CagOpened = 'CAG tarayicida acildi.'
    CagFail = 'CAG acilamadi: {0}'
    RocketLaunch = 'Rocket.Chat uygulamasi baslatiliyor: {0}'
    RocketOpened = 'Rocket.Chat uygulamasi acildi.'
    RocketLaunchFail = 'Rocket.Chat uygulamasi acilamadi: {0}'
    RocketMissing = 'Rocket.Chat.exe bulunamadi; tarayici ile acilacak.'
    RocketUrl = 'Rocket.Chat sunucu adresi: {0}'
    RocketUrlOpened = 'rocket.dmc-rz.com tarayicida acildi.'
    RocketUrlFail = 'Rocket URL acilamadi: {0}'
    OpenOk = 'CAG/Rocket acilis'
    Summary = 'Kurulum ozeti:'
    Report = 'Rapor : {0}'
    ReportFail = 'Rapor yazilamadi: {0}'
    LogAuthor = 'Gelistiren'
    LogDate = 'Tarih'
    LogPc = 'Bilgisayar'
    LogUser = 'Kullanici'
    LogAdmin = 'Yonetici'
    LogSummary = 'OZET:'
    LogDetail = 'AYRINTILI GUNLUK:'
    GhFail = 'GitHub sorgu basarisiz: {0}'
  }
  de = @{
    AppTitle = 'DCS IT - Personal-Ersteinrichtung'
    BannerTitle = 'DCS IT - PERSONAL-ERSTEINRICHTUNG'
    VersionLine = 'Version {0}'
    AuthorLine = 'Erstellt von: {0}'
    OrderLine = 'Reihenfolge: AnyDesk -> Rocket.Chat -> Citrix -> Audio -> CAG/Rocket'
    Elevating = 'Administratorrechte erforderlich, Neustart (UAC)...'
    ElevateFailed = 'Administrator-Erhöhung abgebrochen. Administratorrechte sind erforderlich.'
    PressKey = 'Taste drucken zum Schliessen...'
    Downloading = 'Download'
    Source = 'Quelle: {0}'
    Method = 'Methode: {0}'
    DownloadOk = '{0} Download fertig ({1}, {2})'
    DownloadBad = '{0}: Datei beschadigt oder zu klein'
    HeadAnyDesk = '1) AnyDesk'
    HeadRocket = '2) Rocket.Chat Desktop'
    HeadCitrix = '3) Citrix Workspace'
    HeadAudio = '4) Audiodienste und Mikrofonzugriff'
    HeadOpen = '5) CAG und Rocket.Chat werden geoffnet'
    HeadReport = 'BERICHT'
    Already = 'Bereits installiert'
    Installed = 'Installiert'
    Failed = 'Fehlgeschlagen'
    Error = 'Fehler'
    DownloadFail = 'Download fehlgeschlagen'
    Skipped = 'Ubersprungen'
    Partial = 'Teilweise / Warnung'
    OkStatus = 'OK'
    AnyDeskAlready = 'AnyDesk ist bereits installiert: {0}'
    AnyDeskSilent = 'AnyDesk wird still installiert...'
    AnyDeskOk = 'AnyDesk installiert.'
    AnyDeskVerifyFail = 'AnyDesk-Installation nicht bestatigt (Code {0}).'
    AnyDeskFail = 'AnyDesk konnte nicht installiert werden: {0}'
    AnyDeskDlFail = 'AnyDesk konnte nicht heruntergeladen werden.'
    RocketAlready = 'Rocket.Chat ist bereits installiert: {0}'
    RocketQuery = 'Neueste Rocket.Chat-Version wird von GitHub abgefragt...'
    RocketVer = 'Rocket.Chat Version: {0} ({1})'
    RocketPinned = 'Feste Rocket.Chat-Download-URL wird verwendet.'
    RocketSilent = 'Rocket.Chat wird still installiert (/S /allusers)...'
    RocketOk = 'Rocket.Chat installiert.'
    RocketRetry = 'Rocket.Chat-Prufung unklar (Code {0}) - Retry mit /currentuser...'
    RocketOkUser = 'Rocket.Chat installiert (aktueller Benutzer).'
    RocketVerifyFail = 'Rocket.Chat-Installation nicht bestatigt.'
    RocketFail = 'Rocket.Chat konnte nicht installiert werden: {0}'
    RocketDlFail = 'Rocket.Chat konnte nicht heruntergeladen werden.'
    CitrixAlready = 'Citrix ist bereits installiert: {0} ({1})'
    CitrixSilent = 'Citrix Workspace wird still installiert (kann 5-15 Min. dauern)...'
    CitrixOk = 'Citrix-Installation OK (Code {0})'
    CitrixReboot = 'Neustart fur Citrix empfohlen.'
    CitrixFailCode = 'Citrix-Installation fehlgeschlagen (Code {0}).'
    CitrixFail = 'Citrix konnte nicht installiert werden: {0}'
    CitrixDlFail = 'Citrix konnte nicht heruntergeladen werden.'
    AudioSkip = 'Audio-Schritt ubersprungen (-SkipAudio).'
    SvcStarting = '{0} wird gestartet...'
    SvcRunning = '{0} lauft.'
    SvcAlready = '{0} lauft bereits.'
    MicSystem = 'Mikrofonzugriff (System) auf Allow gesetzt.'
    MicUser = 'Mikrofonzugriff (Benutzer) auf Allow gesetzt.'
    MicWarn = 'Mikrofonzugriff-Einstellung: {0}'
    MicUserWarn = 'Benutzer-Mikrofon-Einstellung: {0}'
    AudioNote = 'Hinweis: Fur Standard-Headset DCS-Kulaklik-Onarim separat ausfuhren.'
    OpenSkip = 'URL-Offnen ubersprungen (-SkipOpen).'
    BrowserCag = 'Browser: {0}'
    CagOpened = 'CAG im Browser geoffnet.'
    CagFail = 'CAG konnte nicht geoffnet werden: {0}'
    RocketLaunch = 'Rocket.Chat-App wird gestartet: {0}'
    RocketOpened = 'Rocket.Chat-App geoffnet.'
    RocketLaunchFail = 'Rocket.Chat-App konnte nicht gestartet werden: {0}'
    RocketMissing = 'Rocket.Chat.exe nicht gefunden; Offnung im Browser.'
    RocketUrl = 'Rocket.Chat-Server: {0}'
    RocketUrlOpened = 'rocket.dmc-rz.com im Browser geoffnet.'
    RocketUrlFail = 'Rocket-URL konnte nicht geoffnet werden: {0}'
    OpenOk = 'CAG/Rocket Offnen'
    Summary = 'Installationsubersicht:'
    Report = 'Bericht : {0}'
    ReportFail = 'Bericht konnte nicht geschrieben werden: {0}'
    LogAuthor = 'Erstellt von'
    LogDate = 'Datum'
    LogPc = 'Computer'
    LogUser = 'Benutzer'
    LogAdmin = 'Administrator'
    LogSummary = 'ZUSAMMENFASSUNG:'
    LogDetail = 'DETAILPROTOKOLL:'
    GhFail = 'GitHub-Abfrage fehlgeschlagen: {0}'
  }
  en = @{
    AppTitle = 'DCS IT - Personnel First Setup'
    BannerTitle = 'DCS IT - PERSONNEL FIRST SETUP'
    VersionLine = 'Version {0}'
    AuthorLine = 'Author: {0}'
    OrderLine = 'Order: AnyDesk -> Rocket.Chat -> Citrix -> Audio -> CAG/Rocket'
    Elevating = 'Administrator rights required, restarting (UAC)...'
    ElevateFailed = 'Elevation cancelled. Administrator rights are required.'
    PressKey = 'Press any key to close...'
    Downloading = 'Downloading'
    Source = 'Source: {0}'
    Method = 'Method: {0}'
    DownloadOk = '{0} download complete ({1}, {2})'
    DownloadBad = '{0}: file corrupt or too small'
    HeadAnyDesk = '1) AnyDesk'
    HeadRocket = '2) Rocket.Chat Desktop'
    HeadCitrix = '3) Citrix Workspace'
    HeadAudio = '4) Audio services and microphone access'
    HeadOpen = '5) Opening CAG and Rocket.Chat'
    HeadReport = 'REPORT'
    Already = 'Already installed'
    Installed = 'Installed'
    Failed = 'Failed'
    Error = 'Error'
    DownloadFail = 'Download failed'
    Skipped = 'Skipped'
    Partial = 'Partial / warning'
    OkStatus = 'OK'
    AnyDeskAlready = 'AnyDesk already installed: {0}'
    AnyDeskSilent = 'Installing AnyDesk silently...'
    AnyDeskOk = 'AnyDesk installed.'
    AnyDeskVerifyFail = 'AnyDesk install not verified (code {0}).'
    AnyDeskFail = 'AnyDesk install failed: {0}'
    AnyDeskDlFail = 'AnyDesk could not be downloaded.'
    RocketAlready = 'Rocket.Chat already installed: {0}'
    RocketQuery = 'Querying latest Rocket.Chat release from GitHub...'
    RocketVer = 'Rocket.Chat version: {0} ({1})'
    RocketPinned = 'Using pinned Rocket.Chat download URL.'
    RocketSilent = 'Installing Rocket.Chat silently (/S /allusers)...'
    RocketOk = 'Rocket.Chat installed.'
    RocketRetry = 'Rocket.Chat verification unclear (code {0}) - retrying /currentuser...'
    RocketOkUser = 'Rocket.Chat installed (current user).'
    RocketVerifyFail = 'Rocket.Chat install not verified.'
    RocketFail = 'Rocket.Chat install failed: {0}'
    RocketDlFail = 'Rocket.Chat could not be downloaded.'
    CitrixAlready = 'Citrix already installed: {0} ({1})'
    CitrixSilent = 'Installing Citrix Workspace silently (may take 5-15 min)...'
    CitrixOk = 'Citrix install OK (code {0})'
    CitrixReboot = 'Reboot recommended for Citrix.'
    CitrixFailCode = 'Citrix install failed (code {0}).'
    CitrixFail = 'Citrix install failed: {0}'
    CitrixDlFail = 'Citrix could not be downloaded.'
    AudioSkip = 'Audio step skipped (-SkipAudio).'
    SvcStarting = 'Starting {0}...'
    SvcRunning = '{0} is running.'
    SvcAlready = '{0} already running.'
    MicSystem = 'Microphone access (system) set to Allow.'
    MicUser = 'Microphone access (user) set to Allow.'
    MicWarn = 'Microphone access setting: {0}'
    MicUserWarn = 'User microphone setting: {0}'
    AudioNote = 'Note: To set USB headset as default, run DCS-Kulaklik-Onarim separately.'
    OpenSkip = 'URL open skipped (-SkipOpen).'
    BrowserCag = 'Browser: {0}'
    CagOpened = 'CAG opened in browser.'
    CagFail = 'Could not open CAG: {0}'
    RocketLaunch = 'Starting Rocket.Chat app: {0}'
    RocketOpened = 'Rocket.Chat app opened.'
    RocketLaunchFail = 'Could not start Rocket.Chat app: {0}'
    RocketMissing = 'Rocket.Chat.exe not found; opening in browser.'
    RocketUrl = 'Rocket.Chat server: {0}'
    RocketUrlOpened = 'rocket.dmc-rz.com opened in browser.'
    RocketUrlFail = 'Could not open Rocket URL: {0}'
    OpenOk = 'CAG/Rocket open'
    Summary = 'Setup summary:'
    Report = 'Report : {0}'
    ReportFail = 'Could not write report: {0}'
    LogAuthor = 'Author'
    LogDate = 'Date'
    LogPc = 'Computer'
    LogUser = 'User'
    LogAdmin = 'Admin'
    LogSummary = 'SUMMARY:'
    LogDetail = 'DETAILED LOG:'
    GhFail = 'GitHub query failed: {0}'
  }
  fr = @{
    AppTitle = 'DCS IT - Premiere installation du personnel'
    BannerTitle = 'DCS IT - PREMIERE INSTALLATION DU PERSONNEL'
    VersionLine = 'Version {0}'
    AuthorLine = 'Auteur : {0}'
    OrderLine = 'Ordre : AnyDesk -> Rocket.Chat -> Citrix -> Audio -> CAG/Rocket'
    Elevating = 'Droits administrateur requis, redemarrage (UAC)...'
    ElevateFailed = 'Elevation annulee. Les droits administrateur sont obligatoires.'
    PressKey = 'Appuyez sur une touche pour fermer...'
    Downloading = 'Telechargement'
    Source = 'Source : {0}'
    Method = 'Methode : {0}'
    DownloadOk = 'Telechargement {0} termine ({1}, {2})'
    DownloadBad = '{0} : fichier corrompu ou trop petit'
    HeadAnyDesk = '1) AnyDesk'
    HeadRocket = '2) Rocket.Chat Desktop'
    HeadCitrix = '3) Citrix Workspace'
    HeadAudio = '4) Services audio et acces microphone'
    HeadOpen = '5) Ouverture de CAG et Rocket.Chat'
    HeadReport = 'RAPPORT'
    Already = 'Deja installe'
    Installed = 'Installe'
    Failed = 'Echec'
    Error = 'Erreur'
    DownloadFail = 'Echec du telechargement'
    Skipped = 'Ignore'
    Partial = 'Partiel / avertissement'
    OkStatus = 'OK'
    AnyDeskAlready = 'AnyDesk est deja installe : {0}'
    AnyDeskSilent = 'Installation silencieuse d''AnyDesk...'
    AnyDeskOk = 'AnyDesk installe.'
    AnyDeskVerifyFail = 'Installation AnyDesk non verifiee (code {0}).'
    AnyDeskFail = 'Echec installation AnyDesk : {0}'
    AnyDeskDlFail = 'Impossible de telecharger AnyDesk.'
    RocketAlready = 'Rocket.Chat est deja installe : {0}'
    RocketQuery = 'Interrogation de la derniere version Rocket.Chat sur GitHub...'
    RocketVer = 'Version Rocket.Chat : {0} ({1})'
    RocketPinned = 'URL de telechargement Rocket.Chat fixe utilisee.'
    RocketSilent = 'Installation silencieuse de Rocket.Chat (/S /allusers)...'
    RocketOk = 'Rocket.Chat installe.'
    RocketRetry = 'Verification Rocket.Chat incertaine (code {0}) - nouvel essai /currentuser...'
    RocketOkUser = 'Rocket.Chat installe (utilisateur actuel).'
    RocketVerifyFail = 'Installation Rocket.Chat non verifiee.'
    RocketFail = 'Echec installation Rocket.Chat : {0}'
    RocketDlFail = 'Impossible de telecharger Rocket.Chat.'
    CitrixAlready = 'Citrix est deja installe : {0} ({1})'
    CitrixSilent = 'Installation silencieuse de Citrix Workspace (5-15 min)...'
    CitrixOk = 'Installation Citrix OK (code {0})'
    CitrixReboot = 'Redemarrage recommande pour Citrix.'
    CitrixFailCode = 'Echec installation Citrix (code {0}).'
    CitrixFail = 'Echec installation Citrix : {0}'
    CitrixDlFail = 'Impossible de telecharger Citrix.'
    AudioSkip = 'Etape audio ignoree (-SkipAudio).'
    SvcStarting = 'Demarrage de {0}...'
    SvcRunning = '{0} est en cours d''execution.'
    SvcAlready = '{0} est deja en cours d''execution.'
    MicSystem = 'Acces microphone (systeme) defini sur Allow.'
    MicUser = 'Acces microphone (utilisateur) defini sur Allow.'
    MicWarn = 'Reglage acces microphone : {0}'
    MicUserWarn = 'Reglage microphone utilisateur : {0}'
    AudioNote = 'Note : pour definir le casque USB par defaut, lancez DCS-Kulaklik-Onarim separement.'
    OpenSkip = 'Ouverture URL ignoree (-SkipOpen).'
    BrowserCag = 'Navigateur : {0}'
    CagOpened = 'CAG ouvert dans le navigateur.'
    CagFail = 'Impossible d''ouvrir CAG : {0}'
    RocketLaunch = 'Demarrage de Rocket.Chat : {0}'
    RocketOpened = 'Application Rocket.Chat ouverte.'
    RocketLaunchFail = 'Impossible de demarrer Rocket.Chat : {0}'
    RocketMissing = 'Rocket.Chat.exe introuvable ; ouverture dans le navigateur.'
    RocketUrl = 'Serveur Rocket.Chat : {0}'
    RocketUrlOpened = 'rocket.dmc-rz.com ouvert dans le navigateur.'
    RocketUrlFail = 'Impossible d''ouvrir l''URL Rocket : {0}'
    OpenOk = 'Ouverture CAG/Rocket'
    Summary = 'Resume de l''installation :'
    Report = 'Rapport : {0}'
    ReportFail = 'Impossible d''ecrire le rapport : {0}'
    LogAuthor = 'Auteur'
    LogDate = 'Date'
    LogPc = 'Ordinateur'
    LogUser = 'Utilisateur'
    LogAdmin = 'Admin'
    LogSummary = 'RESUME :'
    LogDetail = 'JOURNAL DETAILLE :'
    GhFail = 'Echec requete GitHub : {0}'
  }
  ka = @{
    AppTitle = 'DCS IT - Personalis pirveli daqeneba'
    BannerTitle = 'DCS IT - PERSONALI PIRVELI DAQENEBA'
    VersionLine = 'Versia {0}'
    AuthorLine = 'Avtori: {0}'
    OrderLine = 'Rigit: AnyDesk -> Rocket.Chat -> Citrix -> Audio -> CAG/Rocket'
    Elevating = 'Administratori unda, UAC-it handehis...'
    ElevateFailed = 'Administratoris uflebebi gaukmebulia. Administratori unda.'
    PressKey = 'Dasaxuravad daachiret klavis...'
    Downloading = 'Chamotvirtva'
    Source = 'Tsqaro: {0}'
    Method = 'Metode: {0}'
    DownloadOk = '{0} chamotvirtva dasrulda ({1}, {2})'
    DownloadBad = '{0}: faili dazianebulia an pataraa'
    HeadAnyDesk = '1) AnyDesk'
    HeadRocket = '2) Rocket.Chat Desktop'
    HeadCitrix = '3) Citrix Workspace'
    HeadAudio = '4) Audio servisebi da mikrofonebi'
    HeadOpen = '5) CAG da Rocket.Chat iksneba'
    HeadReport = 'ANGARISHI'
    Already = 'Ukve daqenebulia'
    Installed = 'Daqenebulia'
    Failed = 'Ver mokherchda'
    Error = 'Sheldoma'
    DownloadFail = 'Chamotvirtva ver mokherchda'
    Skipped = 'Gamotovebulia'
    Partial = 'Natsilobrivi / gaftrikhileba'
    OkStatus = 'OK'
    AnyDeskAlready = 'AnyDesk ukve daqenebulia: {0}'
    AnyDeskSilent = 'AnyDesk chumat deqeneba...'
    AnyDeskOk = 'AnyDesk daqenebulia.'
    AnyDeskVerifyFail = 'AnyDesk ver dadasturda (kodi {0}).'
    AnyDeskFail = 'AnyDesk ver daqenda: {0}'
    AnyDeskDlFail = 'AnyDesk ver chamotvirta.'
    RocketAlready = 'Rocket.Chat ukve daqenebulia: {0}'
    RocketQuery = 'Rocket.Chat bolo versia GitHub-dan...'
    RocketVer = 'Rocket.Chat versia: {0} ({1})'
    RocketPinned = 'Iqneba pin Rocket.Chat URL.'
    RocketSilent = 'Rocket.Chat chumat deqeneba (/S /allusers)...'
    RocketOk = 'Rocket.Chat daqenebulia.'
    RocketRetry = 'Rocket.Chat dadastureba gaurkvevelia (kodi {0}) - /currentuser...'
    RocketOkUser = 'Rocket.Chat daqenebulia (momkhmarebeli).'
    RocketVerifyFail = 'Rocket.Chat ver dadasturda.'
    RocketFail = 'Rocket.Chat ver daqenda: {0}'
    RocketDlFail = 'Rocket.Chat ver chamotvirta.'
    CitrixAlready = 'Citrix ukve daqenebulia: {0} ({1})'
    CitrixSilent = 'Citrix Workspace chumat deqeneba (5-15 tsuti)...'
    CitrixOk = 'Citrix OK (kodi {0})'
    CitrixReboot = 'Citrix-istvis gadatvirtva sashualeba.'
    CitrixFailCode = 'Citrix ver mokherchda (kodi {0}).'
    CitrixFail = 'Citrix ver daqenda: {0}'
    CitrixDlFail = 'Citrix ver chamotvirta.'
    AudioSkip = 'Audio gamotovebulia (-SkipAudio).'
    SvcStarting = '{0} iwyeba...'
    SvcRunning = '{0} mushaobs.'
    SvcAlready = '{0} ukve mushaobs.'
    MicSystem = 'Mikrofonebis access (sistema) Allow.'
    MicUser = 'Mikrofonebis access (momkhmarebeli) Allow.'
    MicWarn = 'Mikrofonebis parametrebi: {0}'
    MicUserWarn = 'Momkhmareblis mikrofonebi: {0}'
    AudioNote = 'Shenishvna: USB headset-istvis gaushvit DCS-Kulaklik-Onarim.'
    OpenSkip = 'URL gamotovebulia (-SkipOpen).'
    BrowserCag = 'Brauzeri: {0}'
    CagOpened = 'CAG gaikhsna brauzershi.'
    CagFail = 'CAG ver gaikhsna: {0}'
    RocketLaunch = 'Rocket.Chat iwyeba: {0}'
    RocketOpened = 'Rocket.Chat gaikhsna.'
    RocketLaunchFail = 'Rocket.Chat ver gaikhsna: {0}'
    RocketMissing = 'Rocket.Chat.exe ver moidzebna; brauzeri.'
    RocketUrl = 'Rocket.Chat serveri: {0}'
    RocketUrlOpened = 'rocket.dmc-rz.com gaikhsna brauzershi.'
    RocketUrlFail = 'Rocket URL ver gaikhsna: {0}'
    OpenOk = 'CAG/Rocket gakhsna'
    Summary = 'Daqenebis shejamamebeli:'
    Report = 'Angarishi : {0}'
    ReportFail = 'Angarishi ver chaitsera: {0}'
    LogAuthor = 'Avtori'
    LogDate = 'Tarighi'
    LogPc = 'Kompiuteri'
    LogUser = 'Momkhmarebeli'
    LogAdmin = 'Admini'
    LogSummary = 'SHEJAMEBA:'
    LogDetail = 'DETAURI ZHURNALI:'
    GhFail = 'GitHub shecdoma: {0}'
  }
}
if (-not $script:UiCatalog) {
    $uiPath = Join-Path (Split-Path -Parent $PSCommandPath) 'UiStrings.ps1'
    if (Test-Path -LiteralPath $uiPath) { . $uiPath }
}
if (-not $script:UiCatalog) {
    Write-Host 'UI strings missing.' -ForegroundColor Red
}

function T {
    param([Parameter(Mandatory)][string]$Key, [object[]]$FormatArgs)
    $map = $null
    if ($script:UiCatalog -and $script:UiCatalog.ContainsKey($script:Lang)) {
        $map = $script:UiCatalog[$script:Lang]
    }
    if (-not $map) { $map = $script:UiCatalog['en'] }
    $s = $null
    if ($map -and $map.ContainsKey($Key)) { $s = [string]$map[$Key] }
    if (-not $s -and $script:UiCatalog['en'].ContainsKey($Key)) { $s = [string]$script:UiCatalog['en'][$Key] }
    if (-not $s) { $s = $Key }
    if ($FormatArgs -and $FormatArgs.Count -gt 0) {
        try { return ($s -f $FormatArgs) } catch { return $s }
    }
    return $s
}

$script:AppName     = (T 'AppTitle')
$script:Version     = '1.1.0'
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
    param([int]$Percent, [string]$Label = '', [long]$Received = -1, [long]$Total = -1)
    if (-not $Label) { $Label = (T 'Downloading') }
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
                else { Show-ProgressLine -Percent 0 -Label (T 'Downloading') -Received $received }
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
        Write-Step (T 'Source' @($url))
        foreach ($m in $methods) {
            try {
                Write-Step (T 'Method' @($m.Name))
                & $m.Fn $url $OutFile
                if (Test-ExeFile -Path $OutFile -MinBytes $MinBytes) {
                    Write-Ok (T 'DownloadOk' @($Label, $m.Name, (Format-Bytes (Get-Item $OutFile).Length)))
                    return $true
                }
                Write-Warn2 (T 'DownloadBad' @($m.Name))
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
        Write-Step (T 'RocketQuery')
        $headers = @{ 'User-Agent' = 'DCS-IT-Agent-Setup/1.0'; 'Accept' = 'application/vnd.github+json' }
        $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/RocketChat/Rocket.Chat.Electron/releases/latest' -Headers $headers -TimeoutSec 30
        $asset = $rel.assets | Where-Object { $_.name -match 'win\.exe$' -and $_.name -notmatch 'ia32|arm' } | Select-Object -First 1
        if (-not $asset) {
            $asset = $rel.assets | Where-Object { $_.name -match 'win\.exe$' } | Select-Object -First 1
        }
        if ($asset -and $asset.browser_download_url) {
            Write-Ok (T 'RocketVer' @($rel.tag_name, $asset.name))
            return [string]$asset.browser_download_url
        }
    } catch {
        Write-Warn2 (T 'GhFail' @($_.Exception.Message))
    }
    Write-Warn2 (T 'RocketPinned')
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
    Write-Host (T 'Elevating') -ForegroundColor Yellow
    try {
        $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Lang', $script:Lang)
        if ($Force) { $argList += '-Force' }
        if ($SkipAudio) { $argList += '-SkipAudio' }
        if ($SkipOpen) { $argList += '-SkipOpen' }
        Start-Process -FilePath (Get-Process -Id $PID).Path -Verb RunAs -ArgumentList $argList | Out-Null
        exit 0
    } catch {
        Write-Err2 (T 'ElevateFailed')
        Write-Host ("`n  {0}" -f (T 'PressKey')) -ForegroundColor DarkGray
        try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }
        exit 1
    }
}
#endregion

Clear-Host
Write-Host ''
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Host ('  #  ' + (T 'BannerTitle')) -ForegroundColor White
Write-Host ('  #  ' + (T 'VersionLine' @($script:Version)) + ' | ' + (T 'AuthorLine' @($script:Author))) -ForegroundColor DarkGray
Write-Host '  ####################################################' -ForegroundColor Blue
Write-Host ''
Write-Host ('  ' + (T 'OrderLine')) -ForegroundColor Cyan
Write-Host ('  Lang: ' + $script:Lang) -ForegroundColor DarkGray
Write-Log "$script:AppName v$script:Version basladi. Admin=$(Test-Admin) Force=$Force OS=$([Environment]::OSVersion.VersionString)"

#region 1) AnyDesk
Write-Head (T 'HeadAnyDesk')
$anyDeskExe = Find-InstalledApp -NamePattern 'AnyDesk' -ExePaths @(
    "${env:ProgramFiles(x86)}\AnyDesk\AnyDesk.exe",
    "$env:ProgramFiles\AnyDesk\AnyDesk.exe"
)
if ($anyDeskExe -and -not $Force) {
    Write-Ok (T 'AnyDeskAlready' @($anyDeskExe))
    Add-Result 'AnyDesk' (T 'Already')
} else {
    $installer = Join-Path $env:TEMP 'DCS-AnyDesk.exe'
    $ok = Invoke-Download -Urls $script:AnyDeskUrls -OutFile $installer -MinBytes $script:MinAnyDeskBytes -Label 'AnyDesk'
    if ($ok) {
        Write-Step (T 'AnyDeskSilent')
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
                Write-Ok (T 'AnyDeskOk')
                Add-Result 'AnyDesk' (T 'Installed')
                try { Start-Process -FilePath (Join-Path $installDir 'AnyDesk.exe') -ErrorAction SilentlyContinue } catch {}
            } else {
                Write-Err2 (T 'AnyDeskVerifyFail' @($code))
                Add-Result 'AnyDesk' ((T 'Failed') + " ($code)")
            }
        } catch {
            Write-Err2 (T 'AnyDeskFail' @($_.Exception.Message))
            Add-Result 'AnyDesk' (T 'Error')
        }
    } else {
        Write-Err2 (T 'AnyDeskDlFail')
        Add-Result 'AnyDesk' (T 'DownloadFail')
    }
}
#endregion

#region 2) Rocket.Chat
Write-Head (T 'HeadRocket')
$rocketExe = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
    "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
    "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe",
    "$env:ProgramFiles\Rocket.Chat\Rocket.Chat.exe",
    "${env:ProgramFiles(x86)}\Rocket.Chat\Rocket.Chat.exe"
)
if ($rocketExe -and -not $Force) {
    Write-Ok (T 'RocketAlready' @($rocketExe))
    Add-Result 'Rocket.Chat' (T 'Already')
} else {
    $rocketUrl = Get-RocketChatDownloadUrl
    $installer = Join-Path $env:TEMP 'DCS-RocketChat-Setup.exe'
    $ok = Invoke-Download -Urls @($rocketUrl) -OutFile $installer -MinBytes $script:MinRocketBytes -Label 'Rocket.Chat'
    if ($ok) {
        Write-Step (T 'RocketSilent')
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
                Write-Ok (T 'RocketOk')
                Add-Result 'Rocket.Chat' (T 'Installed')
            } else {
                Write-Warn2 (T 'RocketRetry' @($code))
                $proc2 = Start-Process -FilePath $installer -ArgumentList '/S','/currentuser' -Wait -PassThru -ErrorAction SilentlyContinue
                $code2 = if ($proc2 -and $null -ne $proc2.ExitCode) { [int]$proc2.ExitCode } else { -1 }
                Write-Log "Rocket.Chat currentuser cikis: $code2"
                $after2 = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
                    "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
                    "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe"
                )
                if ($after2) {
                    Write-Ok (T 'RocketOkUser')
                    Add-Result 'Rocket.Chat' (T 'Installed')
                } else {
                    Write-Err2 (T 'RocketVerifyFail')
                    Add-Result 'Rocket.Chat' (T 'Failed')
                }
            }
        } catch {
            Write-Err2 (T 'RocketFail' @($_.Exception.Message))
            Add-Result 'Rocket.Chat' (T 'Error')
        }
    } else {
        Write-Err2 (T 'RocketDlFail')
        Add-Result 'Rocket.Chat' (T 'DownloadFail')
    }
}
#endregion

#region 3) Citrix Workspace
Write-Head (T 'HeadCitrix')
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
    Write-Ok (T 'CitrixAlready' @($existingCitrix.Name, $existingCitrix.Version))
    Add-Result 'Citrix' (T 'Already')
} else {
    $installer = Join-Path $env:TEMP 'DCS-CitrixWorkspaceApp.exe'
    $ok = Invoke-Download -Urls $script:CitrixUrls -OutFile $installer -MinBytes $script:MinCitrixBytes -Label 'Citrix'
    if ($ok) {
        Write-Step (T 'CitrixSilent')
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
                Write-Ok (T 'CitrixOk' @($code))
                if ($after) { Write-Ok "$($after.Name) ($($after.Version))" }
                if ($code -eq 3010) { Write-Warn2 (T 'CitrixReboot') }
                Add-Result 'Citrix' (T 'Installed')
            } else {
                Write-Err2 (T 'CitrixFailCode' @($code))
                Add-Result 'Citrix' ((T 'Failed') + " ($code)")
            }
        } catch {
            Write-Err2 (T 'CitrixFail' @($_.Exception.Message))
            Add-Result 'Citrix' (T 'Error')
        }
    } else {
        Write-Err2 (T 'CitrixDlFail')
        Add-Result 'Citrix' (T 'DownloadFail')
    }
}
#endregion

#region 4) Ses ayarlari
Write-Head (T 'HeadAudio')
if ($SkipAudio) {
    Write-Warn2 (T 'AudioSkip')
    Add-Result 'Audio' (T 'Skipped')
} else {
    $audioOk = $true
    foreach ($svcName in @('Audiosrv', 'AudioEndpointBuilder')) {
        try {
            $svc = Get-Service -Name $svcName -ErrorAction Stop
            if ($svc.Status -ne 'Running') {
                Write-Step (T 'SvcStarting' @($svcName))
                Set-Service -Name $svcName -StartupType Automatic -ErrorAction SilentlyContinue
                Start-Service -Name $svcName -ErrorAction Stop
                Write-Ok (T 'SvcRunning' @($svcName))
            } else {
                Write-Ok (T 'SvcAlready' @($svcName))
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
        Write-Ok (T 'MicSystem')
    } catch {
        Write-Warn2 (T 'MicWarn' @($_.Exception.Message))
        $audioOk = $false
    }

    try {
        $userMic = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
        if (-not (Test-Path $userMic)) { New-Item -Path $userMic -Force | Out-Null }
        New-ItemProperty -Path $userMic -Name 'Value' -Value 'Allow' -PropertyType String -Force | Out-Null
        Write-Ok (T 'MicUser')
    } catch {
        Write-Warn2 (T 'MicUserWarn' @($_.Exception.Message))
    }

    if ($audioOk) { Add-Result 'Audio' (T 'OkStatus') } else { Add-Result 'Audio' (T 'Partial') }
    Write-Step (T 'AudioNote')
}
#endregion

#region 5) CAG + Rocket.Chat ac
Write-Head (T 'HeadOpen')
if ($SkipOpen) {
    Write-Warn2 (T 'OpenSkip')
    Add-Result (T 'OpenOk') (T 'Skipped')
} else {
    try {
        Write-Step (T 'BrowserCag' @($script:CagUrl))
        Start-Process $script:CagUrl | Out-Null
        Write-Ok (T 'CagOpened')
    } catch {
        Write-Warn2 (T 'CagFail' @($_.Exception.Message))
    }

    $rocketLaunch = Find-InstalledApp -NamePattern 'Rocket\.?Chat' -ExePaths @(
        "$env:LOCALAPPDATA\Programs\rocketchat\Rocket.Chat.exe",
        "$env:LOCALAPPDATA\Programs\Rocket.Chat\Rocket.Chat.exe",
        "$env:ProgramFiles\Rocket.Chat\Rocket.Chat.exe",
        "${env:ProgramFiles(x86)}\Rocket.Chat\Rocket.Chat.exe"
    )
    if ($rocketLaunch -and (Test-Path -LiteralPath $rocketLaunch)) {
        try {
            Write-Step (T 'RocketLaunch' @($rocketLaunch))
            Start-Process -FilePath $rocketLaunch -ErrorAction Stop | Out-Null
            Write-Ok (T 'RocketOpened')
        } catch {
            Write-Warn2 (T 'RocketLaunchFail' @($_.Exception.Message))
        }
    } else {
        Write-Warn2 (T 'RocketMissing')
    }

    try {
        Write-Step (T 'RocketUrl' @($script:RocketUrl))
        Start-Process $script:RocketUrl | Out-Null
        Write-Ok (T 'RocketUrlOpened')
        Add-Result (T 'OpenOk') (T 'OkStatus')
    } catch {
        Write-Warn2 (T 'RocketUrlFail' @($_.Exception.Message))
        Add-Result (T 'OpenOk') (T 'Partial')
    }
}
#endregion

#region Rapor
Write-Head (T 'HeadReport')
Write-Host ('  ' + (T 'Summary')) -ForegroundColor White
foreach ($line in $script:Results) {
    $color = if ($line -match [regex]::Escape((T 'Failed')) -or $line -match [regex]::Escape((T 'Error')) -or $line -match [regex]::Escape((T 'DownloadFail'))) { 'Red' } elseif ($line -match [regex]::Escape((T 'Partial')) -or $line -match [regex]::Escape((T 'Skipped'))) { 'Yellow' } else { 'Green' }
    Write-Host "   - $line" -ForegroundColor $color
}

$logPath = Join-Path ([Environment]::GetFolderPath('Desktop')) ("DCS-Agent-Ilk-Kurulum-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
try {
    $head = @(
        "$script:AppName v$script:Version",
        ("{0} : {1}" -f (T 'LogAuthor'), $script:Author),
        ("{0}      : {1}" -f (T 'LogDate'), (Get-Date)),
        ("{0} : {1}" -f (T 'LogPc'), $env:COMPUTERNAME),
        ("{0}  : {1}" -f (T 'LogUser'), $env:USERNAME),
        ("{0}   : {1}" -f (T 'LogAdmin'), (Test-Admin)),
        ('-' * 50),
        (T 'LogSummary')
    ) + $script:Results + @('', (T 'LogDetail'))
    ($head -join "`r`n") + "`r`n" + ($script:LogLines -join "`r`n") | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host ('  ' + (T 'Report' @($logPath))) -ForegroundColor Cyan
} catch {
    Write-Warn2 (T 'ReportFail' @($_.Exception.Message))
}

Write-Host ''
Write-Host "  CAG        : $script:CagUrl" -ForegroundColor Gray
Write-Host "  Rocket.Chat: $script:RocketUrl" -ForegroundColor Gray
Write-Host ("`n  " + (T 'PressKey')) -ForegroundColor DarkGray
try { [void][System.Console]::ReadKey($true) } catch { Read-Host | Out-Null }

$failed = @($script:Results | Where-Object { $_ -match [regex]::Escape((T 'Failed')) -or $_ -match [regex]::Escape((T 'Error')) -or $_ -match [regex]::Escape((T 'DownloadFail')) })
if ($failed.Count -gt 0) { exit 1 } else { exit 0 }
#endregion

# ==============================================================================
#  Son. Kod: Bayram Can Aslan (DCS Communication Center) - Temmuz 2026
# ==============================================================================
