import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function CollectionPage({ params }) {
  const { locale, slug } = await params;
  return <><PageIntro eyebrow={locale === 'tr' ? 'Koleksiyon' : 'Collection'} title={slug.replaceAll('-', ' ')} /><section className="grid-container py-12"><ProductGrid locale={locale} filters={{ collection: slug }} /></section></>;
}
