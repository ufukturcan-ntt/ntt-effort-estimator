# NTT Effort Frontend

Vercel üzerinde yayınlanacak statik arayüzdür. API adresi `public/assets/app-config.js` içindeki `API_BASE_URL` ile backend'e bağlanır.

## Vercel

1. Projeyi GitHub'a gönderin.
2. Vercel'de yeni proje oluştururken root klasörü `apps/frontend` seçin.
3. Build command: `npm run build`
4. Output directory: `public`
5. Railway backend adresi oluşunca `public/assets/app-config.js` dosyasındaki `API_BASE_URL` değerini güncelleyin.
