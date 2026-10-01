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

3DS callback, iyzico'nun tarayıcı üzerinden yaptığı form POST isteğidir. Bu exact rota global frontend CORS allowlist'ine bağlı değildir; güven sınırı callback imzası, conversation/payment eşleşmesi ve tek-seferlik ödeme tamamlama işlemidir. iyzico origin'i diğer API rotalarına açılmaz.

## 4. Resmî sandbox senaryoları

Kart sahibi adı serbest test metni, ileri bir son kullanma tarihi ve `CVC 123` kullanılabilir. Sandbox mock ekranı doğrulama kodunu sayfada gösterir; ekranda gösterilen kod kullanılmalıdır. Kartların güncel ve kanonik kaynağı iyzico'nun resmî test kartları sayfasıdır.

| Senaryo | Kart numarası |
| --- | --- |
| Başarılı ödeme | `5526080000000006` |
| Yetersiz bakiye | `4111111111111129` |
| Hatalı CVC sonucu | `4124111111111116` |
| Init 3DS başarısız | `4151111111111112` |
| `mdStatus = 0` | `4131111111111117` |
| `mdStatus = 4` | `4141111111111115` |

9C checkout arayüzü bağlanmıştır. Tarayıcı testini her kart için yeni bir checkout oluşturarak aşağıdaki sırada yap:

1. Sepete stoklu bir varyant ekle, ürünü seçili bırak ve **Sepeti onayla** ile `/tr/checkout` sayfasına geç.
2. Misafir senaryosunda iletişim/teslimat alanlarını doldur; üyelikli senaryoda varsayılan adresin geldiğini ve başka kayıtlı adresin forma uygulanabildiğini doğrula.
3. **Teslimatı onayla** dediğinde sipariş numarasının oluştuğunu, kart formunun açıldığını ve ürünlerin 20 dakikalık ödeme rezervasyonuna geçtiğini doğrula. Bu noktada sayfayı yenileyip aynı siparişin geri geldiğini kontrol et.
4. Kartın ilk sekiz hanesinden sonra banka/taksit sorgusunun çalıştığını kontrol et. Taksit seçeneklerini frontend üretmez; görünen seçenek iyzico sandbox cevabıdır.
5. Kart sahibi için test metni, ileri bir yıl, `CVC 123` ve tabloda ilgili kartı kullan. **Satın al** sonrasında iyzico 3DS ekranında sayfada gösterilen SMS koduyla devam et.
6. Dönüşte `/checkout/result` ekranının URL'deki `status` değerine güvenmeden backend ödeme durumunu sorguladığını; başarılı senaryoda sipariş numarası ve tutarı gösterdiğini doğrula.

Her terminal hata senaryosundan sonra eski sipariş tekrar ödenmez; stok rezervasyonu bırakılır ve sepete dönülerek yeni checkout başlatılır. Ayrıca şunları kontrol et:

- **Çift tıklama:** Satın al sırasında düğme pasif olmalı ve tek Init 3DS isteği oluşmalı.
- **Adres değiştirme:** Kart formu açıldıktan sonra teslimat adresini değiştirmek eski siparişi iptal edip rezervasyonu bırakmalı; yeni onay yeni sipariş oluşturmalı.
- **Sekme yenileme:** Sipariş numarası dışında kart alanlarının hiçbiri geri gelmemeli; PAN/CVC `localStorage`, `sessionStorage`, cookie ve TanStack Query cache'inde bulunmamalı.
- **Başarısız kartlar:** Yetersiz bakiye, hatalı CVC, Init 3DS hatası ve `mdStatus` kartlarında başarılı sipariş görünmemeli; stok yalnız bir kez geri bırakılmalı.
- **Misafir sahipliği:** Başka tarayıcı/incognito oturumunda yalnız sipariş numarasıyla ödeme veya sonuç okunamamalı.
- **Üyelikli akış:** Aynı test oturum açmış kullanıcıyla da tamamlanmalı; başarılı sipariş hesap siparişlerinde görünmeli.

Webhook tekrarları ve callback-webhook yarışı localhost ile tam sınanamaz. Bunlar iyzico'nun erişebildiği sabit HTTPS staging adresinde, veritabanındaki payment attempt, sipariş geçmişi, stok rezervasyonu ve inventory movement kayıtları birlikte incelenerek kapatılır.

## 5. Canlıya geçiş kapısı

`IYZICO_ENVIRONMENT="production"` ve `IYZICO_PRODUCTION_APPROVED="true"` ancak Direct API/3DS yetkisi, webhook signature özelliği ve PCI DSS kapsamı iyzico/acquirer ile yazılı olarak netleştirildikten sonra kullanılabilir. Canlıda sandbox kimlik numarası kullanılmaz; alıcı kimlik/pasaport kaynağı ve KVKK politikası ayrıca onaylanır.
