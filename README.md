# DCS IT Destek

Frontend + API: **Vercel** · Veritabanı: **MongoDB Atlas** (ücretsiz)

## Vercel kurulumu (tek platform)

1. GitHub reposunu Vercel'e bağlayın.
2. **Root Directory:** `frontend`
3. **Environment Variables** (Production):

| Değişken | Açıklama |
|----------|----------|
| `MONGO_URL` | MongoDB Atlas bağlantı dizesi |
| `DB_NAME` | `it_helpdesk` |
| `SECRET_KEY` | JWT için rastgele uzun metin |

4. **Önemli:** `REACT_APP_API_URL` tanımlamayın veya boş bırakın. Eski değer `http://localhost:8000` ise silin — bu admin giriş hatasına yol açar.
5. Deploy edin.

API artık aynı sitede çalışır: `https://sizin-site.vercel.app/api/...`

Varsayılan admin (ilk girişte otomatik oluşur): **admin** / **admin123**

## MongoDB Atlas (ücretsiz)

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) → ücretsiz cluster oluşturun.
2. Database Access → kullanıcı + şifre.
3. Network Access → `0.0.0.0/0` (Vercel sunucuları için).
4. Connect → bağlantı dizesini kopyalayın → Vercel'de `MONGO_URL` olarak yapıştırın.

## Yerel geliştirme (isteğe bağlı)

```bash
cd frontend
npm install
npm start          # React → localhost:3000
```

Yerelde Python backend kullanmak için `backend/` klasöründe uvicorn çalıştırın; frontend otomatik `localhost:8000`'e bağlanır.

Harici API kullanmak için `.env` dosyasında `REACT_APP_API_URL` tanımlayın.
