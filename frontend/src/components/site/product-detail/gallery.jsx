'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Glasses } from 'lucide-react';
import { useState } from 'react';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';

const hasPreparedWhiteCanvas = (src) => typeof src === 'string' && src.includes('/uploads/public/products/demo/');

export default function ProductGallery({ color, images = [], name, imageLabel, previousLabel, nextLabel }) {
  const availableImages = images.filter(Boolean).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = availableImages[activeIndex];
  const hasMultipleImages = availableImages.length > 1;

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? availableImages.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % availableImages.length);
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-[4.5rem_minmax(0,1fr)]">
      {hasMultipleImages ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label={`${name} ${imageLabel}`}>
          {availableImages.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${name} ${imageLabel} ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-[4/3] w-[4.5rem] shrink-0 overflow-hidden border bg-white transition-colors ${activeIndex === index ? 'border-[#172536]' : 'border-black/10 hover:border-black/40'}`}
            >
              <Image
                src={src}
                alt=""
                fill
                quality={PRODUCT_IMAGE_QUALITY}
                sizes="72px"
                className={`object-contain ${hasPreparedWhiteCanvas(src) ? 'p-0' : 'p-1'}`}
              />
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`group/gallery order-1 relative grid aspect-[4/3] min-h-[19rem] place-items-center overflow-hidden border border-black/8 lg:order-2 lg:min-h-[34rem] lg:aspect-[5/4] ${hasMultipleImages ? '' : 'lg:col-span-2'}`}
        style={{ backgroundColor: color }}
      >
        {activeImage ? (
          <Image
            key={activeImage}
            src={activeImage}
            alt={`${name} ${imageLabel} ${activeIndex + 1}`}
            fill
            quality={PRODUCT_IMAGE_QUALITY}
            fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
            sizes="(min-width: 1440px) 55rem, (min-width: 1024px) 62vw, 96vw"
            className={`object-contain ${hasPreparedWhiteCanvas(activeImage) ? 'p-0' : 'p-[clamp(1.5rem,5vw,5rem)]'}`}
          />
        ) : (
          <Glasses className="size-40 text-foreground/55 sm:size-56" strokeWidth={1} aria-hidden="true" />
        )}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label={`${name} — ${previousLabel}`}
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/92 opacity-100 shadow-sm transition-opacity md:opacity-0 md:group-hover/gallery:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft className="size-4" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={`${name} — ${nextLabel}`}
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/92 opacity-100 shadow-sm transition-opacity md:opacity-0 md:group-hover/gallery:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight className="size-4" strokeWidth={1.4} />
            </button>
            <div className="absolute inset-x-3 bottom-2 flex gap-1 lg:hidden" aria-hidden="true">
              {availableImages.map((src, index) => (
                <span key={src} className={`h-px flex-1 ${activeIndex === index ? 'bg-[#172536]' : 'bg-black/18'}`} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
