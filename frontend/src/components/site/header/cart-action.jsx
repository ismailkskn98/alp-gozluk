'use client';

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet';
import { Link } from '@/i18n/navigation';
import { useCart, useCartSummary } from '@/features/commerce';
import { CART_ITEM_ADDED_EVENT } from '@/components/site/commerce/events';
import { siteButtonVariants } from '@/components/site/ui/button';
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
  const items = useMemo(() => getItems(cartQuery.data).slice(0, 3), [cartQuery.data]);
  const itemCount = getCount(cartQuery.data, summaryQuery.data);
  const tr = locale === 'tr';

  useEffect(() => {
    const handleAdded = () => setOpen(true);
    window.addEventListener(CART_ITEM_ADDED_EVENT, handleAdded);
    return () => window.removeEventListener(CART_ITEM_ADDED_EVENT, handleAdded);
  }, []);

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
        <SheetContent side="right" closeLabel={tr ? 'Sepeti kapat' : 'Close cart'} className="w-full gap-0 border-l border-border bg-white shadow-none sm:w-[min(28rem,100vw)]">
          <SheetHeader className="border-b border-border px-5 pb-5 pt-14 sm:px-7 sm:pt-16">
            <SheetTitle className="text-2xl font-normal tracking-[-0.03em]">{tr ? 'Sepetin' : 'Your cart'}</SheetTitle>
            <SheetDescription>{itemCount ? (tr ? `${itemCount} ürün sepetinde.` : `${itemCount} items in your cart.`) : (tr ? 'Sepetin şu anda boş.' : 'Your cart is currently empty.')}</SheetDescription>
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
                  const image = itemImage(item);
                  return (
                    <li key={item.id || item.cartItemId} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-4 first:pt-0">
                      <div className="relative aspect-[4/3] overflow-hidden bg-white">
                        {image ? <Image src={image} alt={item.image?.altText || ''} fill sizes="80px" className="object-contain" /> : null}
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="truncate text-sm font-medium">{itemName(item)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tr ? 'Adet' : 'Qty'}: {item.quantity}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="border-t border-border p-5 sm:p-7">
            <Link href="/cart" onClick={() => setOpen(false)} className={cn(siteButtonVariants({ size: 'wide' }))}>
              {tr ? 'Sepete git' : 'View cart'}
            </Link>
            <Link href="/shop" onClick={() => setOpen(false)} className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'mt-2')}>
              {tr ? 'Alışverişe devam et' : 'Continue shopping'}
            </Link>
          </div>
          <span className="sr-only" aria-live="polite">{itemCount ? (tr ? `Sepette ${itemCount} ürün var.` : `${itemCount} items in cart.`) : ''}</span>
        </SheetContent>
      </Sheet>
    </>
  );
}
