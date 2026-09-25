import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function getCatalogFacets(locale) {
  if (!apiUrl) return { brands: [], categories: [], attributeGroups: [], priceRange: { min: 0, max: 0 } };
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/catalog/facets?locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error('Catalog facets could not be loaded.');
    return (await response.json()).data;
  } catch {
    return { brands: [], categories: [], attributeGroups: [], priceRange: { min: 0, max: 0 } };
  }
}
