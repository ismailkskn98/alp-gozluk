'use client';

import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  useAddCartItem,
  useCart,
  useFavoriteIds,
  useRemoveCartItem,
  useToggleFavorite,
  useUpdateCartItem,
} from '@/features/commerce';
import { announceCartItemAdded } from '@/components/site/commerce/events';
import {
  AdaptiveStepper,
  AdaptiveStepperDecrement,
  AdaptiveStepperIncrement,
  AdaptiveStepperValue,
} from '@/components/motion/adaptive-stepper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/motion/select';
import { cn } from '@/lib/utils';

function activeVariants(product) {
  return (product.activeVariants || product.variants || []).filter((variant) => !variant.status || variant.status === 'active');
}

function getVariantGroups(variants) {
  const groups = new Map();
  for (const variant of variants) {
    for (const attribute of variant.attributes || []) {
      const group = groups.get(attribute.groupCode) || {
        code: attribute.groupCode,
        name: attribute.groupName,
        values: new Map(),
      };
      group.values.set(attribute.valueId, {
        id: attribute.valueId,
        code: attribute.code,
        name: attribute.name,
        swatchValue: attribute.swatchValue,
      });
      groups.set(attribute.groupCode, group);
    }
  }
  return [...groups.values()].map((group) => ({ ...group, values: [...group.values.values()] }));
}

function variantHasValue(variant, groupCode, valueId) {
  return (variant.attributes || []).some((attribute) => attribute.groupCode === groupCode && Number(attribute.valueId) === Number(valueId));
}

function selectedValueForGroup(variant, groupCode) {
  return (variant?.attributes || []).find((attribute) => attribute.groupCode === groupCode)?.valueId;
}

export default function ProductDetailActions({ product, authenticated = false, locale, saleReady }) {
  const tr = locale === 'tr';
  const productId = Number(product.id);
  const commerceAuthenticated = authenticated && !product.isDemoProduct;
  const variants = useMemo(() => activeVariants(product), [product]);
  const defaultVariant = variants.find((item) => Number(item.id) === Number(product.defaultVariantId))
    || variants.find((item) => Number(item.stockQuantity) > 0)
    || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(() => String(defaultVariant?.id || ''));
  const variant = variants.find((item) => String(item.id) === selectedVariantId) || defaultVariant;
  const variantGroups = useMemo(() => getVariantGroups(variants), [variants]);
  const validProductId = Number.isInteger(productId) && productId > 0;
  const favoriteIdsQuery = useFavoriteIds({ authenticated: commerceAuthenticated });
  const toggleFavorite = useToggleFavorite({ authenticated: commerceAuthenticated });
  const cartQuery = useCart();
  const addCartItem = useAddCartItem();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const cartItems = cartQuery.data?.items || cartQuery.data?.cart?.items || [];
  const cartItem = cartItems.find((item) => Number(item.variantId) === Number(variant?.id));
  const isFavorite = validProductId && favoriteIdsQuery.data?.includes(productId);
  const canAdd = saleReady && validProductId && variant?.id && Number(variant.stockQuantity) > 0;
  const cartItemPending = Boolean(cartItem?.pending || updateCartItem.isPending || removeCartItem.isPending);
  const maxQuantity = Math.max(1, Math.min(Number(cartItem?.stockQuantity || variant?.stockQuantity) || 10, Number(product.maxPerOrder) || 10));

  function selectAttribute(groupCode, valueId) {
    const preferredSelections = new Map(
      (variant?.attributes || []).map((attribute) => [attribute.groupCode, attribute.valueId]),
    );
    preferredSelections.set(groupCode, valueId);
    const exactMatch = variants.find((candidate) => (
      Number(candidate.stockQuantity) > 0
      && [...preferredSelections].every(([code, selectedValue]) => variantHasValue(candidate, code, selectedValue))
    ));
    const bestAvailableMatch = variants
      .filter((candidate) => variantHasValue(candidate, groupCode, valueId))
      .sort((left, right) => {
        const stockDifference = Number(right.stockQuantity > 0) - Number(left.stockQuantity > 0);
        if (stockDifference) return stockDifference;
        const score = (candidate) => [...preferredSelections].filter(([code, selectedValue]) => variantHasValue(candidate, code, selectedValue)).length;
        return score(right) - score(left);
      })[0];
    const nextVariant = exactMatch || bestAvailableMatch;
    if (nextVariant) setSelectedVariantId(String(nextVariant.id));
  }

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
          sku: variant.sku,
          colorCode: variant.colorCode,
          frameSize: variant.frameSize,
          lensType: variant.lensType,
          image: product.images?.[0] || null,
          quantity: 1,
          selected: true,
          available: true,
          stockQuantity: Number(variant.stockQuantity),
          unitPrice: Number(variant.price ?? product.priceAmount) || 0,
          warnings: [],
        },
      },
      { onSuccess: () => announceCartItemAdded({ productId, name: product.name }) },
    );
  }

  function changeQuantity(quantity) {
    if (!cartItem || cartItemPending) return;
    if (quantity <= 0) removeCartItem.mutate(cartItem.id);
    else updateCartItem.mutate({ itemId: cartItem.id, quantity });
  }

  function toggle() {
    if (!validProductId || toggleFavorite.isPending) return;
    toggleFavorite.mutate({ productId, isFavorite: Boolean(isFavorite), product });
  }

  const addLabel = !saleReady
    ? (tr ? 'Satışa hazırlanıyor' : 'Preparing for sale')
    : Number(variant?.stockQuantity) === 0
        ? (tr ? 'Stokta yok' : 'Out of stock')
        : (tr ? 'Sepete ekle' : 'Add to cart');

  return (
    <div className="mt-7 grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
      {variantGroups.length ? (
        <div className="col-span-2 mb-3 space-y-5 border-y border-black/10 py-5">
          {variantGroups.map((group) => (
            <fieldset key={group.code}>
              <legend className="flex w-full items-center justify-between gap-3 text-xs font-medium">
                <span>{group.name}</span>
                <span className="font-normal text-muted-foreground">
                  {group.values.find((value) => Number(value.id) === Number(selectedValueForGroup(variant, group.code)))?.name}
                </span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const selected = Number(selectedValueForGroup(variant, group.code)) === Number(value.id);
                  const available = variants.some((candidate) => Number(candidate.stockQuantity) > 0 && variantHasValue(candidate, group.code, value.id));
                  return (
                    <button
                      key={value.id}
                      type="button"
                      aria-pressed={selected}
                      disabled={!available}
                      onClick={() => selectAttribute(group.code, value.id)}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-2.5 border bg-white px-3.5 text-sm transition-[border-color,background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172536]/25 disabled:cursor-not-allowed disabled:opacity-35',
                        selected ? 'border-[#172536] bg-[#f5f7f8]' : 'border-black/12 hover:border-black/35',
                      )}
                    >
                      {value.swatchValue ? <span className="size-5 rounded-full border border-black/12" style={{ backgroundColor: value.swatchValue }} aria-hidden="true" /> : null}
                      {value.name}
                      {!available ? <span className="text-[0.65rem]">{tr ? 'Stokta yok' : 'Out of stock'}</span> : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : variants.length > 1 ? (
        <div className="col-span-2 mb-2">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">{tr ? 'Çerçeve seçeneği' : 'Frame option'}</label>
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger className="min-h-12 rounded-none border-black/15 bg-white px-4 focus-visible:ring-0"><SelectValue placeholder={tr ? 'Seçenek belirle' : 'Choose an option'} /></SelectTrigger>
            <SelectContent>
              {variants.map((item) => {
                const details = [item.colorCode, item.frameSize, item.sku].filter(Boolean).join(' · ');
                const label = details || `${tr ? 'Seçenek' : 'Option'} ${item.id}`;
                return <SelectItem key={item.id} value={String(item.id)} disabled={Number(item.stockQuantity) === 0}>{label}{Number(item.stockQuantity) === 0 ? ` · ${tr ? 'Stokta yok' : 'Out of stock'}` : ''}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {cartItem && canAdd ? (
        <div className="flex h-12 items-center justify-center bg-[#172536] px-3">
          <AdaptiveStepper value={Number(cartItem.quantity) || 1} min={0} max={maxQuantity} disabled={cartItemPending} onValueChange={changeQuantity} aria-label={tr ? 'Sepet adedi' : 'Cart quantity'}>
            <AdaptiveStepperDecrement aria-label={tr ? 'Adedi azalt' : 'Decrease quantity'}>{Number(cartItem.quantity) === 1 ? <Trash2 className="size-4" /> : undefined}</AdaptiveStepperDecrement>
            <AdaptiveStepperValue className="text-base" />
            <AdaptiveStepperIncrement aria-label={tr ? 'Adedi artır' : 'Increase quantity'} />
          </AdaptiveStepper>
        </div>
      ) : (
        <button type="button" disabled={!canAdd || addCartItem.isPending} onClick={addToCart} className="inline-flex h-12 items-center justify-center gap-2 bg-[#172536] px-6 text-sm font-medium text-white transition-colors hover:bg-[#24364a] disabled:cursor-not-allowed disabled:bg-[#dfe2e4] disabled:text-[#70767b]">
          <ShoppingBag className="size-4" aria-hidden="true" />
          {addCartItem.isPending ? (tr ? 'Ekleniyor…' : 'Adding…') : addLabel}
        </button>
      )}
      <button type="button" disabled={!validProductId || favoriteIdsQuery.isPending || toggleFavorite.isPending} onClick={toggle} aria-pressed={Boolean(isFavorite)} aria-label={isFavorite ? (tr ? 'Favorilerden çıkar' : 'Remove from favorites') : (tr ? 'Favorilere ekle' : 'Add to favorites')} className={cn('grid size-12 place-items-center border border-black/15 bg-white text-[#172536] transition-colors hover:border-[#172536] disabled:cursor-not-allowed disabled:opacity-45', isFavorite && 'border-[#172536] bg-[#172536] text-white')}>
        <Heart className={cn('size-4', isFavorite && 'fill-current')} strokeWidth={1.45} />
      </button>
      <p className={cn('col-span-2 min-h-5 text-xs', variant?.stockStatus === 'low_stock' ? 'text-[#9a5b00]' : 'text-danger')} role="status" aria-live="polite">
        {variant?.stockStatus === 'low_stock'
          ? (tr ? `Son ${variant.stockQuantity} adet` : `Only ${variant.stockQuantity} left`)
          : addCartItem.isError || toggleFavorite.isError || updateCartItem.isError || removeCartItem.isError
            ? (tr ? 'İşlem tamamlanamadı. Lütfen tekrar dene.' : 'The action could not be completed. Please try again.')
            : ''}
      </p>
    </div>
  );
}
