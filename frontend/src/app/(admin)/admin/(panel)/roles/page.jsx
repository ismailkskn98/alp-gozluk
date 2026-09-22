import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LockKeyhole, PencilLine, ShieldCheck, UserRound } from 'lucide-react';
import AdminPageHeader from '@/components/admin/page-header';
import { getSessionUser } from '@/lib/server-api';

const roles = [
  ['super_admin', 'Süper yönetici', 'Başlangıçta env ve bootstrap komutuyla oluşturulur. Silinemez, devre dışı bırakılamaz ve başka hesaba atanamaz.', ShieldCheck, 'Korumalı sistem rolü'],
  ['admin', 'Yönetici', 'Mağaza operasyonlarını ve yönetim modüllerini kullanır. Kullanıcı ve rol yönetemez.', LockKeyhole, 'Operasyon erişimi'],
  ['editor', 'Editör', 'Ürün, katalog, medya, stok ve içerik gibi atanmış operasyonel alanlarda çalışır.', PencilLine, 'Sınırlı içerik erişimi'],
  ['customer', 'Müşteri', 'Yalnız public kayıt akışından oluşur ve yönetim paneline erişemez.', UserRound, 'Panel erişimi yok'],
];

export default async function AdminRolesPage() {
  const user = await getSessionUser();
  if (!user?.roles?.includes('super_admin')) redirect('/admin');

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Erişim modeli" title="Roller ve sınırlar" description="Sistem rollerinin güvenlik sınırları sabittir. Admin ve editör atamalarını kullanıcı ekranından yönetin." actions={<Link href="/admin/users" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background">Kullanıcıları yönet</Link>} />
      <section className="grid gap-4 xl:grid-cols-2">
        {roles.map(([code, name, description, Icon, scope]) => (
          <article key={code} className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,35,61,0.03)] sm:p-6">
            <div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-xl border border-border bg-muted/55 text-primary"><Icon className="size-4.5" /></span><span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-[0.68rem] font-medium text-muted-foreground">{scope}</span></div>
            <p className="mt-5 font-mono text-[0.7rem] text-muted-foreground">{code}</p>
            <h2 className="mt-1 text-lg font-semibold">{name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
