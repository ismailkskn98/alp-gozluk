'use client';

import { Heart, LayoutDashboard, MapPin, Package, UserRound } from 'lucide-react';
import HookSidebar from '@/components/admin/ui/hook-sidebar';

const items = [
  { id: 'overview', href: '#overview', label: 'Genel bakış', icon: LayoutDashboard },
  { id: 'orders', href: '#orders', label: 'Siparişlerim', icon: Package },
  { id: 'addresses', href: '#addresses', label: 'Adreslerim', icon: MapPin },
  { id: 'favorites', href: '#favorites', label: 'Favorilerim', icon: Heart },
  { id: 'profile', href: '#profile', label: 'Üyelik bilgilerim', icon: UserRound },
];

export default function AccountNav({ active, onChange, logout }) {
  return (
    <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
      <div className="border-r border-[#d8ddd7] pr-5 xl:pr-7">
        <div className="mb-5 px-1">
          <p className="text-[0.7rem] font-medium tracking-[0.01em] text-[#69736d]">Hesabım</p>
          <p className="mt-1 text-sm leading-5 text-[#1d2b3c]">Sana özel alan</p>
        </div>
        <HookSidebar
          items={items}
          label="Hesap bölümleri"
          activeHref={`#${active}`}
          color="#1d4f83"
          itemClassName="focus-visible:outline-none focus-visible:outline-offset-0"
          onNavigate={(item, event) => {
            event.preventDefault();
            onChange(item.id);
          }}
          className="[&_[data-slot='gooey-nav']]:hidden"
        />
        <div className="mt-6 border-t border-[#d8ddd7] pt-3">
          {logout}
        </div>
      </div>
    </aside>
  );
}

export { items as accountNavigationItems };
