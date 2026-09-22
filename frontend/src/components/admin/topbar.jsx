'use client';

import { Bell, ChevronDown, LogOut, Menu, Search, Store, UserRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { routeLabels } from './navigation';
import ThemeToggle from './ui/theme-toggle';
import Tooltip from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

export default function AdminTopbar({ user, onMenuOpen, onSearch }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLabel = routeLabels[pathname] || Object.entries(routeLabels).find(([href]) => href !== '/admin' && pathname.startsWith(href))?.[1] || 'Yönetim';
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A';

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur-xl">
      <div className="grid-container"><div className="flex h-14 items-center gap-2 px-[clamp(1rem,2.2vw,2rem)]">
        <button type="button" onClick={onMenuOpen} className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground md:hidden" aria-label="Yönetim menüsünü aç"><Menu className="size-4" /></button>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold tracking-[-0.01em]">{currentLabel}</p><p className="hidden text-[0.66rem] text-muted-foreground sm:block">ALP Gözlük / Yönetim konsolu</p></div>
        <button type="button" onClick={onSearch} className="hidden h-9 min-w-52 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong lg:flex"><Search className="size-3.5" /><span className="flex-1 text-left">Komut ara</span><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.62rem]">⌘K</kbd></button>
        <Tooltip content="Bildirimler"><Popover><PopoverTrigger asChild><button type="button" className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Bildirimleri aç"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-card" /></button></PopoverTrigger><PopoverContent align="end"><p className="text-sm font-semibold">Bildirimler</p><div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Yeni bildirim bulunmuyor. Sipariş, stok ve güvenlik uyarıları burada görünecek.</div></PopoverContent></Popover></Tooltip>
        <Tooltip content="Tema"><ThemeToggle /></Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card pl-1.5 pr-2 text-sm outline-none hover:border-border-strong"><span className="grid size-6 place-items-center rounded-md bg-foreground text-[0.65rem] font-semibold text-background">{initials}</span><ChevronDown className="size-3.5 text-muted-foreground" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60"><DropdownMenuLabel><span className="block truncate text-foreground">{user.firstName} {user.lastName}</span><span className="mt-0.5 block truncate font-normal">{user.email}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => router.push('/admin/settings')}><UserRound className="size-4" />Hesap ve güvenlik</DropdownMenuItem><DropdownMenuItem onSelect={() => router.push('/')}><Store className="size-4" />Mağazaya dön</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={logout} className="text-danger focus:bg-danger/10"><LogOut className="size-4" />Çıkış yap</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div></div>
    </header>
  );
}
