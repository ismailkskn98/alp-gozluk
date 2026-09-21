export const demoProducts = [
  {
    slug: 'rayban-rb2140-wayfarer-50mm',
    name: 'Ray-Ban RB2140 Wayfarer',
    type: 'Güneş Gözlüğü',
    price: '₺6.490',
    color: '#f0f1ef',
    images: [
      '/demo-gozlukler/rayban-rb2140-wayfarer-50mm/main.webp',
      '/demo-gozlukler/rayban-rb2140-wayfarer-50mm/1.webp',
      '/demo-gozlukler/rayban-rb2140-wayfarer-50mm/2.webp',
    ],
  },
  {
    slug: 'inesta-polarized-ip-vnd268',
    name: 'Inesta Polarized IP VND268',
    type: 'Güneş Gözlüğü',
    price: '₺3.790',
    color: '#ebe9e4',
    images: [
      '/demo-gozlukler/inesta-polarized-ip-vnd268/main.webp',
      '/demo-gozlukler/inesta-polarized-ip-vnd268/1.webp',
      '/demo-gozlukler/inesta-polarized-ip-vnd268/2.webp',
    ],
  },
  {
    slug: 'versace-ve2287',
    name: 'Versace VE2287',
    type: 'Güneş Gözlüğü',
    price: '₺12.990',
    color: '#f2eee7',
    images: [
      '/demo-gozlukler/versace-ve2287/main.webp',
      '/demo-gozlukler/versace-ve2287/1.webp',
      '/demo-gozlukler/versace-ve2287/2.webp',
    ],
  },
];

export function getProduct(slug) {
  return demoProducts.find((product) => product.slug === slug);
}

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function listProducts(locale) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return demoProducts;
  if (!apiUrl) return [];
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/products?locale=${locale}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.data?.products || []).map((product) => ({
      ...product,
      price: new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(Number(product.price || 0)),
      type: locale === 'tr' ? 'ALP Çerçeve' : 'ALP Frame',
      color: '#e4edf3',
      images: (product.images || product.media || [])
        .map((image) => typeof image === 'string' ? image : image.url)
        .filter(Boolean)
        .slice(0, 5),
    }));
  } catch {
    return [];
  }
}

export async function findProduct(locale, slug) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return getProduct(slug);
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/products/${encodeURIComponent(slug)}?locale=${locale}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const product = (await response.json()).data?.product;
    if (!product) return null;
    return {
      ...product,
      type: locale === 'tr' ? 'ALP Çerçeve' : 'ALP Frame',
      price: new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(Number(product.variants?.[0]?.price || 0)),
      color: '#e4edf3',
      images: (product.images || product.media || [])
        .map((image) => typeof image === 'string' ? image : image.url)
        .filter(Boolean)
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}
