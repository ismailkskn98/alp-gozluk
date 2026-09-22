"use client";

import Image from "next/image";
import { ArrowUpRight, Glasses } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_IMAGE_QUALITY, shouldUseOriginalProductImage } from "@/lib/product-images";

export default function ProductMedia({ product, explore, imageLabel }) {
  const images = (product.images || []).filter(Boolean).slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);

  function showImage(index) {
    setActiveIndex(index);
  }

  return (
    <div className="relative">
      <Link
        href={`/product/${product.slug}`}
        className="group relative grid aspect-[4/4.7] place-items-center overflow-hidden bg-white focus-visible:outline-offset-4"
        onMouseLeave={() => showImage(0)}
        aria-label={`${product.name} — ${explore}`}
      >
        {images.length > 0 ? (
          images.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={index === 0 ? `${product.name} ${imageLabel}` : ""}
              fill
              quality={PRODUCT_IMAGE_QUALITY}
              unoptimized={shouldUseOriginalProductImage(src)}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 82vw"
              className={`object-contain transition-[opacity,transform] duration-300 ease-out ${activeIndex === index ? "scale-100 opacity-100" : "pointer-events-none scale-[0.985] opacity-0"}`}
            />
          ))
        ) : (
          <Glasses className="size-28 text-black/45 sm:size-36" strokeWidth={1.1} aria-hidden="true" />
        )}

        <span className="absolute left-4 top-4 z-10 text-[0.7rem] text-black/48">ALP / {product.name}</span>

        {images.length > 1 ? (
          <span className="absolute inset-0 z-10 hidden md:grid" style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }} aria-hidden="true">
            {images.map((src, index) => (
              <span key={src} onMouseEnter={() => showImage(index)} />
            ))}
          </span>
        ) : null}

        <span className="absolute bottom-4 right-4 z-20 grid size-9 place-items-center bg-white/88 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Link>

      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5 md:hidden" aria-label={explore}>
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`h-1.5 transition-[width,background-color] ${activeIndex === index ? "w-6 bg-black" : "w-3 bg-black/25"}`}
              onClick={() => showImage(index)}
              aria-label={`${product.name} ${index + 1}. ${imageLabel}`}
              aria-pressed={activeIndex === index}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
