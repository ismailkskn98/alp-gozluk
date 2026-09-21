import { Search } from 'lucide-react';
import PageIntro from '@/components/site/page-intro';
import { getPathname } from '@/i18n/navigation';

export default async function SearchPage({ params }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  const shopPath = getPathname({ href: '/shop', locale });

  return (
    <>
      <PageIntro eyebrow={tr ? 'Katalog' : 'Catalogue'} title={tr ? 'Ürün ara' : 'Search products'} />
      <section className="grid-container py-12">
        <form action={shopPath} className="flex max-w-2xl gap-2">
          <label className="sr-only" htmlFor="q">{tr ? 'Arama' : 'Search'}</label>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="q"
              name="q"
              type="search"
              placeholder={tr ? 'Model, kategori veya renk ara' : 'Search model, category or color'}
              className="h-12 w-full rounded-md border border-input bg-white pl-12 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button className="rounded-md bg-primary px-6 text-sm font-semibold text-white">
            {tr ? 'Ara' : 'Search'}
          </button>
        </form>
      </section>
    </>
  );
}
