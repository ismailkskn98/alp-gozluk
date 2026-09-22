'use client';

import { AdminButton } from '@/components/admin/ui/button';

export default function RecoveryCodes({ codes, onContinue }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <h2 className="font-semibold">Kurtarma kodlarını kaydet</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Telefonuna erişemezsen bu kodlardan birini kullanabilirsin. Her kod yalnızca bir kez çalışır ve tekrar gösterilmez.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-4 sm:grid-cols-2">
        {codes.map((code) => <code key={code} className="rounded bg-background px-3 py-2 text-center text-sm">{code}</code>)}
      </div>
      <AdminButton type="button" onClick={onContinue} className="min-h-12 w-full">Kaydettim, panele devam et</AdminButton>
    </div>
  );
}
