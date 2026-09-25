import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
  }).format(Number(value || 0));
}

function getApiSpecifications(product, locale) {
  const tr = locale === 'tr';
  const variant = product.variants?.[0] || {};
  const rows = [
    [tr ? 'Marka' : 'Brand', product.brand],
    [tr ? 'Model / kod' : 'Model / code', product.code],
    [tr ? 'Renk kodu' : 'Color code', variant.colorCode],
    [tr ? 'Ölçü' : 'Size', variant.frameSize],
    [tr ? 'Lens genişliği' : 'Lens width', variant.lensWidthMm ? `${variant.lensWidthMm} mm` : null],
    [tr ? 'Köprü genişliği' : 'Bridge width', variant.bridgeWidthMm ? `${variant.bridgeWidthMm} mm` : null],
    [tr ? 'Sap uzunluğu' : 'Temple length', variant.templeLengthMm ? `${variant.templeLengthMm} mm` : null],
    [tr ? 'Cam kategorisi' : 'Lens category', variant.lensCategory],
    [tr ? 'UV koruması' : 'UV protection', variant.uvProtection],
    [tr ? 'Cam tipi' : 'Lens type', variant.lensType],
  ];

  for (const attribute of product.attributes || []) {
    rows.push([attribute.groupName, attribute.name]);
  }

  return Object.fromEntries(rows.filter(([, value]) => value));
}

function normalizeProductDetail(product, locale) {
  if (!product) return null;
  const localizedSpecifications = product.specifications?.[locale];
  const specifications = localizedSpecifications
    ? { [locale === 'tr' ? 'Marka' : 'Brand']: product.brand, ...localizedSpecifications }
    : getApiSpecifications(product, locale);
  return {
    ...product,
    price: product.price === 'Fiyat yakında' && locale === 'en' ? 'Price coming soon' : product.price,
    specifications,
  };
}

export async function listProducts(locale, filters = {}) {
  if (!apiUrl) return [];
  try {
    const query = new URLSearchParams({ locale });
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    }
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/products?${query}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.data?.products || []).map((product) => ({
      ...product,
      priceAmount: Number(product.price),
      price: formatPrice(product.price, locale),
      type: locale === 'tr' ? 'ALP Çerçeve' : 'ALP Frame',
      color: '#ffffff',
      images: (product.images || product.media || [])
        .map((image) => (typeof image === 'string' ? image : image.url))
        .filter(Boolean)
        .slice(0, 5),
    }));
  } catch {
    return [];
  }
}

export async function findProduct(locale, slug) {
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/products/${encodeURIComponent(slug)}?locale=${locale}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const product = (await response.json()).data?.product;
    if (!product) return null;
    return normalizeProductDetail({
      ...product,
      type: locale === 'tr' ? 'ALP Çerçeve' : 'ALP Frame',
      priceAmount: product.variants?.[0]?.price === undefined ? null : Number(product.variants[0].price),
      price: formatPrice(product.variants?.[0]?.price, locale),
      color: '#ffffff',
      images: (product.images || product.media || [])
        .map((image) => (typeof image === 'string' ? image : image.url))
        .filter(Boolean)
        .slice(0, 5),
    }, locale);
  } catch {
    return null;
  }
}
