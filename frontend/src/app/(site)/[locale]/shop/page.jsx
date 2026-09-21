import CatalogToolbar from '@/components/site/catalog-toolbar';
import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function ShopPage({ params, searchParams }) {
  const { locale } = await params;
  const query = await searchParams;
  const tr = locale === 'tr';
  return (
    <>
      <PageIntro eyebrow={tr ? 'ALP Koleksiyon' : 'ALP Collection'} title={tr ? 'Tüm gözlükler' : 'All eyewear'} description={tr ? 'Güneş gözlüğü ve optik çerçeve seçkisini keşfedin.' : 'Explore our selection of sunglasses and optical frames.'} />
      <section className="grid-container py-12"><div><CatalogToolbar locale={locale} activeAudience={null} /><ProductGrid locale={locale} filters={{ type: query.type, sale: query.sale, sort: query.sort, material: query.material, feature: query.feature, search: query.q }} /></div></section>
    </>
  );
}
