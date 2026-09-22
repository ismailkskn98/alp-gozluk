import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';
import { AdminButton } from '@/components/admin/ui/button';

export default function AdminNotFound() {
  return (
    <section className="grid min-h-[min(65svh,38rem)] place-items-center rounded-2xl border border-border bg-card p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><SearchX className="size-5" /></span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">404 · Yönetim paneli</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Aradığınız bölüm bulunamadı.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Bağlantı kaldırılmış veya eriştiğiniz adres değişmiş olabilir.</p>
        <AdminButton as={Link} href="/admin" className="mt-6"><ArrowLeft className="size-4" />Panele dön</AdminButton>
      </div>
    </section>
  );
}
