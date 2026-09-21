import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export default function CartRecommendations({ products, labels, locale, formatCurrency }) {
  return (
    <section className="mt-[clamp(2.5rem,5vw,5rem)] border-t border-border pt-7" aria-labelledby="cart-recommendations-title">
      <div className="flex items-end justify-between gap-6">
        <h2 id="cart-recommendations-title" className="text-2xl leading-none sm:text-3xl">{labels.recommendations}</h2>
        <Link href="/shop" className="hidden border-b border-foreground pb-1 text-sm sm:block">{labels.viewAll}</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {products.map((product) => (
          <article key={`${product.slug}-${product.image}`} className="min-w-0">
            <Link href={`/product/${product.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#f1f3f2]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                  className="object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.025]"
                />
              </div>
              <h3 className="mt-3 truncate text-sm font-medium">{product.name}</h3>
              <div className="mt-1 flex flex-col text-xs text-muted-foreground sm:flex-row sm:justify-between sm:gap-3">
                <span className="truncate">{product.type[locale]}</span>
                <span className="shrink-0 text-foreground">{formatCurrency(product.price)}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
