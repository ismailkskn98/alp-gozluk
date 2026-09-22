import { ShieldCheck, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/site/product-detail/gallery';
import ProductSpecifications from '@/components/site/product-detail/specifications';
import { findProduct } from '@/data/products';

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const product = await findProduct(locale, slug);
  if (!product) notFound();
  const tr = locale === 'tr';
  const isSaleReady = !['Fiyat yakında', 'Price coming soon'].includes(product.price);
  return (
    <section className="grid-container py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <ProductGallery
          color={product.color}
          images={product.images}
          name={product.name}
          imageLabel={tr ? 'ürün görünümü' : 'product view'}
        />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr ? product.type : product.type === 'Güneş Gözlüğü' ? 'Sunglasses' : 'Optical frame'}</p>
          <h1 className="mt-3 text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg font-semibold">{product.price}</p>
          <p className="mt-6 leading-7 text-muted-foreground">{product.shortDescription || (tr ? 'Dengeli oranları ve hafif yapısıyla günlük kullanıma göre tasarlanmış çerçeve.' : 'A frame designed for everyday wear with balanced proportions and a lightweight feel.')}</p>
          <button
            type="button"
            disabled={!isSaleReady}
            className="mt-8 h-12 w-full rounded-md bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#124887] disabled:cursor-not-allowed disabled:bg-[#dfe2e4] disabled:text-[#70767b]"
          >
            {isSaleReady ? (tr ? 'Sepete ekle' : 'Add to cart') : (tr ? 'Satışa hazırlanıyor' : 'Preparing for sale')}
          </button>
          <div className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
            <p className="flex items-center gap-3"><Truck className="size-5 text-primary" />{tr ? 'Güvenli paketleme ve takipli gönderim' : 'Secure packaging and tracked delivery'}</p>
            <p className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" />{tr ? 'Backend doğrulamalı güvenli ödeme altyapısı' : 'Backend-verified secure payment infrastructure'}</p>
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
