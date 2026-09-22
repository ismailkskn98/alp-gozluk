import { ShieldCheck, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/site/product-detail/gallery';
import ProductSpecifications from '@/components/site/product-detail/specifications';
import ProductDetailActions from '@/components/site/product-detail/actions';
import { findProduct } from '@/data/products';
import { getSessionUser } from '@/lib/server-api';

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const [product, user] = await Promise.all([findProduct(locale, slug), getSessionUser()]);
  if (!product) notFound();
  const tr = locale === 'tr';
  const isSaleReady = !['Fiyat yakında', 'Price coming soon'].includes(product.price);
  return (
    <section className="grid-container py-[clamp(1.5rem,4vw,4rem)]">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:gap-[clamp(2rem,4vw,4.5rem)]">
        <ProductGallery
          color={product.color}
          images={product.images}
          name={product.name}
          imageLabel={tr ? 'ürün görünümü' : 'product view'}
          previousLabel={tr ? 'önceki görsel' : 'previous image'}
          nextLabel={tr ? 'sonraki görsel' : 'next image'}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs text-muted-foreground">{tr ? product.type : product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : 'Optical frame'}</p>
          <h1 className="mt-2 text-[clamp(2rem,3.2vw,3.25rem)] font-light leading-[1.02] tracking-[-0.035em]">{product.name}</h1>
          <p className="mt-5 text-lg font-medium tabular-nums">{product.price}</p>
          <p className="mt-6 max-w-[34rem] text-sm leading-6 text-muted-foreground">{product.shortDescription || (tr ? 'Dengeli oranları ve hafif yapısıyla günlük kullanıma göre tasarlanmış çerçeve.' : 'A frame designed for everyday wear with balanced proportions and a lightweight feel.')}</p>
          <ProductDetailActions product={product} authenticated={Boolean(user)} locale={locale} saleReady={isSaleReady} />
          <div className="mt-6 grid grid-cols-2 border-y border-black/10 py-5 text-xs text-muted-foreground">
            <p className="flex items-center gap-2.5 border-r border-black/10 pr-4"><Truck className="size-4 shrink-0 text-[#172536]" strokeWidth={1.4} />{tr ? 'Takipli gönderim' : 'Tracked delivery'}</p>
            <p className="flex items-center gap-2.5 pl-4"><ShieldCheck className="size-4 shrink-0 text-[#172536]" strokeWidth={1.4} />{tr ? 'Güvenli ödeme' : 'Secure payment'}</p>
          </div>
          <ProductSpecifications
            specifications={product.specifications}
            title={tr ? 'Ürün özellikleri' : 'Product specifications'}
          />
        </div>
      </div>
    </section>
  );
}
