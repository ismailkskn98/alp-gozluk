'use client';

import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useAddCartItem, useFavoriteIds, useToggleFavorite } from '@/features/commerce';
import { announceCartItemAdded } from '@/components/site/commerce/events';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/motion/select';

function activeVariants(product) {
  return (product.activeVariants || product.variants || []).filter((variant) => !variant.status || variant.status === 'active');
}

export default function ProductDetailActions({ product, authenticated = false, locale, saleReady }) {
  const tr = locale === 'tr';
  const productId = Number(product.id);
  const commerceAuthenticated = authenticated && !product.isDemoProduct;
  const variants = activeVariants(product);
  const [selectedVariantId, setSelectedVariantId] = useState(() => String(variants.find((item) => item.stockQuantity !== 0)?.id || variants[0]?.id || ''));
  const variant = variants.find((item) => String(item.id) === selectedVariantId) || variants[0];
  const validProductId = Number.isInteger(productId) && productId > 0;
  const favoriteIdsQuery = useFavoriteIds({ authenticated: commerceAuthenticated });
  const toggleFavorite = useToggleFavorite({ authenticated: commerceAuthenticated });
  const addCartItem = useAddCartItem();
  const isFavorite = validProductId && favoriteIdsQuery.data?.includes(productId);
  const canAdd = saleReady && validProductId && variant?.id && variant.stockQuantity !== 0;

  function addToCart() {
    if (!canAdd || addCartItem.isPending) return;
    addCartItem.mutate(
      {
        productId,
        variantId: Number(variant.id),
        quantity: 1,
        optimisticItem: {
          productId,
          variantId: Number(variant.id),
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || null,
          quantity: 1,
          selected: true,
          available: true,
          stockQuantity: Number(variant.stockQuantity) || 10,
          unitPrice: Number(variant.price ?? product.priceAmount) || 0,
          warnings: [],
        },
      },
      { onSuccess: () => announceCartItemAdded({ productId, name: product.name }) },
    );
  }

  function toggle() {
    if (!validProductId || toggleFavorite.isPending) return;
    toggleFavorite.mutate({ productId, isFavorite: Boolean(isFavorite), product });
  }

  const addLabel = !saleReady
    ? (tr ? 'Satışa hazırlanıyor' : 'Preparing for sale')
    : variant?.stockQuantity === 0
        ? (tr ? 'Stokta yok' : 'Out of stock')
        : (tr ? 'Sepete ekle' : 'Add to cart');

  return (
    <div className="mt-7 grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
      {variants.length > 1 ? (
        <div className="col-span-2 mb-2">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">{tr ? 'Çerçeve seçeneği' : 'Frame option'}</label>
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger className="min-h-12 rounded-none border-black/15 bg-white px-4 focus-visible:ring-0">
              <SelectValue placeholder={tr ? 'Seçenek belirle' : 'Choose an option'} />
            </SelectTrigger>
            <SelectContent>
              {variants.map((item) => {
                const details = [item.colorCode || item.colorName, item.frameSize || item.size, item.sku].filter(Boolean).join(' · ');
                const label = details || `${tr ? 'Seçenek' : 'Option'} ${item.id}`;
                const optionLabel = `${label}${item.stockQuantity === 0 ? ` · ${tr ? 'Stokta yok' : 'Out of stock'}` : ''}`;
                return <SelectItem key={item.id} value={String(item.id)} disabled={item.stockQuantity === 0}>{optionLabel}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <button
        type="button"
        disabled={!canAdd || addCartItem.isPending}
        onClick={addToCart}
        className="inline-flex h-12 items-center justify-center gap-2 bg-[#172536] px-6 text-sm font-medium text-white transition-colors hover:bg-[#24364a] disabled:cursor-not-allowed disabled:bg-[#dfe2e4] disabled:text-[#70767b]"
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        {addCartItem.isPending ? (tr ? 'Ekleniyor…' : 'Adding…') : addLabel}
      </button>
      <button
        type="button"
        disabled={!validProductId || favoriteIdsQuery.isPending || toggleFavorite.isPending}
        onClick={toggle}
        aria-pressed={Boolean(isFavorite)}
        aria-label={isFavorite ? (tr ? 'Favorilerden çıkar' : 'Remove from favorites') : (tr ? 'Favorilere ekle' : 'Add to favorites')}
        className={cn('grid size-12 place-items-center border border-black/15 bg-white text-[#172536] transition-colors hover:border-[#172536] disabled:cursor-not-allowed disabled:opacity-45', isFavorite && 'border-[#172536] bg-[#172536] text-white')}
      >
        <Heart className={cn('size-4', isFavorite && 'fill-current')} strokeWidth={1.45} />
      </button>
      <p className="col-span-2 min-h-5 text-xs text-danger" role="status" aria-live="polite">
        {addCartItem.isError || toggleFavorite.isError ? (tr ? 'İşlem tamamlanamadı. Lütfen tekrar dene.' : 'The action could not be completed. Please try again.') : ''}
      </p>
    </div>
  );
}
