'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Glasses } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';

export default function ProductMedia({ product, explore, imageLabel }) {
  const images = (product.images || []).filter(Boolean).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  function handlePointerMove(event) {
    if (!hasMultipleImages || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width - 1);
    setActiveIndex(Math.floor((relativeX / bounds.width) * images.length));
  }

  return (
    <div
      className="group/media relative grid aspect-[4/4.7] place-items-center overflow-hidden bg-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setActiveIndex(0)}
    >
      {images.length > 0 ? (
        images.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt={index === 0 ? `${product.name} ${imageLabel}` : ''}
            fill
            quality={PRODUCT_IMAGE_QUALITY}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 82vw"
            className={`object-contain transition-[opacity,transform] duration-300 ease-out ${activeIndex === index ? 'scale-100 opacity-100' : 'pointer-events-none scale-[0.985] opacity-0'}`}
          />
        ))
      ) : (
        <Glasses className="size-28 text-black/45 sm:size-36" strokeWidth={1.1} aria-hidden="true" />
      )}

      <Link
        href={`/product/${product.slug}`}
        className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0e51a1]"
        aria-label={`${product.name} — ${explore}`}
      />

      <span className="pointer-events-none absolute left-4 top-4 z-20 text-[0.7rem] text-black/48">
        ALP / {product.name}
      </span>

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={showPrevious}
            aria-label={`${product.name} — ${imageLabel}, ${activeIndex === 0 ? images.length : activeIndex}`}
            className="absolute left-3 top-1/2 z-30 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/92 text-[#172536] opacity-100 shadow-sm transition-[opacity,background-color] hover:bg-white focus-visible:opacity-100 md:opacity-0 md:group-hover/media:opacity-100"
          >
            <ChevronLeft className="size-4" strokeWidth={1.4} />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label={`${product.name} — ${imageLabel}, ${(activeIndex + 2) > images.length ? 1 : activeIndex + 2}`}
            className="absolute right-3 top-1/2 z-30 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/92 text-[#172536] opacity-100 shadow-sm transition-[opacity,background-color] hover:bg-white focus-visible:opacity-100 md:opacity-0 md:group-hover/media:opacity-100"
          >
            <ChevronRight className="size-4" strokeWidth={1.4} />
          </button>

          <div className="absolute inset-x-3 bottom-2 z-30 flex gap-1" aria-label={`${product.name} ${imageLabel}`}>
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${product.name} ${index + 1}. ${imageLabel}`}
                aria-pressed={activeIndex === index}
                className="group/segment h-3 flex-1 py-1"
              >
                <span className={`block h-px w-full transition-colors ${activeIndex === index ? 'bg-[#172536]' : 'bg-black/18 group-hover/segment:bg-black/45'}`} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
