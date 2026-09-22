import { Link } from '@/i18n/navigation';
import ProductMedia from './media';
import ProductCardActions from './actions';

export default function ProductCard({ product, explore, locale, authenticated = false, className = '' }) {
  const type = locale === 'en'
    ? product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : product.type === 'Optik Çerçeve' ? 'Optical frame' : product.type
    : product.type;
  const imageLabel = locale === 'en' ? 'product view' : 'ürün görünümü';

  return (
    <article className={`group/card ${className}`}>
      <div className="relative">
        <ProductMedia product={product} explore={explore} imageLabel={imageLabel} />
        <ProductCardActions product={product} authenticated={authenticated} locale={locale} />
      </div>
      <Link href={`/product/${product.slug}`} className="flex items-start justify-between gap-5 border-t border-black/8 py-4 focus-visible:outline-offset-4">
        <div>
          <h3 className="text-sm font-medium">{product.name}</h3>
          <p className="mt-1 text-xs text-[#75787c]">{type}</p>
        </div>
        <p className="shrink-0 text-sm tabular-nums">{product.price}</p>
      </Link>
    </article>
  );
}
