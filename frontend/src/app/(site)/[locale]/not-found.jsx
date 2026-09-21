import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');
  const common = await getTranslations('Common');
  return (
    <section className="grid-container py-28 text-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.24em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-4 text-balance text-5xl sm:text-7xl">{t('title')}</h1>
        <p className="mx-auto mt-5 max-w-lg text-muted-foreground">{t('description')}</p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">{common('backHome')}</Link>
      </div>
    </section>
  );
}
