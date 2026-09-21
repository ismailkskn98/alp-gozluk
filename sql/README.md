# SQL

Çalıştırılabilir ve tarih sıralı SQL dosyaları [`backend/alpgozluk/v1/sql/`](../backend/alpgozluk/v1/sql/) altında tutulur. İlk kurulum dosyası `2026-09-19_001_initial_schema.sql` dosyasıdır.

Navicat veya başka bir istemcide önceden oluşturulmuş doğru veritabanı seçildikten sonra dosyaları isim sırasıyla çalıştırın:

1. `2026-09-19_001_initial_schema.sql`
2. `2026-09-21_001_catalog_taxonomy.sql`
3. `2026-09-21_002_google_auth.sql`

İkinci dosya hedef kitle, marka, filtre özellikleri, ürün ilişkileri ve yönetilebilir header navigasyonu tablolarını ekler. Dosyalar `CREATE DATABASE`, `DROP DATABASE` veya sabit veritabanı adı içermez.

Üçüncü dosya Google ile giriş yapan kullanıcıların provider kimliklerini saklar ve yalnızca sosyal giriş kullanan hesaplarda şifre alanının boş kalabilmesini sağlar.
