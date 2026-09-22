import AnnouncementManager from '@/components/admin/announcements';
import AdminPageHeader from '@/components/admin/page-header';

export default function Page() {
  return (
    <>
      <AdminPageHeader
        eyebrow="İçerik"
        title="Duyuru barı"
        description="Header üzerinde gösterilen kampanya, kargo ve bilgilendirme mesajlarını yönetin."
      />
      <AnnouncementManager />
    </>
  );
}

