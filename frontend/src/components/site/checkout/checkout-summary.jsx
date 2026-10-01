import Image from 'next/image';
import { ChevronDown, Clock3, LockKeyhole, ShoppingBag } from 'lucide-react';
import { SiteButton } from '@/components/site/ui/button';

export default function CheckoutSummary({
  t,
  items,
  totals,
  currency,
  locale,
  order,
  busy,
  formatCurrency,
}) {
  const formId = order ? 'checkout-payment-form' : 'checkout-delivery-form';
  const actionLabel = order ? t('actions.pay') : t('actions.confirmDelivery');

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="border border-[#d8ddd7] bg-[#f7f8f5]">
        <details open className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 border-b border-[#d8ddd7] px-4 marker:content-none">
            <span className="flex items-center gap-2 text-xs font-medium text-[#172536]"><ShoppingBag className="size-3.5" />{t('summary.products', { count: items.length })}</span>
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="max-h-[16rem] divide-y divide-[#d8ddd7] overflow-y-auto px-4">
            {items.map((item) => (
              <article key={`${item.variantId}-${item.sku}`} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-2.5 py-3">
                <div className="relative aspect-square overflow-hidden bg-white">
                  {item.image ? <Image src={item.image} alt={item.imageAlt || item.name} fill sizes="56px" className="object-contain" /> : null}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium text-[#172536]">{item.name}</h3>
                  <p className="mt-1 truncate text-xs text-[#68736f]">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1 text-xs text-[#68736f]">{t('summary.quantity', { count: item.quantity })}</p>
                </div>
                <p className="whitespace-nowrap text-xs font-medium text-[#172536]">{formatCurrency(item.totalAmount)}</p>
              </article>
            ))}
          </div>
        </details>

        <div className="p-4">
          {order ? (
            <div className="mb-5 flex items-start gap-2 border-b border-[#d8ddd7] pb-4 text-xs leading-5 text-[#68736f]">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" />
              <span>{t('summary.reserved', { time: new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.reservationExpiresAt)) })}</span>
            </div>
          ) : null}
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.subtotal')}</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.discount')}</dt><dd>{totals.discount ? `-${formatCurrency(totals.discount)}` : formatCurrency(0)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.shipping')}</dt><dd>{Number(totals.shipping || 0) === 0 ? t('summary.free') : formatCurrency(totals.shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#d8ddd7] pt-4">
            <span className="text-sm font-medium text-[#172536]">{t('summary.total')}</span>
            <strong className="text-base font-semibold text-[#172536]">{formatCurrency(totals.total, currency)}</strong>
          </div>
          <SiteButton type="submit" form={formId} size="wide" className="mt-4 hidden min-h-11 rounded-none text-sm lg:inline-flex" disabled={busy || items.length === 0}>
            {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
            {actionLabel}
          </SiteButton>
          <p className="mt-3 flex items-center justify-center gap-2 text-[0.7rem] text-[#68736f]">
            <LockKeyhole className="size-3.5" />{t('payment.secureThreeDs')}
          </p>
        </div>
      </div>
    </aside>
  );
}
