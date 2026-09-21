import { ChevronDown, LockKeyhole, PartyPopper, Tag } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function OrderSummary({ totals, labels, formatCurrency, couponCode, couponMessage, onCouponChange, onCouponSubmit }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="border border-border bg-[#f7f7f4] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <PartyPopper className="size-4 text-success" />
          <span>{labels.freeShippingReached}</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden bg-border" aria-hidden="true">
          <div className="h-full w-full bg-success" />
        </div>

        <dl className="mt-6 space-y-3 border-y border-border py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{labels.subtotal}</dt>
            <dd>{formatCurrency(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{labels.discount}</dt>
            <dd>{totals.discount ? `-${formatCurrency(totals.discount)}` : formatCurrency(0)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{labels.shipping}</dt>
            <dd>{labels.free}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-4 py-5 font-semibold">
          <span>{labels.total}</span>
          <span className="text-lg">{formatCurrency(totals.total)}</span>
        </div>

        <Link href="/checkout" className="flex h-12 w-full items-center justify-center bg-foreground px-5 text-sm font-semibold text-white transition-colors hover:bg-primary">
          {labels.confirmCart}
        </Link>
        <Link href="/shop" className="mt-2 flex h-12 w-full items-center justify-center border border-border bg-white px-5 text-sm font-medium hover:border-foreground">
          {labels.continueShopping}
        </Link>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" />
          {labels.secureCheckout}
        </p>
      </div>

      <details className="group mt-3 border border-border bg-[#f7f7f4]">
        <summary className="flex min-h-14 list-none items-center justify-between gap-4 px-5 text-sm font-medium marker:content-none">
          <span className="flex items-center gap-2"><Tag className="size-4" />{labels.promoTitle}</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <form className="border-t border-border p-4" onSubmit={onCouponSubmit} noValidate>
          <label htmlFor="coupon-code" className="sr-only">{labels.promoLabel}</label>
          <div className="flex">
            <input
              id="coupon-code"
              value={couponCode}
              onChange={(event) => onCouponChange(event.target.value)}
              className="h-11 min-w-0 flex-1 border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              placeholder={labels.promoPlaceholder}
              autoComplete="off"
            />
            <button type="submit" className="h-11 bg-foreground px-4 text-sm font-medium text-white hover:bg-primary">{labels.apply}</button>
          </div>
          {couponMessage ? <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">{couponMessage}</p> : null}
        </form>
      </details>
    </aside>
  );
}
