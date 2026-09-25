'use client';

import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAddCartItem, useFavoriteIds, useToggleFavorite } from '@/features/commerce';
import { announceCartItemAdded } from '@/components/site/commerce/events';
import { cn } from '@/lib/utils';

function activeVariants(product) {
  const variants = product.activeVariants || product.variants || [];
  return variants.filter((variant) => !variant.status || variant.status === 'active');
}

export default function ProductCardActions({ product, authenticated = false, locale }) {
  const commerceAuthenticated = authenticated && !product.isDemoProduct;
  const favoriteIdsQuery = useFavoriteIds({ authenticated: commerceAuthenticated });
  const toggleFavorite = useToggleFavorite({ authenticated: commerceAuthenticated });
  const addCartItem = useAddCartItem();
  const variants = activeVariants(product);
  const defaultVariantId = product.defaultVariantId || (variants.length === 1 ? variants[0]?.id : null);
  const productId = Number(product.id);
  const hasProductId = Number.isInteger(productId) && productId > 0;
  const isFavorite = hasProductId && favoriteIdsQuery.data?.includes(productId);
  const canAddDirectly = hasProductId && Number(product.activeVariantCount ?? variants.length) === 1 && defaultVariantId;
  const tr = locale === 'tr';

  function handleFavorite() {
    if (!hasProductId || toggleFavorite.isPending) return;
    toggleFavorite.mutate({ productId, isFavorite: Boolean(isFavorite), product });
  }

  function handleAdd() {
    if (!canAddDirectly || addCartItem.isPending) return;
    addCartItem.mutate(
      {
        productId,
        variantId: Number(defaultVariantId),
        quantity: 1,
        optimisticItem: {
          productId,
          variantId: Number(defaultVariantId),
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || null,
          quantity: 1,
          selected: true,
          available: true,
          stockQuantity: Number(product.maxPerOrder) || 10,
          unitPrice: Number(product.priceAmount) || 0,
          warnings: [],
        },
      },
      { onSuccess: () => announceCartItemAdded({ productId, name: product.name }) },
    );
  }

  if (!hasProductId) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleFavorite}
        disabled={favoriteIdsQuery.isPending || toggleFavorite.isPending}
        aria-label={isFavorite ? (tr ? `${product.name} favorilerden çıkar` : `Remove ${product.name} from favorites`) : (tr ? `${product.name} favorilere ekle` : `Add ${product.name} to favorites`)}
        aria-pressed={Boolean(isFavorite)}
        className={cn(
          'absolute right-3 top-3 z-30 grid size-9 place-items-center rounded-full border border-black/10 bg-white/95 text-[#172536] shadow-sm transition-colors hover:border-[#172536] disabled:cursor-wait disabled:opacity-55',
          isFavorite && 'border-[#172536] bg-[#172536] text-white hover:bg-[#172536]',
        )}
      >
        <Heart className={cn('size-4', isFavorite && 'fill-current')} strokeWidth={1.45} />
      </button>
      <div className="absolute inset-x-3 bottom-7 z-30 opacity-100 transition-opacity duration-300 ease-in-out motion-reduce:transition-none md:pointer-events-none md:opacity-0 md:group-hover/card:pointer-events-auto md:group-hover/card:opacity-100 md:group-focus-within/card:pointer-events-auto md:group-focus-within/card:opacity-100">
        {canAddDirectly ? (
          <button
            type="button"
            onClick={handleAdd}
            disabled={addCartItem.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 bg-[#172536] px-4 text-sm font-medium text-white transition-colors hover:bg-[#24364a] disabled:cursor-wait disabled:opacity-60"
          >
            <ShoppingBag className="size-4" strokeWidth={1.45} />
            {addCartItem.isPending ? (tr ? 'Ekleniyor…' : 'Adding…') : (tr ? 'Sepete ekle' : 'Add to cart')}
          </button>
        ) : (
          <Link
            href={`/product/${product.slug}`}
            className="flex h-11 w-full items-center justify-center gap-2 bg-[#172536] px-4 text-sm font-medium text-white transition-colors hover:bg-[#24364a]"
          >
            <ShoppingBag className="size-4" strokeWidth={1.45} />
            {tr ? 'Seçenekleri gör' : 'View options'}
          </Link>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {toggleFavorite.isError || addCartItem.isError ? (tr ? 'İşlem tamamlanamadı. Lütfen tekrar dene.' : 'The action could not be completed. Please try again.') : ''}
      </span>
    </>
  );
}
