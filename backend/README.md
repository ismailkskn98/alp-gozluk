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

`alpgozluk/v1/sql/` altındaki dosyaları isim sırasıyla, doğru veritabanını Navicat içinde seçtikten sonra çalıştırın.

İlk yönetici için önce normal kayıt akışından bir kullanıcı oluşturun, sonra development veritabanında:

```bash
npm run admin:grant -- kullanici@example.com
```

Production rol ataması bilinçli olarak ayrı komuttur: `npm run admin:grant:production -- kullanici@example.com`.

## API

Base URL: `/api/alpgozluk/v1`

- `GET /health/live`
- `GET /health/ready`
- `POST /auth/register`
- `POST /auth/login`
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

## Test

```bash
npm test
npm run test:security
```
