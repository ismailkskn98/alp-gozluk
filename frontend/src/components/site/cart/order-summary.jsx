import { ChevronDown, LockKeyhole, PartyPopper, Tag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SiteButton, siteButtonVariants } from '@/components/site/ui/button';
import { SiteInput } from '@/components/site/ui/input';
import { cn } from '@/lib/utils';

export default function OrderSummary({ totals, labels, formatCurrency, couponCode, couponMessage, onCouponChange, onCouponSubmit, canCheckout }) {
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

        <Link
          href="/checkout"
          aria-disabled={!canCheckout}
          tabIndex={canCheckout ? undefined : -1}
          onClick={(event) => !canCheckout && event.preventDefault()}
          className={cn(siteButtonVariants({ size: 'wide' }), !canCheckout && 'pointer-events-none opacity-45')}
        >
          {labels.confirmCart}
        </Link>
        <Link href="/shop" className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'mt-2')}>
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
            <SiteInput
              id="coupon-code"
              value={couponCode}
              onChange={(event) => onCouponChange(event.target.value)}
              className="min-w-0 flex-1 rounded-r-none"
              placeholder={labels.promoPlaceholder}
              autoComplete="off"
            />
            <SiteButton type="submit" className="rounded-l-none px-4">{labels.apply}</SiteButton>
          </div>
          {couponMessage ? <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">{couponMessage}</p> : null}
        </form>
      </details>
    </aside>
  );
}
