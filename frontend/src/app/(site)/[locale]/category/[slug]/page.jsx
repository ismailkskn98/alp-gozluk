import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

export default async function CategoryPage({ params }) {
  const { locale, slug } = await params;
  return <><PageIntro eyebrow={locale === 'tr' ? 'Kategori' : 'Category'} title={slug.replaceAll('-', ' ')} /><section className="grid-container py-12"><ProductGrid locale={locale} /></section></>;
}
