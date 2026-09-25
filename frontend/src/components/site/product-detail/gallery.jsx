'use client';

import Image from 'next/image';
import { Glasses } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { useReducedMotion } from 'motion/react';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';
import { cn } from '@/lib/utils';

const hasPreparedWhiteCanvas = (src) => typeof src === 'string' && src.includes('/uploads/public/products/demo/');

export default function ProductGallery({ color, images = [], name, imageLabel }) {
  const availableImages = images.filter(Boolean).slice(0, 8);
  const imageRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();
  const remainingImageCount = Math.max(0, availableImages.length - 1);

  useEffect(() => {
    const nodes = imageRefs.current.filter(Boolean);
    if (nodes.length < 2) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visibleEntry) setActiveIndex(Number(visibleEntry.target.dataset.imageIndex));
    }, {
      rootMargin: '-18% 0px -58% 0px',
      threshold: [0.05, 0.2, 0.45, 0.7],
    });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [availableImages.length]);

  function focusImage(index) {
    const target = imageRefs.current[index];
    if (!target) return;
    setActiveIndex(index);
    if (lenis && !reduceMotion) {
      lenis.scrollTo(target, { offset: -112, duration: 0.7 });
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  if (availableImages.length === 0) {
    return (
      <div className="grid min-h-[22rem] place-items-center border border-black/8 bg-white lg:min-h-[38rem]" style={{ backgroundColor: color }}>
        <Glasses className="size-40 text-foreground/45 sm:size-56" strokeWidth={1} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-[4.5rem_minmax(0,1fr)]">
      <div className="sticky top-[4.75rem] z-10 flex gap-2 self-start overflow-x-auto border-y border-black/8 bg-white/95 py-2 backdrop-blur lg:top-28 lg:flex-col lg:overflow-visible lg:border-0 lg:bg-transparent lg:py-0" aria-label={`${name} ${imageLabel}`}>
        {availableImages.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => focusImage(index)}
            aria-label={`${name} ${imageLabel} ${index + 1}`}
            aria-pressed={activeIndex === index}
            className={cn(
              'relative aspect-[4/3] w-[4.5rem] shrink-0 overflow-hidden border bg-white transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172536]/25',
              activeIndex === index ? 'border-[#172536] opacity-100' : 'border-black/10 opacity-60 hover:border-black/40 hover:opacity-100',
            )}
          >
            <Image src={src} alt="" fill quality={PRODUCT_IMAGE_QUALITY} sizes="72px" className={cn('object-contain', !hasPreparedWhiteCanvas(src) && 'p-1')} />
          </button>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {availableImages.map((src, index) => {
          const isFirst = index === 0;
          const isLastUnpaired = index > 0 && remainingImageCount % 2 === 1 && index === availableImages.length - 1;
          return (
            <figure
              key={`${src}-panel-${index}`}
              ref={(node) => { imageRefs.current[index] = node; }}
              data-image-index={index}
              className={cn(
                'relative grid aspect-[4/3] scroll-mt-28 place-items-center overflow-hidden border border-black/8 bg-white',
                (isFirst || isLastUnpaired) && 'sm:col-span-2',
              )}
              style={{ backgroundColor: color }}
            >
              <Image
                src={src}
                alt={`${name} ${imageLabel} ${index + 1}`}
                fill
                quality={PRODUCT_IMAGE_QUALITY}
                priority={isFirst}
                sizes={(isFirst || isLastUnpaired)
                  ? '(min-width: 1440px) 55rem, (min-width: 1024px) 58vw, 96vw'
                  : '(min-width: 1440px) 27rem, (min-width: 1024px) 29vw, (min-width: 640px) 48vw, 96vw'}
                className={cn('object-contain', !hasPreparedWhiteCanvas(src) && 'p-[clamp(1rem,3vw,3rem)]')}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}
