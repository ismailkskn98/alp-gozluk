'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';

export default function MobileNavbar({ items, labels }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid size-9 place-items-center bg-white hover:bg-[#f4f5f6]"
        aria-label={isOpen ? labels.close : labels.open}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {isOpen ? (
        <div className="absolute inset-x-[calc(-4vw)] top-full border-b border-black/10 bg-white px-[4vw] py-5 shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
          <nav aria-label={labels.navigation} className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-black/8 px-1 py-3 text-base font-normal last:border-0"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
