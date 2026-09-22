'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/button';

export default function AdminPanelError({ reset }) {
  return (
    <section className="grid min-h-[min(65svh,38rem)] place-items-center rounded-2xl border border-border bg-card p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger"><AlertTriangle className="size-5" /></span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-danger">Beklenmeyen hata</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Bu ekran şu anda yüklenemedi.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">İşleminiz kaydedilmemiş olabilir. Sayfayı güvenli biçimde yeniden deneyebilirsiniz.</p>
        <AdminButton type="button" onClick={reset} className="mt-6"><RefreshCw className="size-4" />Yeniden dene</AdminButton>
      </div>
    </section>
  );
}
