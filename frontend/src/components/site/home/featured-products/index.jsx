import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { listProducts } from '@/data/products';
import ProductCard from '../../product-card';
import SectionHeading from '../section-heading';

export default async function FeaturedProducts({ locale, copy }) {
  const products = (await listProducts(locale)).slice(0, 3);

  return (
    <section className="grid-container py-[clamp(4.5rem,10vw,9rem)]" aria-labelledby="featured-products-title">
      <div>
        <SectionHeading
          title={<span id="featured-products-title">{copy.title}</span>}
          description={copy.description}
          action={
            <Link href="/shop" className="inline-flex items-center gap-2 border-b border-[#232323] pb-1 text-sm font-medium">
              {copy.action}<ArrowUpRight className="size-4" />
            </Link>
          }
        />

        {products.length > 0 ? (
          <div className="home-product-scroll mt-[clamp(2.5rem,5vw,5rem)] flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                explore={copy.explore}
                locale={locale}
                className="min-w-[82vw] snap-start sm:min-w-[48%] lg:min-w-0"
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 border-y border-black/10 py-16 text-center">
            <p className="text-lg font-medium">{copy.emptyTitle}</p>
            <p className="mt-2 text-sm text-[#666a70]">{copy.emptyDescription}</p>
          </div>
        )}
      </div>
    </section>
  );
}
