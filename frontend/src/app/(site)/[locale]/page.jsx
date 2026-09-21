import { getTranslations, setRequestLocale } from 'next-intl/server';
import Home from '@/components/site/home';

export async function generateMetadata() {
  const t = await getTranslations('Metadata');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Home locale={locale} />;
}
