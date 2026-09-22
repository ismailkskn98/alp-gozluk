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
4. `2026-09-21_003_admin_security.sql`

Dosyalar MariaDB 10.6 ve 11.4 için `CURRENT_TIMESTAMP(6)` sözdizimini kullanır. Tarihlerin UTC tutulabilmesi için veritabanı sunucusu ve uygulama bağlantıları UTC kullanmalıdır. Sunucu ayarını kontrol etmek için:

```sql
SELECT @@global.time_zone, @@session.time_zone, NOW(6), UTC_TIMESTAMP(6);
```

İlk dosya `CREATE TABLE IF NOT EXISTS`, başlangıç verileri ise benzersiz anahtarlar üzerinden güvenli tekrar çalıştırma kuralları kullanır. Yarıda kalan ilk denemeden sonra aynı dosyayı baştan çalıştırabilirsiniz.

## İlk süper yönetici

Public kayıt yalnızca `customer` hesabı oluşturur. Yönetim panelinin ilk hesabı mevcut bir müşteriyi yükseltmeden, tek kullanımlık bootstrap komutuyla oluşturulur.

Önce `.env.development` içinde aşağıdaki alanları doldurun:

```env
SUPER_ADMIN_EMAIL="yonetici@example.com"
SUPER_ADMIN_PASSWORD="en-az-14-karakter-guclu-sifre"
SUPER_ADMIN_FIRST_NAME="Ad"
SUPER_ADMIN_LAST_NAME="Soyad"
```

Ardından migration dosyaları çalıştırılmış development veritabanında:

```bash
npm run admin:bootstrap
```

Komut ikinci bir süper yönetici oluşturmaz ve mevcut bir hesabı otomatik yükseltmez. Başarılı kurulumdan sonra `SUPER_ADMIN_EMAIL` ve `SUPER_ADMIN_PASSWORD` değerlerini env dosyasından temizleyin. Production için ayrı ve bilinçli komut `npm run admin:bootstrap:production` şeklindedir.

Süper yönetici panelde **Kullanıcılar** ekranından `admin` ve `editor` hesapları oluşturup rollerini yönetebilir. Korumalı süper yönetici panelden devre dışı bırakılamaz, arşivlenemez veya rolü değiştirilemez.

## Yönetim paneli iki faktörlü doğrulama

TOTP tabanlı doğrulama Google Authenticator, Microsoft Authenticator, Authy, 1Password ve Bitwarden gibi standart authenticator uygulamalarıyla çalışır. Başlangıçta kapalıdır:

```env
ADMIN_2FA_ENABLED="false"
ADMIN_2FA_ENCRYPTION_KEY=""
ADMIN_2FA_ISSUER="ALP Gözlük"
```

Etkinleştirmeden önce 32 byte Base64 anahtar üretin:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Çıktıyı `ADMIN_2FA_ENCRYPTION_KEY` alanına yazıp `ADMIN_2FA_ENABLED="true"` yapın. Bu modda Redis zorunludur ve erişilemiyorsa yönetici girişi güvenlik nedeniyle kapalı kalır. İlk başarılı girişte QR kod gösterilir; üretilen kurtarma kodları yalnız bir kez görüntülenir.

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
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify`
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
- `GET /admin/users`
- `GET /admin/users/roles`
- `POST /admin/users`
- `PUT /admin/users/:id/roles`
- `PUT /admin/users/:id/status`
- `DELETE /admin/users/:id`

Admin ürün ve medya rotaları bearer token ile ilgili backend iznini gerektirir.

Google girişini etkinleştirmek için Google Cloud Console'daki Web application OAuth client kimliğini `GOOGLE_CLIENT_ID` olarak tanımlayın. Aynı client kimliği frontend tarafındaki `NEXT_PUBLIC_GOOGLE_CLIENT_ID` değeriyle eşleşmelidir. Google hesabıyla ilk kez giriş yapan kullanıcı için müşteri hesabı otomatik oluşturulur; mevcut şifreli hesaplar yalnızca e-posta eşleşmesine bakılarak otomatik bağlanmaz.

## Test

```bash
npm test
npm run test:security
```
