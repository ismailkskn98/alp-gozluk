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
        className="grid size-10 place-items-center rounded-full border border-border bg-white"
        aria-label={isOpen ? labels.close : labels.open}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-border bg-white px-[4%] py-5 shadow-lg">
          <nav aria-label={labels.navigation} className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-base font-medium hover:bg-muted"
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
