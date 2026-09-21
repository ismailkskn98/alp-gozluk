'use client';

import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';

export default function Navbar({ items, labels }) {
  const [activeCode, setActiveCode] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setActiveCode(null);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setActiveCode(null);
  }

  return (
    <nav
      ref={navRef}
      aria-label={labels.navigation}
      className="col-start-1 row-start-1 hidden h-full items-center justify-self-start lg:flex"
      onMouseLeave={() => setActiveCode(null)}
      onBlur={handleBlur}
    >
      <ul className="flex h-full items-center gap-[clamp(1rem,1.8vw,2rem)]">
        {items.map((item) => (
          <li key={item.code} className="flex h-full items-center">
            {item.children?.length ? (
              <button
                type="button"
                aria-expanded={activeCode === item.code}
                aria-controls={`mega-menu-${item.code}`}
                className="group flex h-full items-center gap-1 text-[0.76rem] text-[#42474d] transition-colors hover:text-[#101820]"
                onMouseEnter={() => setActiveCode(item.code)}
                onFocus={() => setActiveCode(item.code)}
                onClick={() => setActiveCode((current) => current === item.code ? null : item.code)}
              >
                {item.label}
                <ChevronDown className={`size-3 transition-transform ${activeCode === item.code ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </button>
            ) : (
              <Link href={item.href || '/shop'} className="flex h-full items-center text-[0.76rem] text-[#42474d] transition-colors hover:text-[#101820]">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {items.filter((item) => item.children?.length).map((menuItem) => (
        <div key={menuItem.code} id={`mega-menu-${menuItem.code}`} className={`${activeCode === menuItem.code ? 'block' : 'hidden'} absolute inset-x-0 top-full border-y border-black/10 bg-white shadow-[0_22px_44px_rgba(16,35,61,0.08)]`}>
          <div className="grid-container">
            <div className="grid min-h-[23rem] grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)] gap-[clamp(2rem,5vw,5rem)] py-[clamp(1.75rem,4vh,3rem)]">
              <div className="grid content-start grid-cols-3 gap-[clamp(1.5rem,3vw,3.5rem)]">
                {menuItem.children.map((group) => (
                  <section key={group.code}>
                    {group.children?.length ? <h2 className="border-b border-black/10 pb-3 text-xs font-medium text-[#71767c]">{group.label}</h2> : null}
                    <ul className={group.children?.length ? 'mt-4 space-y-3' : 'space-y-3'}>
                      {(group.children?.length ? group.children : [group]).map((child) => (
                        <li key={child.code}>
                          <Link
                            href={child.href || menuItem.href || '/shop'}
                            className={`inline-flex text-[#15191d] transition-[color,transform] duration-150 hover:translate-x-0.5 hover:text-primary ${group.children?.length ? 'text-[0.92rem]' : 'border-b border-black/10 pb-3 text-base font-medium'}`}
                            onClick={() => setActiveCode(null)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <Link href={menuItem.href || '/shop'} className="col-span-3 mt-auto w-fit border-b border-black pb-1 text-sm font-medium" onClick={() => setActiveCode(null)}>
                  {labels.viewAll}
                </Link>
              </div>
              <Link href={menuItem.href || '/shop'} className="group relative min-h-[19rem] overflow-hidden bg-[#eef0ef]" onClick={() => setActiveCode(null)}>
                {menuItem.imageUrl ? (
                  <Image src={menuItem.imageUrl} alt="" fill sizes="(min-width: 1440px) 30rem, 30vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-2xl leading-tight">{menuItem.label}</p>
                  {menuItem.description ? <p className="mt-2 max-w-[34ch] text-sm text-white/80">{menuItem.description}</p> : null}
                </div>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </nav>
  );
}
