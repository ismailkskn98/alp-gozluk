'use client';

import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  useAddCartItem,
  useCart,
  useFavoriteIds,
  useRemoveCartItem,
  useToggleFavorite,
  useUpdateCartItem,
} from '@/features/commerce';
import { announceCartItemAdded } from '@/components/site/commerce/events';
import QuantityControl from '@/components/site/commerce/quantity-control';
import { cn } from '@/lib/utils';

function activeVariants(product) {
  const variants = product.activeVariants || product.variants || [];
  return variants.filter((variant) => !variant.status || variant.status === 'active');
}

export default function ProductCardActions({ product, authenticated = false, locale }) {
  const commerceAuthenticated = authenticated && !product.isDemoProduct;
  const favoriteIdsQuery = useFavoriteIds({ authenticated: commerceAuthenticated });
  const toggleFavorite = useToggleFavorite({ authenticated: commerceAuthenticated });
  const cartQuery = useCart();
  const addCartItem = useAddCartItem();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const variants = activeVariants(product);
  const defaultVariantId = product.defaultVariantId || (variants.length === 1 ? variants[0]?.id : null);
  const productId = Number(product.id);
  const hasProductId = Number.isInteger(productId) && productId > 0;
  const isFavorite = hasProductId && favoriteIdsQuery.data?.includes(productId);
  const isInStock = product.isInStock === undefined ? Number(product.stockQuantity) > 0 : Boolean(product.isInStock);
  const canAddDirectly = isInStock && hasProductId && Number(product.activeVariantCount ?? variants.length) === 1 && defaultVariantId;
  const cartItems = cartQuery.data?.items || cartQuery.data?.cart?.items || [];
  const cartItem = canAddDirectly
    ? cartItems.find((item) => Number(item.variantId) === Number(defaultVariantId))
    : null;
  const cartItemPending = Boolean(cartItem?.pending || updateCartItem.isPending || removeCartItem.isPending);
  const maxQuantity = Math.max(1, Math.min(
    Number(cartItem?.stockQuantity) || Number(product.stockQuantity) || Number(product.maxPerOrder) || 10,
    Number(product.maxPerOrder) || 10,
  ));
  const tr = locale === 'tr';

  function handleFavorite() {
    if (!hasProductId || toggleFavorite.isPending) return;
    toggleFavorite.mutate({ productId, isFavorite: Boolean(isFavorite), product });
  }

  function handleQuantityChange(quantity) {
    if (!cartItem || cartItemPending) return;
    if (quantity <= 0) {
      removeCartItem.mutate(cartItem.id);
      return;
    }
    updateCartItem.mutate({ itemId: cartItem.id, quantity });
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
          stockQuantity: Number(product.stockQuantity),
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
        {!isInStock ? (
          <div className="flex h-11 w-full items-center justify-center bg-[#e5e7e8] px-4 text-sm font-medium text-[#6d7377]">
            {tr ? 'Tükendi' : 'Sold out'}
          </div>
        ) : cartItem ? (
          <div className="bg-white">
            <QuantityControl
              value={Number(cartItem.quantity) || 1}
              min={1}
              max={maxQuantity}
              removeAtMinimum
              disabled={cartItemPending}
              onValueChange={handleQuantityChange}
              quantityLabel={tr ? `${product.name} sepet adedi` : `${product.name} cart quantity`}
              decreaseLabel={Number(cartItem.quantity) === 1 ? (tr ? 'Sepetten kaldır' : 'Remove from cart') : (tr ? 'Adedi azalt' : 'Decrease quantity')}
              increaseLabel={tr ? 'Adedi artır' : 'Increase quantity'}
            />
          </div>
        ) : canAddDirectly ? (
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
        {toggleFavorite.isError || addCartItem.isError || updateCartItem.isError || removeCartItem.isError ? (tr ? 'İşlem tamamlanamadı. Lütfen tekrar dene.' : 'The action could not be completed. Please try again.') : ''}
      </span>
    </>
  );
}
