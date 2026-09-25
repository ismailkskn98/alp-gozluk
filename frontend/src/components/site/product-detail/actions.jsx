'use client';

import { Heart, ShoppingBag } from 'lucide-react';
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
import QuantityControl from '@/components/site/commerce/quantity-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/motion/select';
import { Tooltip } from '@/components/motion/tooltip';
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

  function isValueAvailable(groupCode, valueId) {
    return variants.some((candidate) => Number(candidate.stockQuantity) > 0 && variantHasValue(candidate, groupCode, valueId));
  }

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

  function toggleFavoriteItem() {
    if (!validProductId || toggleFavorite.isPending) return;
    toggleFavorite.mutate({ productId, isFavorite: Boolean(isFavorite), product });
  }

  const addLabel = !saleReady
    ? (tr ? 'Satışa hazırlanıyor' : 'Preparing for sale')
    : Number(variant?.stockQuantity) === 0
      ? (tr ? 'Stokta yok' : 'Out of stock')
      : (tr ? 'Sepete ekle' : 'Add to cart');

  return (
    <div className="mt-6">
      {variantGroups.length ? (
        <div className="space-y-4 border-y border-black/10 py-4">
          {variantGroups.map((group) => {
            const selectedValueId = selectedValueForGroup(variant, group.code);
            const selectedValue = group.values.find((value) => Number(value.id) === Number(selectedValueId));
            const colorGroup = ['frame_color', 'lens_color'].includes(group.code);
            const sizeGroup = group.code === 'frame_size';

            if (sizeGroup) {
              return (
                <div key={group.code} className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                  <label className="text-xs font-medium text-[#4f555a]">{group.name}</label>
                  <Select value={String(selectedValueId || '')} onValueChange={(value) => selectAttribute(group.code, Number(value))} radius={0}>
                    <SelectTrigger className="h-10 min-h-10 rounded-none border-black/15 bg-white px-3 text-xs focus-visible:ring-[#172536]/20">
                      <SelectValue placeholder={tr ? 'Ölçü seç' : 'Choose size'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {group.values.map((value) => {
                        const available = isValueAvailable(group.code, value.id);
                        return <SelectItem key={value.id} value={String(value.id)} disabled={!available} className="rounded-none text-xs">{value.name}{available ? '' : ` · ${tr ? 'Stokta yok' : 'Out of stock'}`}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            return (
              <fieldset key={group.code}>
                <legend className="flex w-full items-center gap-2 text-xs font-medium text-[#4f555a]">
                  <span>{group.name}</span>
                  <span className="font-normal text-muted-foreground">/ {selectedValue?.name}</span>
                </legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = Number(selectedValueId) === Number(value.id);
                    const available = isValueAvailable(group.code, value.id);
                    const option = (
                      <button
                        key={value.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={!available}
                        onClick={() => selectAttribute(group.code, value.id)}
                        className={cn(
                          'relative grid min-h-9 place-items-center border bg-white text-xs transition-[border-color,background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172536]/25 disabled:cursor-not-allowed disabled:opacity-30',
                          colorGroup ? 'size-9 p-1.5' : 'px-3',
                          selected ? 'border-[#172536] bg-[#f2f4f5]' : 'border-black/15 hover:border-black/40',
                        )}
                      >
                        {colorGroup
                          ? <span className="size-full border border-black/10" style={{ backgroundColor: value.swatchValue || '#d9dde0' }} aria-hidden="true" />
                          : value.name}
                        {!available ? <span className="absolute inset-0 m-auto h-px w-[120%] -rotate-45 bg-[#8d3d37]" aria-hidden="true" /> : null}
                      </button>
                    );
                    return colorGroup ? <Tooltip key={value.id} content={`${value.name}${available ? '' : ` · ${tr ? 'Stokta yok' : 'Out of stock'}`}`} side="top">{option}</Tooltip> : option;
                  })}
                </div>
              </fieldset>
            );
          })}
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-muted-foreground">
            <span>{tr ? 'Ürün kodu' : 'Product code'}: <strong className="font-medium text-foreground">{product.code}</strong></span>
            {variant?.sku ? <span>SKU: <strong className="font-medium text-foreground">{variant.sku}</strong></span> : null}
          </p>
        </div>
      ) : variants.length > 1 ? (
        <div className="border-y border-black/10 py-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">{tr ? 'Çerçeve seçeneği' : 'Frame option'}</label>
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId} radius={0}>
            <SelectTrigger className="min-h-11 rounded-none border-black/15 bg-white px-3 text-xs focus-visible:ring-[#172536]/20"><SelectValue placeholder={tr ? 'Seçenek belirle' : 'Choose an option'} /></SelectTrigger>
            <SelectContent className="rounded-none">
              {variants.map((item) => {
                const details = [item.colorCode, item.frameSize, item.sku].filter(Boolean).join(' · ');
                const label = details || `${tr ? 'Seçenek' : 'Option'} ${item.id}`;
                return <SelectItem key={item.id} value={String(item.id)} disabled={Number(item.stockQuantity) === 0} className="rounded-none text-xs">{label}{Number(item.stockQuantity) === 0 ? ` · ${tr ? 'Stokta yok' : 'Out of stock'}` : ''}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="border-y border-black/10 py-3 text-[0.68rem] text-muted-foreground">{tr ? 'Ürün kodu' : 'Product code'}: <strong className="font-medium text-foreground">{product.code}</strong>{variant?.sku ? ` · SKU: ${variant.sku}` : ''}</p>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
        {cartItem && canAdd ? (
          <QuantityControl
            value={Number(cartItem.quantity) || 1}
            min={1}
            max={maxQuantity}
            removeAtMinimum
            disabled={cartItemPending}
            onValueChange={changeQuantity}
            quantityLabel={tr ? 'Sepet adedi' : 'Cart quantity'}
            decreaseLabel={Number(cartItem.quantity) === 1 ? (tr ? 'Sepetten kaldır' : 'Remove from cart') : (tr ? 'Adedi azalt' : 'Decrease quantity')}
            increaseLabel={tr ? 'Adedi artır' : 'Increase quantity'}
            className="h-12"
          />
        ) : (
          <button type="button" disabled={!canAdd || addCartItem.isPending} onClick={addToCart} className="inline-flex h-12 items-center justify-center gap-2 bg-[#172536] px-6 text-sm font-medium text-white transition-colors hover:bg-[#24364a] disabled:cursor-not-allowed disabled:bg-[#dfe2e4] disabled:text-[#70767b]">
            <ShoppingBag className="size-4" aria-hidden="true" />
            {addCartItem.isPending ? (tr ? 'Ekleniyor…' : 'Adding…') : addLabel}
          </button>
        )}
        <button type="button" disabled={!validProductId || favoriteIdsQuery.isPending || toggleFavorite.isPending} onClick={toggleFavoriteItem} aria-pressed={Boolean(isFavorite)} aria-label={isFavorite ? (tr ? 'Favorilerden çıkar' : 'Remove from favorites') : (tr ? 'Favorilere ekle' : 'Add to favorites')} className={cn('grid size-12 place-items-center border border-black/15 bg-white text-[#172536] transition-colors hover:border-[#172536] disabled:cursor-not-allowed disabled:opacity-45', isFavorite && 'border-[#172536] bg-[#172536] text-white')}>
          <Heart className={cn('size-4', isFavorite && 'fill-current')} strokeWidth={1.45} />
        </button>
      </div>
      <p className={cn('mt-2 min-h-5 text-xs', variant?.stockStatus === 'low_stock' ? 'text-[#9a5b00]' : 'text-danger')} role="status" aria-live="polite">
        {variant?.stockStatus === 'low_stock'
          ? (tr ? `Tükenmek üzere · Son ${variant.stockQuantity} adet` : `Almost gone · Only ${variant.stockQuantity} left`)
          : addCartItem.isError || toggleFavorite.isError || updateCartItem.isError || removeCartItem.isError
            ? (tr ? 'İşlem tamamlanamadı. Lütfen tekrar dene.' : 'The action could not be completed. Please try again.')
            : ''}
      </p>
    </div>
  );
}
