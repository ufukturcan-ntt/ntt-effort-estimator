# Vercel + Railway Gecis Plani

Bu proje iki parçaya ayrıldı:

- `apps/frontend`: Vercel'de yayınlanacak kullanıcı arayüzü.
- `apps/backend`: Railway'de çalışacak API ve PostgreSQL bağlantısı.

## 1. GitHub

Projeyi GitHub reposuna push edin. Şifre paylaşmanıza gerek yok; GitHub bağlantısını kendi tarayıcınızda onaylamanız yeterlidir.

## 2. Railway

1. Yeni Railway projesi oluşturun.
2. PostgreSQL servisi ekleyin.
3. Backend servisini aynı GitHub reposundan bağlayın.
4. Root directory olarak `apps/backend` seçin.
5. Ortam değişkenleri:
   - `DATABASE_URL`: Railway PostgreSQL otomatik sağlar.
   - `FRONTEND_ORIGIN`: Vercel yayın adresiniz.
   - `NODE_ENV`: `production`
6. Veritabanını hazırlayın:
   - `npm run db:init`
   - `npm run db:seed`

## 3. Vercel

1. Vercel'de yeni proje oluşturun.
2. Aynı GitHub reposunu seçin.
3. Root directory olarak `apps/frontend` seçin.
4. Build command: `npm run build`
5. Output directory: `public`
6. Railway backend adresi belli olunca `apps/frontend/public/assets/app-config.js` içindeki `API_BASE_URL` değerini güncelleyin.

## 4. Veri

Teklif kayıtları artık tarayıcıda değil PostgreSQL'de tutulacak. Admin bakım datalarının başlangıç hali Excel'den üretilen mevcut asset dosyalarından seed edilir.
