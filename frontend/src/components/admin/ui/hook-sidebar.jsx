'use client';

// RareUI Hook Sidebar davranışı proje navigasyonuna ikon ve badge desteğiyle uyarlandı.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const corner = 6;
const dash = 'repeating-linear-gradient(to top, transparent 0 2px, currentColor 2px 4px)';

function Rail({ from = 0, y, visible, color, className }) {
  const reduced = useReducedMotion();
  const travel = reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 };

  return (
    <motion.span aria-hidden initial={false} style={{ color }} animate={{ opacity: visible && y !== null ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.18 }} className={cn('pointer-events-none absolute inset-0', className)}>
      <motion.span initial={false} animate={{ top: from, height: Math.max(0, (y ?? 0) - corner - from) }} transition={travel} style={{ backgroundImage: dash }} className="absolute left-0.5 w-px" />
      <motion.svg initial={false} animate={{ top: (y ?? 0) - corner }} transition={travel} width="12" height="7" viewBox="0 0 12 7" fill="none" className="absolute left-0.5">
        <path d="M0.5 0a6 6 0 0 0 6 6H12" stroke="currentColor" strokeDasharray="2 2" />
      </motion.svg>
    </motion.span>
  );
}

export default function HookSidebar({ items, label, compact = false, color = 'var(--sidebar-primary)', onNavigate, className }) {
  const pathname = usePathname();
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [centers, setCenters] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const activeIndex = items.findIndex((item) => item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const measure = () => setCenters(itemRefs.current.map((element) => element ? element.offsetTop + element.offsetHeight / 2 : 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, compact]);

  const activeY = activeIndex < 0 ? null : (centers[activeIndex] ?? null);
  const hoverY = hoverIndex === null ? null : (centers[hoverIndex] ?? null);
  const hoverFrom = activeY !== null && hoverY !== null && hoverY <= activeY ? Math.max(0, hoverY - corner) : (activeY ?? 0);

  return (
    <nav aria-label={label} className={cn('flex flex-col', className)}>
      {!compact && label ? <span className="pb-2.5 pl-1 pr-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span> : null}
      <div ref={listRef} onMouseLeave={() => setPointerInside(false)} className="relative flex flex-col gap-0.5">
        <Rail from={hoverFrom} y={hoverY} visible={(pointerInside || focusInside) && hoverIndex !== activeIndex} className="text-sidebar-foreground/20" />
        <Rail y={activeY} visible={activeY !== null} color={color} />
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;
          return (
            <Link
              key={item.href}
              ref={(element) => { itemRefs.current[index] = element; }}
              href={item.href}
              title={compact ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              onMouseEnter={() => { setHoverIndex(index); setPointerInside(true); }}
              onFocus={() => { setHoverIndex(index); setFocusInside(true); }}
              onBlur={() => setFocusInside(false)}
              className={cn('group ml-0.5 flex min-h-9 items-center rounded-lg py-1.5 text-sm transition-colors duration-200', compact ? 'justify-center pl-3 pr-2.5' : 'gap-2.5 pl-5 pr-2.5', active ? 'bg-sidebar-accent/70 text-sidebar-foreground' : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground')}
            >
              {Icon ? <Icon className={cn('size-4 shrink-0 transition-colors', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80')} /> : null}
              <span className={cn('min-w-0 flex-1 truncate', compact && 'sr-only')}>{item.label}</span>
              {!compact && item.badge ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-muted-foreground">{item.badge}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
