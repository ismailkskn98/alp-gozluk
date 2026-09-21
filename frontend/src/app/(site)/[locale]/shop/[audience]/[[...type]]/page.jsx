import { notFound } from 'next/navigation';
import CatalogToolbar from '@/components/site/catalog-toolbar';
import PageIntro from '@/components/site/page-intro';
import ProductGrid from '@/components/site/product-grid';

const audiences = {
  tr: {
    kadin: { code: 'women', title: 'Kadın gözlükleri' },
    erkek: { code: 'men', title: 'Erkek gözlükleri' },
    cocuk: { code: 'kids', title: 'Çocuk gözlükleri' },
    unisex: { code: 'unisex', title: 'Unisex gözlükler' },
  },
  en: {
    women: { code: 'women', title: "Women's eyewear" },
    men: { code: 'men', title: "Men's eyewear" },
    kids: { code: 'kids', title: "Kids' eyewear" },
    unisex: { code: 'unisex', title: 'Unisex eyewear' },
  },
};

const productTypes = {
  tr: { 'gunes-gozlugu': { code: 'sunglasses', label: 'Güneş gözlükleri' }, optik: { code: 'optical', label: 'Optik çerçeveler' } },
  en: { sunglasses: { code: 'sunglasses', label: 'Sunglasses' }, optical: { code: 'optical', label: 'Optical frames' } },
};

export async function generateMetadata({ params }) {
  const { locale, audience, type } = await params;
  const audienceInfo = audiences[locale]?.[audience];
  const typeInfo = type?.[0] ? productTypes[locale]?.[type[0]] : null;
  if (!audienceInfo || (type?.[0] && !typeInfo)) return {};
  const title = typeInfo ? `${audienceInfo.title} — ${typeInfo.label}` : audienceInfo.title;
  return { title, description: locale === 'tr' ? `${title} seçkisini ALP Gözlük'te keşfedin.` : `Explore the ${title.toLowerCase()} edit at ALP Eyewear.` };
}

export default async function AudienceShopPage({ params, searchParams }) {
  const { locale, audience, type } = await params;
  const query = await searchParams;
  const audienceInfo = audiences[locale]?.[audience];
  const typeInfo = type?.[0] ? productTypes[locale]?.[type[0]] : null;
  if (!audienceInfo || type?.length > 1 || (type?.[0] && !typeInfo)) notFound();
  const title = typeInfo ? typeInfo.label : audienceInfo.title;
  const basePath = `/shop/${audience}`;

  return (
    <>
      <PageIntro eyebrow={audienceInfo.title} title={title} description={locale === 'tr' ? 'Unisex modeller ilgili kadın ve erkek seçkilerinde otomatik olarak birlikte gösterilir.' : 'Unisex styles automatically appear in the relevant women and men edits.'} />
      <section className="grid-container py-12">
        <div>
          <CatalogToolbar locale={locale} activeAudience={audienceInfo.code} basePath={basePath} />
          <ProductGrid locale={locale} filters={{ audience: audienceInfo.code, type: typeInfo?.code, sale: query.sale, sort: query.sort, material: query.material, shape: query.shape, feature: query.feature }} />
        </div>
      </section>
    </>
  );
}
