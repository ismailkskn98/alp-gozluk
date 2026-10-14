import HomepageContentEditor from '@/components/admin/homepage-content';
import AdminPageHeader from '@/components/admin/page-header';

export default function Page() {
  return <><AdminPageHeader eyebrow="İçerik" title="Site içeriği" description="Anasayfa metinlerini ve yalnız anasayfaya ait görselleri kullanıldıkları bölümde yönetin." /><HomepageContentEditor /></>;
}
