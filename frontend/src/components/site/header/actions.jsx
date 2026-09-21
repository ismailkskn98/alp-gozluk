import { ShoppingBag } from 'lucide-react';
import NextLink from 'next/link';
import AccountAction from './account-action';
import SearchMenu from './search';
import { getPathname, Link } from '@/i18n/navigation';

export default function HeaderActions({ authenticated, locale, labels, navigationItems }) {
  const nextLocale = locale === 'tr' ? 'en' : 'tr';
  const languagePath = getPathname({ href: '/', locale: nextLocale });

  return (
    <div className="col-start-3 row-start-1 flex items-center justify-self-end">
      <NextLink href={languagePath} hrefLang={nextLocale} className="mr-1 hidden px-2 py-2 text-[0.68rem] text-[#666a70] hover:text-[#111] lg:block">
        {labels.language}
      </NextLink>
      <SearchMenu locale={locale} navigationItems={navigationItems} triggerLabel={labels.search} />
      <AccountAction authenticated={authenticated} locale={locale} label={labels.account} />
      <Link href="/cart" aria-label={labels.cart} className="grid size-11 place-items-center hover:bg-[#f4f5f6]">
        <ShoppingBag className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
