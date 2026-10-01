import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function CollectionPage({ params }) {
  const { locale, slug } = await params;
  const title = slug.replaceAll('-', ' ');
  const breadcrumbs = [
    { label: locale === 'tr' ? 'Tüm ürünler' : 'Shop all', href: '/shop' },
    { label: title },
  ];
  return <><PageIntro breadcrumbs={breadcrumbs} eyebrow={locale === 'tr' ? 'Koleksiyon' : 'Collection'} title={title} /><section className="grid-container py-12"><ProductGrid locale={locale} filters={{ collection: slug }} /></section></>;
}
