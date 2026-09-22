'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, LifeBuoy, PanelLeftClose, Search, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import HookSidebar from './ui/hook-sidebar';
import ScrollArea from './ui/scroll-area';
import Tooltip from './ui/tooltip';
import { getAdminNavigation } from './navigation';

function UserIdentity({ user, compact }) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A';
  return (
    <div className={cn('flex items-center gap-2.5', compact && 'justify-center')}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-xs font-semibold text-background">{initials}</span>
      {!compact ? <div className="min-w-0"><p className="truncate text-xs font-semibold">{user.firstName} {user.lastName}</p><p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">{user.roles?.includes('super_admin') ? 'Süper yönetici' : user.roles?.includes('admin') ? 'Yönetici' : 'Editör'}</p></div> : null}
    </div>
  );
}

export default function AdminSidebar({ user, compact = false, onCompactChange, onSearch, onNavigate, mobile = false }) {
  const groups = getAdminNavigation(user);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border', compact ? 'justify-center px-2' : 'px-4')}>
        <Link href="/admin" onClick={onNavigate} className={cn('flex min-w-0 items-center gap-2.5', compact && 'justify-center')}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-card shadow-sm">
            <Image src="/brand/logo.png" alt="" width={34} height={24} className="h-6 w-auto object-contain" />
          </span>
          {!compact ? <span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-[-0.02em]">ALP Yönetim</span><span className="block text-[0.65rem] text-muted-foreground">Commerce console</span></span> : null}
        </Link>
        {!mobile && !compact ? <button type="button" onClick={() => onCompactChange(true)} className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Kenar çubuğunu daralt"><PanelLeftClose className="size-4" /></button> : null}
      </div>

      <div className={cn('shrink-0 px-3 pt-3', compact && 'px-2')}>
        <Tooltip content="Komut veya sayfa ara" side="right">
          <button type="button" onClick={onSearch} className={cn('flex h-9 w-full items-center rounded-lg border border-sidebar-border bg-card text-sm text-muted-foreground shadow-sm transition-colors hover:border-border-strong hover:text-foreground', compact ? 'justify-center px-2' : 'gap-2.5 px-3')}>
            <Search className="size-4 shrink-0" />
            {!compact ? <><span className="flex-1 text-left">Ara</span><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.62rem]">⌘K</kbd></> : null}
          </button>
        </Tooltip>
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName={cn('space-y-5 py-5', compact ? 'px-2' : 'px-3')}>
        {groups.map((group) => <HookSidebar key={group.label} label={group.label} items={group.items} compact={compact} onNavigate={onNavigate} />)}
      </ScrollArea>

      <div className={cn('shrink-0 border-t border-sidebar-border p-3', compact && 'px-2')}>
        <div className={cn('mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.7rem] text-muted-foreground', compact && 'justify-center px-0')}>
          <span className="size-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_srgb,var(--success)_12%,transparent)]" />
          {!compact ? <span>Servisler izleniyor</span> : null}
        </div>
        {!compact ? <div className="mb-2 grid grid-cols-2 gap-1"><Link href="/" className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><Store className="size-3.5" />Mağaza</Link><Link href="/admin/settings" onClick={onNavigate} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><LifeBuoy className="size-3.5" />Destek</Link></div> : null}
        <UserIdentity user={user} compact={compact} />
        {!mobile && compact ? <button type="button" onClick={() => onCompactChange(false)} className="mt-2 grid size-8 w-full place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" aria-label="Kenar çubuğunu genişlet"><ChevronLeft className="size-4 rotate-180" /></button> : null}
      </div>
    </div>
  );
}
