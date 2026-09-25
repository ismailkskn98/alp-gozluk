'use client';

import Image from 'next/image';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet';
import { Link } from '@/i18n/navigation';
import {
  useCart,
  useCartSummary,
  useRemoveCartItem,
  useUpdateCartItem,
  useUpdateCartSelection,
} from '@/features/commerce';
import { CART_ITEM_ADDED_EVENT } from '@/components/site/commerce/events';
import QuantityControl from '@/components/site/commerce/quantity-control';
import { SiteCheckbox } from '@/components/site/ui/checkbox';
import { siteButtonVariants } from '@/components/site/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { cn } from '@/lib/utils';

function getCart(value) {
  return value?.cart || value?.data?.cart || value || {};
}

function getItems(value) {
  const cart = getCart(value);
  return Array.isArray(cart.items) ? cart.items : [];
}

function getCount(cartValue, summaryValue) {
  const summary = summaryValue?.summary || summaryValue?.data?.summary || summaryValue || {};
  const cart = getCart(cartValue);
  const declared = summary.totalItemCount ?? summary.itemCount ?? cart.totalItemCount ?? cart.itemCount;
  if (Number.isFinite(Number(declared))) return Number(declared);
  return getItems(cartValue).reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function getSummary(cartValue, summaryValue) {
  const remoteSummary = summaryValue?.summary || summaryValue?.data?.summary || summaryValue;
  const cart = getCart(cartValue);
  return remoteSummary && typeof remoteSummary === 'object' ? remoteSummary : cart.summary || {};
}

function itemImage(item) {
  return item.image?.url || item.imageUrl || item.image || item.product?.imageUrl || item.product?.images?.[0]?.url || item.product?.images?.[0] || '';
}

function itemName(item) {
  return item.name || item.productName || item.product?.name || '';
}

export default function CartAction({ locale, label }) {
  const [open, setOpen] = useState(false);
  const cartQuery = useCart();
  const summaryQuery = useCartSummary();
  const updateItem = useUpdateCartItem();
  const updateSelection = useUpdateCartSelection();
  const removeItem = useRemoveCartItem();
  const items = useMemo(() => getItems(cartQuery.data), [cartQuery.data]);
  const itemCount = getCount(cartQuery.data, summaryQuery.data);
  const summary = getSummary(cartQuery.data, summaryQuery.data);
  const selectedItemCount = items
    .filter((item) => (item.selected ?? item.isSelected ?? true) && item.available !== false)
    .reduce((total, item) => total + Number(item.quantity || 0), 0);
  const tr = locale === 'tr';
  const formatMoney = useMemo(() => new Intl.NumberFormat(tr ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: summary.currency || 'TRY',
    maximumFractionDigits: 0,
  }), [summary.currency, tr]);

  useEffect(() => {
    const handleAdded = () => setOpen(true);
    window.addEventListener(CART_ITEM_ADDED_EVENT, handleAdded);
    return () => window.removeEventListener(CART_ITEM_ADDED_EVENT, handleAdded);
  }, []);

  function changeSelection(item, checked) {
    if (item.pending || item.available === false) return;
    updateSelection.mutate({ itemIds: [item.id || item.cartItemId], selected: checked });
  }

  function changeQuantity(item, quantity) {
    if (item.pending || quantity < 1) return;
    updateItem.mutate({ itemId: item.id || item.cartItemId, quantity });
  }

  function remove(item) {
    if (!item.pending) removeItem.mutate(item.id || item.cartItemId);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}${itemCount ? ` (${itemCount})` : ''}`}
        className="relative grid size-11 place-items-center hover:bg-[#f4f5f6]"
      >
        <ShoppingBag className="size-4" strokeWidth={1.5} />
        {itemCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-[#172536] px-1 text-[0.58rem] leading-4 text-white tabular-nums">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" closeLabel={tr ? 'Sepeti kapat' : 'Close cart'} className="w-full gap-0 border-l border-border bg-white shadow-none sm:w-[min(30rem,100vw)]">
          <SheetHeader className="border-b border-border px-5 pb-5 pt-14 sm:px-7 sm:pt-16">
            <SheetTitle className="text-2xl font-normal tracking-[-0.03em]">{tr ? 'Sepetin' : 'Your cart'}</SheetTitle>
            <SheetDescription>{itemCount ? (tr ? `${itemCount} ürün sepetinde, ${selectedItemCount} ürün hesaba dahil.` : `${itemCount} items in your cart, ${selectedItemCount} included.`) : (tr ? 'Sepetin şu anda boş.' : 'Your cart is currently empty.')}</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {cartQuery.isPending ? <p className="text-sm text-muted-foreground" role="status">{tr ? 'Sepet yükleniyor…' : 'Loading cart…'}</p> : null}
            {cartQuery.isError ? (
              <div role="alert" className="border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
                {tr ? 'Sepet şu anda yüklenemedi. Tekrar deneyebilirsin.' : 'Your cart could not be loaded. Please try again.'}
              </div>
            ) : null}
            {!cartQuery.isPending && !cartQuery.isError && items.length === 0 ? (
              <div className="grid min-h-56 place-items-center border-y border-border text-center">
                <div>
                  <ShoppingBag className="mx-auto size-6" strokeWidth={1.25} />
                  <p className="mt-4 text-sm text-muted-foreground">{tr ? 'Beğendiğin çerçeveleri buraya ekleyebilirsin.' : 'Add the frames you love here.'}</p>
                </div>
              </div>
            ) : null}
            {items.length ? (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const id = item.id || item.cartItemId;
                  const image = itemImage(item);
                  const selected = item.selected ?? item.isSelected ?? true;
                  const available = item.available !== false;
                  const pending = Boolean(item.pending || updateItem.isPending || updateSelection.isPending || removeItem.isPending);
                  const maxQuantity = Math.max(1, Math.min(Number(item.stockQuantity) || 10, 10));
                  return (
                    <li key={id} className={cn('grid grid-cols-[1.125rem_4.5rem_minmax(0,1fr)] gap-3 py-4 first:pt-0', !selected && 'opacity-60')}>
                      <SiteCheckbox
                        checked={selected}
                        disabled={pending || !available}
                        onCheckedChange={(checked) => changeSelection(item, checked)}
                        aria-label={tr ? `${itemName(item)} ürününü hesaba ${selected ? 'dahil etme' : 'dahil et'}` : `${selected ? 'Exclude' : 'Include'} ${itemName(item)}`}
                        className="min-h-0 self-center"
                      />
                      <Link href={item.slug ? `/product/${item.slug}` : '/cart'} onClick={() => setOpen(false)} className="relative aspect-[4/3] self-start overflow-hidden bg-white">
                        {image ? <Image src={image} alt={item.image?.altText || itemName(item)} fill sizes="72px" className="object-contain" /> : null}
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={item.slug ? `/product/${item.slug}` : '/cart'} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium leading-5 hover:text-[#36516b]">{itemName(item)}</Link>
                            {[item.colorCode, item.frameSize, item.lensType].filter(Boolean).length ? (
                              <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">{[item.colorCode, item.frameSize, item.lensType].filter(Boolean).join(' · ')}</p>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs font-medium tabular-nums">{formatMoney.format((Number(item.unitPrice) || 0) * Number(item.quantity || 0))}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <QuantityControl
                            value={Number(item.quantity) || 1}
                            min={1}
                            max={maxQuantity}
                            disabled={pending || !available}
                            onValueChange={(quantity) => changeQuantity(item, quantity)}
                            quantityLabel={tr ? `${itemName(item)} adedi` : `${itemName(item)} quantity`}
                            decreaseLabel={tr ? 'Adedi azalt' : 'Decrease quantity'}
                            increaseLabel={tr ? 'Adedi artır' : 'Increase quantity'}
                            className="h-9 max-w-32"
                            buttonClassName="w-9"
                            valueClassName="min-w-8 px-1 text-xs"
                          />
                          <DeleteButton
                            className={cn('h-12 origin-left scale-75', pending && 'pointer-events-none opacity-45')}
                            onConfirm={() => remove(item)}
                            deleteLabel={tr ? `${itemName(item)} ürününü sepetten kaldır` : `Remove ${itemName(item)} from cart`}
                            confirmLabel={tr ? 'Kaldırmayı onayla' : 'Confirm removal'}
                            cancelLabel={tr ? 'Vazgeç' : 'Cancel'}
                            deletedStatus={tr ? 'Kaldırıldı' : 'Removed'}
                            keptStatus={tr ? 'Sepette tutuldu' : 'Kept in cart'}
                          />
                        </div>
                        {!available ? <p className="mt-2 flex items-center gap-1 text-[0.68rem] text-danger"><AlertTriangle className="size-3" />{tr ? 'Bu varyant şu anda stokta yok ve toplama dahil değil.' : 'This variant is out of stock and excluded from the total.'}</p> : null}
                        {!selected && available ? <p className="mt-2 text-[0.68rem] text-muted-foreground">{tr ? 'Toplama ve ödeme adımına dahil değil.' : 'Excluded from total and checkout.'}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="border-t border-border p-5 sm:p-7">
            {itemCount > 0 ? (
              <dl className="mb-5 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4 text-muted-foreground"><dt>{tr ? 'Ara toplam' : 'Subtotal'}</dt><dd className="tabular-nums">{formatMoney.format(Number(summary.subtotalAmount) || 0)}</dd></div>
                {Number(summary.discountAmount) > 0 ? <div className="flex items-center justify-between gap-4 text-success"><dt>{tr ? 'İndirim' : 'Discount'}</dt><dd className="tabular-nums">-{formatMoney.format(Number(summary.discountAmount))}</dd></div> : null}
                <div className="flex items-center justify-between gap-4 text-muted-foreground"><dt>{tr ? 'Kargo' : 'Shipping'}</dt><dd className="tabular-nums">{Number(summary.shippingAmount) === 0 ? (tr ? 'Ücretsiz' : 'Free') : formatMoney.format(Number(summary.shippingAmount))}</dd></div>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-base font-medium text-[#172536]"><dt>{tr ? 'Toplam' : 'Total'}</dt><dd className="tabular-nums">{formatMoney.format(Number(summary.totalAmount) || 0)}</dd></div>
              </dl>
            ) : null}
            <Link href="/cart" onClick={() => setOpen(false)} className={cn(siteButtonVariants({ size: 'wide' }))}>{tr ? 'Sepete git' : 'View cart'}</Link>
            <Link href="/shop" onClick={() => setOpen(false)} className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'mt-2')}>{tr ? 'Alışverişe devam et' : 'Continue shopping'}</Link>
          </div>
          <span className="sr-only" aria-live="polite">{itemCount ? (tr ? `Sepette ${itemCount} ürün var.` : `${itemCount} items in cart.`) : ''}</span>
        </SheetContent>
      </Sheet>
    </>
  );
}
