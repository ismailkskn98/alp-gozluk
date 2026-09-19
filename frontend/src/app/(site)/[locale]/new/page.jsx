import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function NewPage({ params }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  return <><PageIntro eyebrow="SS 2026" title={tr ? 'Yeni gelenler' : 'New arrivals'} description={tr ? 'ALP seçkisine yeni katılan modeller.' : 'The newest additions to the ALP collection.'} /><section className="grid-container py-12"><ProductGrid locale={locale} limit={3} /></section></>;
}
