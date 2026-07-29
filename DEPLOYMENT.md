# Vercel + Railway Geçiş Planı

Bu proje iki parçaya ayrıldı:

- `apps/frontend`: Vercel'de yayınlanacak kullanıcı arayüzü.
- `apps/backend`: Railway'de çalışacak API ve PostgreSQL bağlantısı.

## Railway

1. PostgreSQL servisi ekleyin.
2. Backend servisini GitHub reposundan bağlayın.
3. Root directory olarak `apps/backend` seçin.
4. Ortam değişkenleri:
   - `DATABASE_URL`: Railway PostgreSQL bağlantısı.
   - `FRONTEND_ORIGIN`: Vercel yayın adresi.
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: kullanıcı oturum tokenlarını imzalamak için uzun ve rastgele gizli değer.
   - `BOOTSTRAP_ADMIN_EMAIL`: yalnızca ilk kurulumda oluşturulacak Admin e-posta adresi.
   - `BOOTSTRAP_ADMIN_PASSWORD`: yalnızca ilk kurulumda kullanılacak, en az 12 karakterli Admin şifresi.
   - `BOOTSTRAP_ADMIN_NAME`: ilk Admin görünen adı.
   - `APP_PUBLIC_URL`: Railway backend public URL'i.
   - `APPROVER_EMAIL`: kullanıcı kayıt onay mailinin gideceği kişi.
   - `ADMIN_APPROVAL_TOKEN`: maildeki onay linki için gizli token.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: mail gönderimi için SMTP ayarları.

İlk admin hesabı:

- Email: `ufuk.turcan@nttdata.com`
- Şifre: `admin123`

Canlı kullanıma geçmeden önce bu şifre değiştirilmelidir.

## Vercel

1. Vercel'de yeni proje oluşturun.
2. Aynı GitHub reposunu seçin.
3. Root directory olarak `apps/frontend` seçin.
4. Build command: `npm run build`
5. Output directory: `public`
6. `apps/frontend/public/assets/app-config.js` içindeki `API_BASE_URL` Railway backend adresi olmalıdır.

## Veri

Teklif kayıtları PostgreSQL'de tutulur. Kullanıcı kayıt talepleri `PENDING` statüsüyle açılır; admin onayı sonrası `APPROVED` olur.
