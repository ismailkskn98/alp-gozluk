import Image from 'next/image';
import { Glasses } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function SearchResultCard({ locale, product, onNavigate, viewProductLabel }) {
  const imageUrl = product.images?.[0];
  const productType = locale === 'en'
    ? product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : product.type === 'Optik Çerçeve' ? 'Optical frame' : product.type
    : product.type;

  return (
    <article className="min-w-0">
      <Link
        href={`/product/${product.slug}`}
        onClick={onNavigate}
        className="group block focus-visible:outline-offset-4"
        aria-label={`${product.name} — ${viewProductLabel}`}
      >
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#f3f4f2]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 46vw"
              className="object-contain p-[clamp(0.75rem,2vw,1.5rem)] transition-transform duration-300 group-hover:scale-[1.025]"
            />
          ) : (
            <Glasses className="size-20 text-black/35" strokeWidth={1.1} aria-hidden="true" />
          )}
        </div>
        <div className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">{product.name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{productType}</p>
          </div>
          <p className="shrink-0 text-sm tabular-nums text-foreground">{product.price}</p>
        </div>
      </Link>
    </article>
  );
}
