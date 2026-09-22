'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/animate-ui/components/radix/sheet';
import { Link, useRouter } from '@/i18n/navigation';
import SearchResultCard from './result-card';
import SearchSuggestions from './suggestions';

export default function SearchMenu({ locale, navigationItems, triggerLabel, hasAnnouncement }) {
  const t = useTranslations('Search');
  const router = useRouter();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('idle');
  const normalizedQuery = query.trim();
  const categories = navigationItems.slice(0, 5);
  const quickSearches = t.raw('quickSearches');

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setStatus('loading');

      try {
        const params = new URLSearchParams({ locale });
        if (normalizedQuery) params.set('q', normalizedQuery);
        const response = await fetch(`/api/search?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message);
        setProducts(payload.data?.products || []);
        setStatus('success');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setProducts([]);
        setStatus('error');
      }
    }, normalizedQuery ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [locale, normalizedQuery, open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!normalizedQuery) {
      inputRef.current?.focus();
      return;
    }
    closeMenu();
    router.push(`/shop?q=${encodeURIComponent(normalizedQuery)}`);
  }

  const resultsTitle = normalizedQuery
    ? t('resultsFor', { query: normalizedQuery })
    : t('popularProducts');
  const panelTop = hasAnnouncement ? '6rem' : '3.75rem';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className="grid size-10 place-items-center rounded-full text-[#263548] transition-colors hover:bg-[#f3f5f6] focus-visible:outline-offset-0"
        >
          <Search className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="top"
        style={{ top: panelTop, height: `calc(100dvh - ${panelTop})` }}
        closeLabel={t('close')}
        overlayClassName="bg-transparent"
        className="w-full gap-0 overflow-hidden border-b border-black/10 bg-white shadow-[0_24px_60px_rgba(16,35,61,0.1)]"
      >
        <SheetHeader className="border-b border-black/10 bg-white p-0">
          <div className="grid-container">
            <div className="py-[clamp(1rem,2.4vh,1.5rem)] pr-12">
              <div className="flex flex-col justify-between gap-1 md:flex-row md:items-end md:gap-8">
                <SheetTitle className="text-[clamp(1.35rem,1.7vw,1.75rem)] font-normal tracking-[-0.03em]">
                  {t('title')}
                </SheetTitle>
                <SheetDescription className="max-w-xl text-[0.8rem] leading-5 md:text-right">
                  {t('description')}
                </SheetDescription>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex min-h-11 items-center border border-black/12 bg-[#f7f8f7] px-3 transition-colors focus-within:bg-white">
                <Search className="mr-2.5 size-4 shrink-0 text-[#667085]" strokeWidth={1.5} aria-hidden="true" />
                <label htmlFor="header-product-search" className="sr-only">{t('inputLabel')}</label>
                <input
                  ref={inputRef}
                  id="header-product-search"
                  type="text"
                  inputMode="search"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value.slice(0, 80))}
                  placeholder={t('placeholder')}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="site-header-search-input h-10 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[0.92rem] text-foreground outline-none placeholder:text-[#7b8491]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="flex min-h-9 items-center gap-1.5 px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-offset-0"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('clear')}</span>
                  </button>
                ) : null}
              </form>
            </div>
          </div>
        </SheetHeader>

        <div className="grid-container min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="py-[clamp(1.25rem,3vh,2.25rem)]">
            {!normalizedQuery ? (
              <SearchSuggestions
                categories={categories}
                labels={{
                  categories: t('categories'),
                  popularSearches: t('popularSearches'),
                  promo: t('promo'),
                }}
                onNavigate={closeMenu}
                onSelectQuery={(value) => {
                  setQuery(value);
                  inputRef.current?.focus();
                }}
                quickSearches={quickSearches}
              />
            ) : null}

            <section className={normalizedQuery ? '' : 'mt-[clamp(1.75rem,4vh,3rem)]'} aria-live="polite" aria-busy={status === 'loading'}>
              <div className="flex min-h-11 items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-muted-foreground">{resultsTitle}</h2>
                {normalizedQuery && products.length > 0 ? (
                  <Link
                    href={`/shop?q=${encodeURIComponent(normalizedQuery)}`}
                    onClick={closeMenu}
                    className="border-b border-black/20 pb-1 text-sm font-medium text-foreground hover:border-black"
                  >
                    {t('viewAll')}
                  </Link>
                ) : null}
              </div>

              {status === 'loading' ? (
                <div className={`mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 ${normalizedQuery ? 'xl:grid-cols-4' : ''}`} role="status">
                  <span className="sr-only">{t('loading')}</span>
                  {Array.from({ length: normalizedQuery ? 4 : 3 }, (_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="aspect-[4/3] bg-[#f1f2f0]" />
                      <div className="mt-3 h-4 w-2/3 bg-[#eceeeb]" />
                    </div>
                  ))}
                </div>
              ) : null}

              {status === 'success' && products.length > 0 ? (
                <div className={`mt-4 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 ${normalizedQuery ? 'xl:grid-cols-4' : ''}`}>
                  {products.slice(0, 4).map((product) => (
                    <SearchResultCard
                      key={product.slug}
                      locale={locale}
                      product={product}
                      onNavigate={closeMenu}
                      viewProductLabel={t('viewProduct')}
                    />
                  ))}
                </div>
              ) : null}

              {(status === 'error' || (status === 'success' && products.length === 0)) ? (
                <div className="mt-6 border-t border-black/10 py-10">
                  <p className="text-lg text-foreground">{status === 'error' ? t('errorTitle') : t('noResultsTitle')}</p>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                    {status === 'error' ? t('errorDescription') : t('noResultsDescription')}
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
