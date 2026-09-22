import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-api';

const roles = [
  ['super_admin', 'Süper yönetici', 'Başlangıçta env ve bootstrap komutuyla oluşturulur. Silinemez, devre dışı bırakılamaz ve başka hesaba atanamaz.'],
  ['admin', 'Yönetici', 'Mağaza operasyonlarını ve yönetim modüllerini kullanır. Kullanıcı ve rol yönetemez.'],
  ['editor', 'Editör', 'Ürün, katalog, medya, stok ve içerik gibi atanmış operasyonel alanlarda çalışır.'],
  ['customer', 'Müşteri', 'Yalnız public kayıt akışından oluşur ve yönetim paneline erişemez.'],
];

export default async function AdminRolesPage() {
  const user = await getSessionUser();
  if (!user?.roles?.includes('super_admin')) redirect('/admin');

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Erişim modeli</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Roller ve sınırlar</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Sistem rollerinin güvenlik sınırları sabittir. Admin ve editör atamalarını kullanıcı ekranından yönetin.</p>
        </div>
        <Link href="/admin/users" className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background">Kullanıcıları yönet</Link>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {roles.map(([code, name, description]) => (
          <article key={code} className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">{code}</p>
            <h2 className="mt-2 text-lg font-semibold">{name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
