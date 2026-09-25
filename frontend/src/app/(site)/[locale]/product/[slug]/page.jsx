import { ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/site/product-detail/gallery';
import ProductSpecifications from '@/components/site/product-detail/specifications';
import ProductDetailActions from '@/components/site/product-detail/actions';
import FulfillmentSummary from '@/components/site/product-detail/fulfillment-summary';
import ShareButton from '@/components/site/product-detail/share-button';
import { findProduct } from '@/data/products';
import { getCommerceSettings } from '@/data/commerce-settings';
import { getSessionUser } from '@/lib/server-api';

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const [product, user, commerceSettings] = await Promise.all([
    findProduct(locale, slug),
    getSessionUser(),
    getCommerceSettings(),
  ]);
  if (!product) notFound();
  const tr = locale === 'tr';
  const isSaleReady = !['Fiyat yakında', 'Price coming soon'].includes(product.price);
  return (
    <section className="grid-container py-[clamp(1.5rem,4vw,4rem)]">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)] lg:gap-[clamp(2rem,3.5vw,4rem)]">
        <ProductGallery
          color={product.color}
          images={product.images}
          name={product.name}
          imageLabel={tr ? 'ürün görünümü' : 'product view'}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs text-muted-foreground">{tr ? product.type : product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : 'Optical frame'}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-[clamp(1.5rem,2.2vw,2.2rem)] font-normal leading-[1.08] tracking-[-0.025em]">{product.name}</h1>
            <ShareButton name={product.name} locale={locale} />
          </div>
          <p className="mt-4 text-lg font-semibold tabular-nums">{product.price}</p>
          <p className="mt-4 max-w-[34rem] text-sm leading-6 text-muted-foreground">{product.shortDescription || (tr ? 'Dengeli oranları ve hafif yapısıyla günlük kullanıma göre tasarlanmış çerçeve.' : 'A frame designed for everyday wear with balanced proportions and a lightweight feel.')}</p>
          <ProductDetailActions product={product} authenticated={Boolean(user)} locale={locale} saleReady={isSaleReady} />
          <FulfillmentSummary settings={commerceSettings} locale={locale} />
          <p className="mt-3 flex items-center gap-2 border-b border-black/10 pb-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-[#172536]" strokeWidth={1.4} />{tr ? 'Güvenli ödeme ve takipli gönderim' : 'Secure payment and tracked delivery'}</p>
          <ProductSpecifications
            specifications={product.specifications}
            title={tr ? 'Ürün özellikleri' : 'Product specifications'}
          />
        </div>
      </div>
    </section>
  );
}
