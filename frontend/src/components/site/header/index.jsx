import Image from 'next/image';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import MobileNavbar from './mobile-navbar';

export default async function SiteHeader({ locale }) {
  const t = await getTranslations('Navigation');
  const items = [
    { href: '/shop', label: t('shop') },
    { href: '/new', label: t('new') },
    { href: '/guide', label: t('guide') },
    { href: '/about', label: t('about') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-white/95 backdrop-blur">
      <div className="grid-container">
        <div className="relative flex h-[4.5rem] items-center justify-between gap-4">
          <MobileNavbar
            items={items}
            labels={{ open: 'Menüyü aç', close: 'Menüyü kapat', navigation: 'Mobil menü' }}
          />

          <Link href="/" locale={locale} aria-label="ALP Gözlük ana sayfa" className="shrink-0">
            <Image
              src="/brand/logo.png"
              alt="ALP Gözlük"
              width={176}
              height={68}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>

          <nav aria-label="Ana menü" className="hidden items-center gap-7 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="Ara" className="grid size-10 place-items-center rounded-full hover:bg-muted">
              <Search className="size-[1.15rem]" />
            </Link>
            <Link href="/login" aria-label={t('account')} className="hidden size-10 place-items-center rounded-full hover:bg-muted sm:grid">
              <UserRound className="size-[1.15rem]" />
            </Link>
            <Link href="/cart" aria-label={t('cart')} className="grid size-10 place-items-center rounded-full hover:bg-muted">
              <ShoppingBag className="size-[1.15rem]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
