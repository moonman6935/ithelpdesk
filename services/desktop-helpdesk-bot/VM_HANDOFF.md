# VM Handoff — IT Helpdesk Desktop Bot

Bu dosya, ana makinedeki Cursor sohbetinin ozetidir. VM'de yeni Agent acip su mesaji yaz:

```
@services/desktop-helpdesk-bot/VM_HANDOFF.md dosyasini oku ve bot kurulumuna devam et.
```

## Kararlar (bu sohbette netlesti)

- **Yol B:** Rocket.Chat API token YOK. Chrome'da kanal acik kalir, bot Playwright CDP ile sekmeye baglanir.
- **Akis:** Yeni mesaj + AnyDesk ID → "Isleme alindi, baglaniliyor" → AnyDesk baglan → uzak PC'de HeadsetRepair → kes → "Islem tamamlandi"
- **Kapsam (varsayilan):** Sadece ses/kulaklik anahtar kelimeli talepler (`AUDIO_KEYWORDS_ONLY=true`)
- **Rocket.Chat:** https://rocket.dmc-rz.com — kanal `#IT_Helpdesk`
- **Bot kullanicisi:** Sen VM'de Rocket.Chat bot hesabini acacaksin, Chrome'da giris yapip kanali acik birakacaksin

## Repodaki bot

Konum: `services/desktop-helpdesk-bot/`

| Dosya | Is |
|-------|-----|
| `bot.py` | Ana dongu |
| `rocketchat_browser.py` | Acik Chrome'dan mesaj oku/yaz |
| `parser.py` | AnyDesk ID parse |
| `anydesk.ps1` | Baglan / kes |
| `remote_repair.ps1` | Uzak PC'de HeadsetRepair.ps1 -AutoYes |
| `start-chrome.ps1` | Chrome debug modda ac |
| `install.ps1` | pip + playwright kur |
| `.env.example` | Ayar sablonu |

## VM kurulum (sirayla)

```powershell
cd C:\...\ithelpdesk\services\desktop-helpdesk-bot
git pull
.\install.ps1
copy .env.example .env
# .env duzenle: BOT_DISPLAY_NAME, HEADSET_REPAIR_PS1_URL, istege bagli ANYDESK_PASSWORD
.\start-chrome.ps1
# Bot hesabi ile Rocket.Chat giris, IT_Helpdesk acik birak
.\start-bot.ps1
```

## .env icinde mutlaka guncelle

- `BOT_DISPLAY_NAME` — bot hesabinin Rocket.Chat gorunen adi
- `HEADSET_REPAIR_PS1_URL` — HeadsetRepair.ps1 raw URL (GitHub raw veya Vercel)
- `ANYDESK_PASSWORD` — varsa unattended; yoksa personel AnyDesk'te kabul etmeli

## Onemli notlar

- Cursor sohbet gecmisi makineler arasi **otomatik tasinmaz** (local saklanir).
- Kod icin: ana makinede commit + push, VM'de `git pull`.
- VM kilitlenmemeli; Chrome + AnyDesk acik kalmali.
- Mevcut kulaklik araci: `tools/headset-repair/HeadsetRepair.ps1` (`-AutoYes`).

## Sonraki adimlar (VM'de agent'a soyle)

1. `.env` olustur ve test et
2. Chrome CDP baglantisini dogrula
3. Test mesaji ile uctan uca dene
4. Gerekirse Rocket.Chat DOM selector'larini `.env`'de ayarla
