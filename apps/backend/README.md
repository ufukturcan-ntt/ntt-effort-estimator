# NTT Effort Backend

Railway üzerinde çalışacak API servisidir. Teklif kayıtları, kullanıcılar ve admin bakım dataları PostgreSQL'de tutulur.

## Local

```bash
npm install
copy .env.example .env
npm run db:init
npm run db:seed
npm run dev
```

## Railway

1. Railway'de PostgreSQL servisi ekleyin.
2. Backend servisini GitHub reposundan `apps/backend` klasörüyle oluşturun.
3. Ortam değişkenlerini tanımlayın:
   - `DATABASE_URL`
   - `FRONTEND_ORIGIN`
   - `NODE_ENV=production`
4. İlk kurulumda `npm run db:init` ve `npm run db:seed` çalıştırın.
