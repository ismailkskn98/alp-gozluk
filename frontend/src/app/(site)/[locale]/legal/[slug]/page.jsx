import ContentPage from '@/components/site/content-page';

export default async function LegalPage({ params }) {
  const { locale, slug } = await params; const tr = locale === 'tr';
  return <ContentPage eyebrow={tr ? 'Yasal' : 'Legal'} title={slug.replaceAll('-', ' ')} description={tr ? 'Bu metin yönetim panelinden ve veritabanından yayınlanacaktır.' : 'This text will be published from the admin panel and database.'}><p>{tr ? 'Hukuki metinler avukat veya yetkili danışman onayı olmadan production ortamında yayınlanmamalıdır.' : 'Legal texts should not be published in production without approval from authorized counsel.'}</p></ContentPage>;
}
