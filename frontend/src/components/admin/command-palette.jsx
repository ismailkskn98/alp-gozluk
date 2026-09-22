'use client';

import { ArrowRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getAdminNavigation } from './navigation';

export default function CommandPalette({ open, onOpenChange, user }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const items = useMemo(() => getAdminNavigation(user).flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))), [user]);
  const normalized = query.trim().toLocaleLowerCase('tr');
  const results = normalized ? items.filter((item) => `${item.label} ${item.group}`.toLocaleLowerCase('tr').includes(normalized)) : items.slice(0, 8);

  function navigate(href) {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[14vh] translate-y-0 p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader className="sr-only"><DialogTitle>Komut paleti</DialogTitle><DialogDescription>Yönetim sayfalarında ara.</DialogDescription></DialogHeader>
        <div className="flex items-center gap-3 border-b border-border px-4"><Search className="size-4 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sayfa veya işlem ara…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><kbd className="rounded-md border border-border bg-muted px-2 py-1 text-[0.65rem] text-muted-foreground">ESC</kbd></div>
        <div className="max-h-[min(60svh,28rem)] overflow-y-auto p-2">
          {results.length ? results.map((item) => {
            const Icon = item.icon;
            return <button key={item.href} type="button" onClick={() => navigate(item.href)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"><span className="grid size-8 place-items-center rounded-lg border border-border bg-card"><Icon className="size-4 text-muted-foreground" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.label}</span><span className="block text-[0.68rem] text-muted-foreground">{item.group}</span></span><ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" /></button>;
          }) : <p className="px-3 py-10 text-center text-sm text-muted-foreground">“{query}” için sonuç bulunamadı.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
