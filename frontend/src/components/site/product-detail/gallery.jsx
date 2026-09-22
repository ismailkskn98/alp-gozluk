'use client';

import Image from 'next/image';
import { Glasses } from 'lucide-react';
import { useState } from 'react';
import { PRODUCT_IMAGE_QUALITY, shouldUseOriginalProductImage } from '@/lib/product-images';

export default function ProductGallery({ color, images = [], name, imageLabel }) {
  const availableImages = images.filter(Boolean).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = availableImages[activeIndex];

  return (
    <div className="min-w-0">
      <div
        className="relative grid aspect-[4/3] min-h-[20rem] place-items-center overflow-hidden sm:min-h-[28rem] lg:aspect-[5/4]"
        style={{ backgroundColor: color }}
      >
        {activeImage ? (
          <Image
            key={activeImage}
            src={activeImage}
            alt={`${name} ${imageLabel} ${activeIndex + 1}`}
            fill
            quality={PRODUCT_IMAGE_QUALITY}
            unoptimized={shouldUseOriginalProductImage(activeImage)}
            fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
            sizes="(min-width: 1440px) 52rem, (min-width: 1024px) 56vw, 96vw"
            className="object-contain p-[clamp(1.5rem,5vw,5rem)]"
          />
        ) : (
          <Glasses className="size-40 text-foreground/55 sm:size-56" strokeWidth={1} aria-hidden="true" />
        )}
      </div>

      {availableImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label={`${name} ${imageLabel}`}>
          {availableImages.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${name} ${imageLabel} ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-[4/3] overflow-hidden border bg-white transition-colors ${activeIndex === index ? 'border-foreground' : 'border-border hover:border-foreground/45'}`}
            >
              <Image
                src={src}
                alt=""
                fill
                quality={PRODUCT_IMAGE_QUALITY}
                unoptimized={shouldUseOriginalProductImage(src)}
                sizes="(min-width: 1024px) 10rem, (min-width: 640px) 18vw, 30vw"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
