'use client';

import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';

export default function MobileNavbar({ items, labels }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCode, setExpandedCode] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
    setExpandedCode(null);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="grid size-10 place-items-center bg-white hover:bg-[#f4f5f6]"
        aria-label={isOpen ? labels.close : labels.open}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-black/10 bg-white px-[4vw] pb-10 pt-3">
          <nav aria-label={labels.navigation}>
            <ul>
              {items.map((item) => {
                const expanded = expandedCode === item.code;
                return (
                  <li key={item.code} className="border-b border-black/10">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={item.href || '/shop'} onClick={closeMenu} className="flex-1 py-4 text-xl leading-none">
                        {item.label}
                      </Link>
                      {item.children?.length ? (
                        <button type="button" className="grid size-11 place-items-center" aria-label={`${item.label} ${labels.toggle}`} aria-expanded={expanded} onClick={() => setExpandedCode(expanded ? null : item.code)}>
                          <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                      ) : null}
                    </div>
                    {expanded ? (
                      <div className="grid gap-6 pb-6 sm:grid-cols-2">
                        {item.children.map((group) => (
                          <section key={group.code}>
                            {group.children?.length ? <h2 className="mb-2 text-xs font-medium text-muted-foreground">{group.label}</h2> : null}
                            <ul className="space-y-1">
                              {(group.children?.length ? group.children : [group]).map((child) => (
                                <li key={child.code}>
                                  <Link href={child.href || item.href || '/shop'} onClick={closeMenu} className="block py-2 text-sm">{child.label}</Link>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
