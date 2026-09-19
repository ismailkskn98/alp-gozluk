'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const links = [['Genel bakış', '/admin'], ['Ürünler', '/admin/products'], ['Siparişler', '/admin/orders'], ['Stok', '/admin/inventory'], ['Ayarlar', '/admin/settings']];

export default function MobileAdminHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-30 border-b border-border bg-white md:hidden"><div className="flex h-14 items-center justify-between px-4"><Link href="/admin" className="font-semibold">ALP Yönetim</Link><button type="button" onClick={() => setOpen((value) => !value)} className="grid size-9 place-items-center rounded-md border border-border" aria-label="Yönetim menüsü"><Menu className="size-4" /></button></div>{open ? <nav className="space-y-1 border-t border-border p-3">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{label}</Link>)}</nav> : null}</header>;
}
