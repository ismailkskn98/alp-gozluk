'use client';

import { Heart, House, LayoutDashboard, MapPin, Package, Settings, UserRound } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Genel bakış', icon: LayoutDashboard },
  { id: 'orders', label: 'Siparişlerim', icon: Package },
  { id: 'addresses', label: 'Adreslerim', icon: MapPin },
  { id: 'favorites', label: 'Favorilerim', icon: Heart },
  { id: 'profile', label: 'Üyelik bilgilerim', icon: UserRound },
];

export default function AccountNav({ active, onChange, logout }) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white p-2 lg:overflow-visible">
        <nav className="flex min-w-max gap-1 lg:block" aria-label="Hesap menüsü">
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors lg:w-full ${active === id ? 'bg-[#1b2635] text-white shadow-sm' : 'text-[#58606b] hover:bg-[#f3f4f2] hover:text-[#17202c]'}`}>
              <Icon className="size-4" strokeWidth={1.65} />{label}
            </button>
          ))}
        </nav>
        <div className="mt-2 hidden border-t border-black/8 pt-2 lg:block">
          <div className="flex items-center gap-3 px-3.5 py-2 text-sm text-[#58606b]"><Settings className="size-4" /> Güvenli oturum</div>
          {logout}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 px-1 text-xs text-[#7a818a] lg:hidden"><House className="size-3.5" /> ALP Gözlük hesabın güvenle korunur.</div>
    </aside>
  );
}
