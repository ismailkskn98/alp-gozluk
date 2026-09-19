import { Glasses } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { listProducts } from '@/data/products';

export default async function ProductGrid({ locale, limit }) {
  const tr = locale === 'tr';
  const availableProducts = await listProducts(locale);
  const products = limit ? availableProducts.slice(0, limit) : availableProducts;
  if (products.length === 0) {
    return <div className="rounded-lg border border-dashed border-border-strong bg-white px-6 py-16 text-center"><p className="font-medium">{tr ? 'Ürünler hazırlanıyor' : 'Products are being prepared'}</p><p className="mt-2 text-sm text-muted-foreground">{tr ? 'Katalog API bağlantısı tamamlandığında ürünler burada yayınlanacak.' : 'Products will appear here when the catalogue API connection is ready.'}</p></div>;
  }
  return (
    <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.slug}>
          <Link href={`/product/${product.slug}`} className="group block">
            <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-lg" style={{ backgroundColor: product.color }}>
              <Glasses className="size-24 text-foreground/55 transition-transform duration-300 group-hover:scale-105 sm:size-32" strokeWidth={1.15} />
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div><h2 className="font-semibold">{product.name}</h2><p className="mt-1 text-sm text-muted-foreground">{tr ? product.type : product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : 'Optical frame'}</p></div>
              <p className="text-sm font-medium">{product.price}</p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
