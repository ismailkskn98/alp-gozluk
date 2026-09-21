import { listProducts } from '@/data/products';
import ProductCard from './product-card';

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
        <ProductCard
          key={product.slug}
          product={product}
          explore={tr ? 'Ürünü incele' : 'View product'}
          locale={locale}
        />
      ))}
    </div>
  );
}
