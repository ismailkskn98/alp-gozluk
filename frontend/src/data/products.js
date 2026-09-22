export const demoProducts = [
  {
    slug: "rayban-rb2140-wayfarer-50mm",
    name: "Ray-Ban RB2140 Wayfarer",
    type: "Güneş Gözlüğü",
    price: "₺6.490",
    color: "#f0f1ef",
    audiences: ["unisex"],
    productType: "sunglasses",
    material: ["acetate"],
    features: [],
    images: ["/demo-gozlukler/rayban-rb2140-wayfarer-50mm/main.webp", "/demo-gozlukler/rayban-rb2140-wayfarer-50mm/1.webp", "/demo-gozlukler/rayban-rb2140-wayfarer-50mm/2.webp"],
  },
  {
    slug: "inesta-polarized-ip-vnd268",
    name: "Inesta Polarized IP VND268",
    type: "Güneş Gözlüğü",
    price: "₺3.790",
    color: "#ebe9e4",
    audiences: ["women"],
    productType: "sunglasses",
    material: ["acetate"],
    features: ["polarized"],
    images: ["/demo-gozlukler/inesta-polarized-ip-vnd268/main.webp", "/demo-gozlukler/inesta-polarized-ip-vnd268/1.webp", "/demo-gozlukler/inesta-polarized-ip-vnd268/2.webp"],
  },
  {
    slug: "versace-ve2287",
    name: "Versace VE2287",
    type: "Güneş Gözlüğü",
    price: "₺12.990",
    color: "#f2eee7",
    audiences: ["men"],
    productType: "sunglasses",
    material: ["metal"],
    features: [],
    images: ["/demo-gozlukler/versace-ve2287/main.webp", "/demo-gozlukler/versace-ve2287/1.webp", "/demo-gozlukler/versace-ve2287/2.webp"],
  },
  // {
  //   slug: "innoxlife-8125S-52-18-145",
  //   name: "InnoxLife 8125S",
  //   type: "Güneş Gözlüğü",
  //   price: "₺3.790",
  //   color: "#f2eee7",
  //   audiences: ["unisex"],
  //   productType: "sunglasses",
  //   material: ["acetate"],
  //   features: [],
  //   images: ["/demo-gozlukler/INNOXLIFE_8125S_52-18-145/1-png.png", "/demo-gozlukler/INNOXLIFE_8125S_52-18-145/2-png.png", "/demo-gozlukler/INNOXLIFE_8125S_52-18-145/4-png.png"],
  // },
];

export function getProduct(slug) {
  return demoProducts.find((product) => product.slug === slug);
}

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesDemoFilters(product, filters) {
  if (filters.audience) {
    const acceptedAudiences = ["women", "men"].includes(filters.audience) ? [filters.audience, "unisex"] : [filters.audience];
    if (!product.audiences.some((audience) => acceptedAudiences.includes(audience))) return false;
  }
  if (filters.type && product.productType !== filters.type) return false;
  if (filters.material && !product.material.includes(filters.material)) return false;
  if (filters.feature && !product.features.includes(filters.feature)) return false;
  if (filters.search) {
    const searchValue = normalizeSearchText([product.name, product.type, product.productType, product.slug, ...product.audiences, ...product.material, ...product.features].join(" "));
    if (!searchValue.includes(normalizeSearchText(filters.search).trim())) return false;
  }
  return true;
}

export async function listProducts(locale, filters = {}) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return demoProducts.filter((product) => matchesDemoFilters(product, filters));
  if (!apiUrl) return [];
  try {
    const query = new URLSearchParams({ locale });
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/products?${query}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.data?.products || []).map((product) => ({
      ...product,
      price: new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "currency", currency: "TRY" }).format(Number(product.price || 0)),
      type: locale === "tr" ? "ALP Çerçeve" : "ALP Frame",
      color: "#e4edf3",
      images: (product.images || product.media || [])
        .map((image) => (typeof image === "string" ? image : image.url))
        .filter(Boolean)
        .slice(0, 5),
    }));
  } catch {
    return [];
  }
}

export async function findProduct(locale, slug) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return getProduct(slug);
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/products/${encodeURIComponent(slug)}?locale=${locale}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const product = (await response.json()).data?.product;
    if (!product) return null;
    return {
      ...product,
      type: locale === "tr" ? "ALP Çerçeve" : "ALP Frame",
      price: new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "currency", currency: "TRY" }).format(Number(product.variants?.[0]?.price || 0)),
      color: "#e4edf3",
      images: (product.images || product.media || [])
        .map((image) => (typeof image === "string" ? image : image.url))
        .filter(Boolean)
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}
