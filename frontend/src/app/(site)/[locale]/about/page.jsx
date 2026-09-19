import ContentPage from '@/components/site/content-page';

export default async function AboutPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <ContentPage eyebrow="ALP Gözlük" title={tr ? 'Her bakış bir karakter taşır.' : 'Every perspective has character.'} description={tr ? 'ALP Gözlük; çağdaş çizgiyi, erişilebilir kalite ve özenli hizmetle buluşturur.' : 'ALP Eyewear brings contemporary design together with accessible quality and thoughtful service.'}><p>{tr ? 'Bu sayfadaki marka hikâyesi, firma tarafından sağlanacak nihai metinle yönetim panelindeki içerik modülünden güncellenecektir.' : 'The final brand story will be supplied by the company and managed through the admin content module.'}</p></ContentPage>;
}
