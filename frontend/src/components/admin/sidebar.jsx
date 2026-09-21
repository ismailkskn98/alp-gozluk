'use client';

import {
  BarChart3, Boxes, ChevronLeft, CircleDollarSign, FileText, FolderTree,
  ImageIcon, LayoutDashboard, ListTree, LogOut, Megaphone, Package, Settings, Shield, Tags,
  ShoppingBag, Users, Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';

const groups = [
  { label: 'Genel', items: [['Genel bakış', '/admin', LayoutDashboard], ['Siparişler', '/admin/orders', ShoppingBag], ['Müşteriler', '/admin/customers', Users]] },
  { label: 'Katalog', items: [['Ürünler', '/admin/products', Package], ['Kategoriler', '/admin/categories', FolderTree], ['Koleksiyonlar', '/admin/collections', Boxes], ['Hedef kitleler', '/admin/audiences', Users], ['Özellikler', '/admin/attributes', Tags], ['Markalar', '/admin/brands', Boxes], ['Mega menü', '/admin/navigation', ListTree], ['Stok', '/admin/inventory', Warehouse], ['Medya', '/admin/media', ImageIcon]] },
  { label: 'Pazarlama', items: [['Kampanyalar', '/admin/campaigns', Megaphone], ['İçerik', '/admin/content', FileText], ['Raporlar', '/admin/reports', BarChart3]] },
  { label: 'Sistem', items: [['Kullanıcılar', '/admin/users', Users], ['Roller', '/admin/roles', Shield], ['Audit log', '/admin/audit-logs', CircleDollarSign], ['Ayarlar', '/admin/settings', Settings]] },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <aside className={cn('sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-white transition-[width] md:flex', collapsed ? 'w-[4.5rem]' : 'w-64')}>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/admin" className="overflow-hidden whitespace-nowrap font-semibold tracking-tight">{collapsed ? 'A' : 'ALP Yönetim'}</Link>
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="grid size-8 place-items-center rounded-md hover:bg-muted" aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}><ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed ? <p className="mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p> : null}
            <div className="space-y-1">
              {group.items.map(([label, href, Icon]) => {
                const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
                return <Link key={href} href={href} title={collapsed ? label : undefined} className={cn('flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors', active ? 'bg-primary text-white' : 'text-foreground/70 hover:bg-muted hover:text-foreground')}><Icon className="size-4 shrink-0" /><span className={cn('truncate', collapsed && 'sr-only')}>{label}</span></Link>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        {!collapsed ? <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{user.email}</p> : null}
        <button type="button" onClick={logout} className="flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground"><LogOut className="size-4" /><span className={cn(collapsed && 'sr-only')}>Çıkış yap</span></button>
      </div>
    </aside>
  );
}
