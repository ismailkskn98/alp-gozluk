import { Link } from '@/i18n/navigation';
import ProductMedia from './media';
import ProductCardActions from './actions';
import ProductCardColors from './colors';

export default function ProductCard({ product, explore, locale, authenticated = false, className = '' }) {
  const type = locale === 'en'
    ? product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : product.type === 'Optik Çerçeve' ? 'Optical frame' : product.type
    : product.type;
  const imageLabel = locale === 'en' ? 'product view' : 'ürün görünümü';
  const isInStock = product.isInStock === undefined ? Number(product.stockQuantity) > 0 : Boolean(product.isInStock);
  const showLowStock = isInStock && product.stockStatus === 'low_stock';

  return (
    <article className={`group/card ${className}`}>
      <div className="relative">
        <ProductMedia product={product} explore={explore} imageLabel={imageLabel} />
        <ProductCardActions product={product} authenticated={authenticated} locale={locale} />
      </div>
      <div className="border-t border-black/8 py-4">
        <Link href={`/product/${product.slug}`} className="flex items-start justify-between gap-5 focus-visible:outline-offset-4">
          <div>
          <h3 className="text-sm font-medium">{product.name}</h3>
          <p className="mt-1 text-xs text-[#75787c]">{type}</p>
          </div>
          <p className="shrink-0 text-sm tabular-nums">{product.price}</p>
        </Link>
        <ProductCardColors colors={product.colors} locale={locale} />
        {!isInStock ? <p className="mt-1.5 text-xs font-medium text-[#8d3d37]">{locale === 'tr' ? 'Tükendi' : 'Sold out'}</p> : null}
        {showLowStock ? (
          <p className="mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-[#9a5b00]">
            {Number(product.activeVariantCount) === 1
              ? (locale === 'tr' ? `Tükenmek üzere · Son ${product.stockQuantity} adet` : `Almost gone · Only ${product.stockQuantity} left`)
              : (locale === 'tr' ? 'Tükenmek üzere' : 'Almost gone')}
          </p>
        ) : null}
      </div>
    </article>
  );
}
