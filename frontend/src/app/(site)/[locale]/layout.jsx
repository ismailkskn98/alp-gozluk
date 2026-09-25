import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import SiteFooter from '@/components/site/footer';
import SiteHeader from '@/components/site/header';
import RouteScrollReset from '@/components/site/route-scroll-reset';
import CommerceQueryProvider from '@/components/providers/commerce-query-provider';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <CommerceQueryProvider>
        <RouteScrollReset />
        <SiteHeader locale={locale} />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </CommerceQueryProvider>
    </NextIntlClientProvider>
  );
}
