# ALP Gözlük API

## Gereksinimler

- Node.js 24 veya üzeri
- MariaDB 11.4 LTS
- Redis

## Kurulum

```bash
npm install
npm run dev
```

`npm run dev` `.env.development`, `npm start` `.env.production` dosyasını yükler. Production için gerekli değerlerden biri eksikse uygulama güvenli olmayan varsayımlarla başlamaz.

## Veritabanı

`alpgozluk/v1/sql/` altındaki dosyaları doğru veritabanı Navicat içinde seçiliyken şu sırayla çalıştırın:

1. `2026-09-19_001_initial_schema.sql`
2. `2026-09-21_001_catalog_taxonomy.sql`
3. `2026-09-21_002_google_auth.sql`

Dosyalar MariaDB 10.6 ve 11.4 için `CURRENT_TIMESTAMP(6)` sözdizimini kullanır. Tarihlerin UTC tutulabilmesi için veritabanı sunucusu ve uygulama bağlantıları UTC kullanmalıdır. Sunucu ayarını kontrol etmek için:

```sql
SELECT @@global.time_zone, @@session.time_zone, NOW(6), UTC_TIMESTAMP(6);
```

İlk dosya `CREATE TABLE IF NOT EXISTS`, başlangıç verileri ise benzersiz anahtarlar üzerinden güvenli tekrar çalıştırma kuralları kullanır. Yarıda kalan ilk denemeden sonra aynı dosyayı baştan çalıştırabilirsiniz.

İlk yönetici için önce normal kayıt akışından bir kullanıcı oluşturun, sonra development veritabanında:

```bash
npm run admin:grant -- kullanici@example.com
```

Production rol ataması bilinçli olarak ayrı komuttur: `npm run admin:grant:production -- kullanici@example.com`.

## Redis

`redis-server --version` yalnızca Redis yazılımının kurulu olduğunu gösterir. `redis-cli ping` bağlantıyı reddediyorsa ve servis `failed` durumundaysa nedeni şu salt-okunur komutlarla inceleyin:

```bash
systemctl status redis-server --no-pager -l
journalctl -u redis-server -n 80 --no-pager
```

Redis internetten erişilebilir bir porta açılmamalıdır. Aynı sunucudaki backend için `REDIS_URL=redis://127.0.0.1:6379` kullanılır. Redis geçici olarak kapalıyken uygulama cache olmadan devam edebilir; MariaDB kalıcı veri kaynağıdır.

## API

Base URL: `/api/alpgozluk/v1`

- `GET /health/live`
- `GET /health/ready`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google/nonce`
- `POST /auth/google`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /products?locale=tr`
- `GET /products/:slug?locale=tr`
- `POST /admin/products`
- `GET /admin/media/list`
- `POST /admin/media/upload`
- `PUT /admin/media/update/:id`
- `PUT /admin/media/replace/:id`
- `DELETE /admin/media/delete/:id`

Admin ürün ve medya rotaları bearer token ile ilgili backend iznini gerektirir.

Google girişini etkinleştirmek için Google Cloud Console'daki Web application OAuth client kimliğini `GOOGLE_CLIENT_ID` olarak tanımlayın. Aynı client kimliği frontend tarafındaki `NEXT_PUBLIC_GOOGLE_CLIENT_ID` değeriyle eşleşmelidir. Google hesabıyla ilk kez giriş yapan kullanıcı için müşteri hesabı otomatik oluşturulur; mevcut şifreli hesaplar yalnızca e-posta eşleşmesine bakılarak otomatik bağlanmaz.

## Test

```bash
npm test
npm run test:security
```
