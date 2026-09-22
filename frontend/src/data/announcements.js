import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

const fallbackAnnouncements = {
  tr: [{
    id: 'demo-shipping',
    message: '1.500 TL ve üzeri ücretsiz kargo.',
    linkLabel: 'Detaylar',
    linkUrl: '/legal/teslimat-ve-iade',
    linkUnderline: true,
    backgroundColor: '#E5E5DC',
    textColor: '#17191D',
    durationSeconds: 5,
  }],
  en: [{
    id: 'demo-shipping',
    message: 'Free shipping on orders over 1,500 TL.',
    linkLabel: 'Details',
    linkUrl: '/legal/shipping-and-returns',
    linkUnderline: true,
    backgroundColor: '#E5E5DC',
    textColor: '#17191D',
    durationSeconds: 5,
  }],
};

export async function fetchAnnouncements(locale) {
  const safeLocale = locale === 'en' ? 'en' : 'tr';
  if (!apiUrl) return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ? fallbackAnnouncements[safeLocale] : [];

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/announcements?locale=${safeLocale}`,
      { cache: 'no-store' },
    );
    if (!response.ok) return [];
    return (await response.json()).data?.announcements || [];
  } catch {
    return [];
  }
}
