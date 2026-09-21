import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function ShopPage({ params }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  return (
    <>
      <PageIntro eyebrow={tr ? 'ALP Koleksiyon' : 'ALP Collection'} title={tr ? 'Tüm gözlükler' : 'All eyewear'} description={tr ? 'Güneş gözlüğü ve optik çerçeve seçkisini keşfedin.' : 'Explore our selection of sunglasses and optical frames.'} />
      <section className="grid-container py-12"><div><p className="mb-8 text-sm text-muted-foreground">{tr ? 'Demo katalog' : 'Demo catalogue'}</p><ProductGrid locale={locale} /></div></section>
    </>
  );
}
