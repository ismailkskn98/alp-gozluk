export const moduleConfigs = {
  orders: {
    eyebrow: 'Ticaret', title: 'Siparişler', description: 'Ödeme, hazırlık, kargo ve iade süreçlerini yönetin.', action: 'Sipariş oluştur', singular: 'sipariş',
    columns: ['Sipariş', 'Müşteri', 'Tutar', 'Durum'], row: ['#ALP-1001', 'Demo müşteri', '₺3.490,00', 'Hazırlanıyor'], tone: 'warning',
  },
  customers: {
    eyebrow: 'Müşteri', title: 'Müşteriler', description: 'Müşteri hesaplarını, adreslerini ve sipariş geçmişini görüntüleyin.', action: 'Müşteri ekle', singular: 'müşteri',
    columns: ['Müşteri', 'E-posta', 'Sipariş', 'Durum'], row: ['Demo müşteri', 'demo@alpgozluk.com', '0 sipariş', 'Aktif'], tone: 'success',
  },
  inventory: {
    eyebrow: 'Operasyon', title: 'Stok', description: 'Varyant bazlı stok seviyelerini ve hareket kayıtlarını takip edin.', action: 'Stok hareketi', singular: 'stok hareketi',
    columns: ['Varyant', 'SKU', 'Kullanılabilir', 'Durum'], row: ['Atlas / Siyah', 'ALP-ATL-BLK', '12 adet', 'Yeterli'], tone: 'success',
  },
  campaigns: {
    eyebrow: 'Pazarlama', title: 'Kampanyalar', description: 'Kupon, indirim ve tarih bazlı kampanya kurallarını yönetin.', action: 'Kampanya ekle', singular: 'kampanya', calendar: true,
    columns: ['Kampanya', 'Dönem', 'Kural', 'Durum'], row: ['Sezon açılışı', '21–30 Eylül', '%10 indirim', 'Taslak'], tone: 'neutral',
  },
  content: {
    eyebrow: 'İçerik', title: 'Sayfalar ve içerik', description: 'Yasal sayfaları ve yönetilebilir site içeriklerini yayınlayın.', action: 'İçerik ekle', singular: 'içerik',
    columns: ['Başlık', 'Dil', 'Son düzenleme', 'Durum'], row: ['Mesafeli Satış Sözleşmesi', 'TR', 'Henüz düzenlenmedi', 'Taslak'], tone: 'neutral',
  },
  media: {
    eyebrow: 'Medya', title: 'Medya kütüphanesi', description: 'Local veya S3 üzerinde tutulan güvenli medya kayıtlarını yönetin.', action: 'Medya yükle', singular: 'medya', dropzone: true,
    columns: ['Dosya', 'Tür', 'Boyut', 'Storage'], row: ['atlas-main.webp', 'WebP', '284 KB', 'Local'], tone: 'info',
  },
  reports: {
    eyebrow: 'Analiz', title: 'Raporlar', description: 'Satış, ürün ve stok performansını karşılaştırın.', action: 'Rapor oluştur', singular: 'rapor',
    columns: ['Rapor', 'Dönem', 'Oluşturan', 'Durum'], row: ['Aylık satış özeti', 'Eylül 2026', 'Sistem', 'Hazır'], tone: 'success',
  },
  audit: {
    eyebrow: 'Güvenlik', title: 'Audit log', description: 'Kritik yönetim işlemlerini kullanıcı ve zaman bazında inceleyin.', action: 'Dışa aktar', singular: 'log kaydı', readonly: true,
    columns: ['İşlem', 'Kullanıcı', 'IP / kaynak', 'Zaman'], row: ['Oturum açıldı', 'super_admin', 'Yerel geliştirme', 'Az önce'], tone: 'info',
  },
};
