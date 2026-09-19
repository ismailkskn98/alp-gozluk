export const demoProducts = [
  { slug: 'atlas-01', name: 'Atlas 01', type: 'Güneş Gözlüğü', price: '₺3.490', color: '#cadce7' },
  { slug: 'nova-02', name: 'Nova 02', type: 'Optik Çerçeve', price: '₺2.990', color: '#e8ddd2' },
  { slug: 'mira-03', name: 'Mira 03', type: 'Güneş Gözlüğü', price: '₺3.290', color: '#d8e8df' },
  { slug: 'linea-04', name: 'Linea 04', type: 'Optik Çerçeve', price: '₺2.790', color: '#e5e5e1' },
  { slug: 'orbit-05', name: 'Orbit 05', type: 'Güneş Gözlüğü', price: '₺3.590', color: '#d7dce8' },
  { slug: 'terra-06', name: 'Terra 06', type: 'Optik Çerçeve', price: '₺3.090', color: '#eadfcf' },
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
    };
  } catch {
    return null;
  }
}
