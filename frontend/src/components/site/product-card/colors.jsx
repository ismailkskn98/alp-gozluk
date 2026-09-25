'use client';

import { Tooltip } from '@/components/motion/tooltip';
import { cn } from '@/lib/utils';

export default function ProductCardColors({ colors = [], locale }) {
  const visibleColors = colors.slice(0, 4);
  const remainingCount = Math.max(0, colors.length - visibleColors.length);
  if (visibleColors.length === 0) return null;

  return (
    <div className="mt-2 flex min-h-5 items-center gap-1.5" aria-label={locale === 'tr' ? 'Renk seçenekleri' : 'Color options'}>
      {visibleColors.map((color) => (
        <Tooltip
          key={color.id || color.code}
          content={`${color.name}${color.isInStock ? '' : locale === 'tr' ? ' · Stokta yok' : ' · Out of stock'}`}
          side="top"
          delay={100}
        >
          <span
            tabIndex={0}
            role="img"
            aria-label={`${color.name}${color.isInStock ? '' : locale === 'tr' ? ', stokta yok' : ', out of stock'}`}
            className={cn(
              'relative block size-3.5 border border-black/15 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#172536]/25',
              !color.isInStock && 'opacity-35 after:absolute after:left-1/2 after:top-[-2px] after:h-[calc(100%+4px)] after:w-px after:-translate-x-1/2 after:rotate-45 after:bg-[#7b3330]',
            )}
            style={{ backgroundColor: color.swatchValue || '#d9dde0' }}
          />
        </Tooltip>
      ))}
      {remainingCount ? <span className="ml-0.5 text-[0.68rem] text-muted-foreground">+{remainingCount}</span> : null}
    </div>
  );
}
