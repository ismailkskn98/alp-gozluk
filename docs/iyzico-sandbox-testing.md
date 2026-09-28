# iyzico sandbox kurulum ve test notları

Bu doküman Aşama 9B backend entegrasyonunun anahtar yerleşimini ve kabul testlerini kalıcı olarak kaydeder. Anahtarlar dokümana, kaynak koda veya frontend env dosyasına yazılmaz.

## 1. Sandbox hesabı ve anahtarlar

1. `https://sandbox-merchant.iyzipay.com/auth/register` adresinden sandbox hesabı aç.
2. Sandbox panelinde **Settings → Company Settings → API Keys** bölümünden API Key ve Secret Key değerlerini al.
3. `backend/.env.development` dosyasına aşağıdaki alanları ekle:

```dotenv
IYZICO_ENABLED="true"
IYZICO_ENVIRONMENT="sandbox"
IYZICO_API_KEY="sandbox-api-key-buraya"
IYZICO_SECRET_KEY="sandbox-secret-key-buraya"
IYZICO_CALLBACK_URL="http://localhost:4000/api/alpgozluk/v1/payments/iyzico/3ds/callback"
IYZICO_REQUEST_TIMEOUT_MS="15000"
IYZICO_SANDBOX_IDENTITY_NUMBER="11111111111"
IYZICO_PRODUCTION_APPROVED="false"
PAYMENT_ARTIFACT_ENCRYPTION_KEY="base64-32-byte-key-buraya"
```

`PAYMENT_ARTIFACT_ENCRYPTION_KEY` iyzico anahtarı değildir. 3DS köprü içeriğini Redis'te kısa süreli şifrelemek için uygulamaya özel, 32 byte rastgele bir anahtardır. PowerShell'de üretmek için:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Üretilen değeri yalnız env/secret yönetimine koy. `NEXT_PUBLIC_*` değişkenlerine, frontend dosyalarına veya Git'e ekleme.

## 2. Migration ve yerel kontroller

Backend dizininde sırayla çalıştır:

```powershell
npm run db:migrate:iyzico-payments
npm test
npm run test:order-core:db
npm run test:iyzico:db
npm audit --omit=dev
```

Gerçek sandbox anahtarının ve IYZWSv2 imzasının çalıştığını, ödeme oluşturmadan kontrol etmek için:

```powershell
npm run test:iyzico:sandbox:connection
```

## 3. Callback ve webhook adresleri

- 3DS callback: `/api/alpgozluk/v1/payments/iyzico/3ds/callback`
- Webhook: `/api/alpgozluk/v1/payments/iyzico/webhook`

Yerel 3DS callback tarayıcı üzerinden localhost'a dönebilir. Webhook kabul testi için iyzico'nun erişebileceği sabit bir HTTPS staging/tunnel adresi gerekir. Production'da callback ve webhook yalnız HTTPS olmalı; sandbox ve canlı anahtarları aynı env'de karıştırılmamalıdır.

## 4. Resmî sandbox senaryoları

Kart sahibi adı serbest test metni, ileri bir son kullanma tarihi ve `CVC 123` kullanılabilir. Sandbox 3DS doğrulama kodu `123456` değeridir. Kartların güncel ve kanonik kaynağı iyzico'nun resmî test kartları sayfasıdır.

| Senaryo | Kart numarası |
| --- | --- |
| Başarılı ödeme | `5526080000000006` |
| Yetersiz bakiye | `4111111111111129` |
| Hatalı CVC sonucu | `4124111111111116` |
| Init 3DS başarısız | `4151111111111112` |
| `mdStatus = 0` | `4131111111111117` |
| `mdStatus = 4` | `4141111111111115` |

Tam tarayıcı akışı 9C checkout arayüzü bağlandıktan sonra sınanır. Her senaryoda sipariş, payment attempt, stok rezervasyonu ve tekrar bildirim davranışı birlikte kontrol edilir.

## 5. Canlıya geçiş kapısı

`IYZICO_ENVIRONMENT="production"` ve `IYZICO_PRODUCTION_APPROVED="true"` ancak Direct API/3DS yetkisi, webhook signature özelliği ve PCI DSS kapsamı iyzico/acquirer ile yazılı olarak netleştirildikten sonra kullanılabilir. Canlıda sandbox kimlik numarası kullanılmaz; alıcı kimlik/pasaport kaynağı ve KVKK politikası ayrıca onaylanır.
