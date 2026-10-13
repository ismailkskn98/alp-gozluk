import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';

export default function ModelCard({ entry, imageLabel }) {
  const { image, product } = entry;

  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={image.url}
          alt={image.altText || `${product.name} ${imageLabel}`}
          fill
          quality={PRODUCT_IMAGE_QUALITY}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 46vw, 46vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex items-start justify-between gap-3 pt-3 text-[#232323]">
        <h3 className="text-[clamp(0.82rem,1.05vw,1rem)] font-medium leading-snug">{product.name}</h3>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0" />
      </div>
    </Link>
  );
}
