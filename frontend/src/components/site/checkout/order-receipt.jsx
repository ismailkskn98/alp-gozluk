'use client';

import { Check, CheckCheck, Copy, Mail, MapPin, PackageCheck, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { siteButtonVariants } from '@/components/site/ui/button';
import { cn } from '@/lib/utils';

export default function OrderReceipt({ payment, locale, authenticated }) {
  const t = useTranslations('Checkout');
  const [copied, setCopied] = useState(false);
  const order = payment.order;
  const items = order.items || [];
  const formatCurrency = (value) => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: payment.currency || 'TRY',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const placedAt = order.placedAt ? new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.placedAt)) : null;
  const trackingHref = order.trackingToken
    ? `/order-tracking?order=${encodeURIComponent(order.number)}#token=${encodeURIComponent(order.trackingToken)}`
    : null;

  async function copyOrderNumber() {
    await navigator.clipboard.writeText(order.number);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto w-full max-w-[46rem]">
      <header className="bg-[#172536] px-5 py-5 text-white sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/55">ALP Gözlük</p>
            <p className="mt-3 text-xs text-white/60">{t('result.orderNumber')}</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-[0.08em] sm:text-xl">{order.number}</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center bg-[#edf4ee] text-[#356a50]">
            <Check className="size-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
          <p className="flex items-center gap-2 text-xs text-white/70"><PackageCheck className="size-4" />{t('result.paymentReceived')}</p>
          <button type="button" onClick={copyOrderNumber} className="inline-flex items-center gap-2 text-xs font-medium text-white underline-offset-4 hover:underline">
            {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? t('result.copied') : t('result.copy')}
          </button>
        </div>
      </header>

      <div className="bg-[#fffef9] px-5 py-7 shadow-[0_22px_60px_rgba(23,37,54,0.08)] sm:px-8 sm:py-9">
        <div className="text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#68736f]">{t('result.receiptEyebrow')}</p>
          <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.6rem)] font-normal leading-tight tracking-[-0.04em] text-[#172536]">{t('result.paidTitle')}</h1>
          <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-[#68736f] sm:text-sm sm:leading-6">{t('result.paidDescription')}</p>
        </div>

        <div className="mt-7 border-y border-dashed border-[#cfd5d1] py-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#172536]">{t('result.orderSummary')}</h2>
            <span className="text-[0.68rem] text-[#68736f]">{t('result.productCount', { count: items.length })}</span>
          </div>
          <div className="divide-y divide-dashed divide-[#d8ddd7]">
            {items.map((item) => (
              <article key={`${item.variantId}-${item.sku}`} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-4 first:pt-1 sm:grid-cols-[3.75rem_minmax(0,1fr)_auto] sm:items-center">
                <div className="relative aspect-square overflow-hidden bg-white">
                  {item.image?.url ? <Image src={item.image.url} alt={item.image.altText || item.name} fill sizes="60px" className="object-contain" /> : null}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium leading-5 text-[#172536]">{item.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#68736f]">{[item.colorCode, item.frameSize, item.sku].filter(Boolean).join(' · ')}</p>
                  <p className="mt-0.5 text-xs text-[#68736f]">{t('summary.quantity', { count: item.quantity })}</p>
                </div>
                <p className="col-start-2 whitespace-nowrap text-xs font-medium text-[#172536] sm:col-start-auto sm:text-sm">{formatCurrency(item.totalAmount)}</p>
              </article>
            ))}
          </div>
        </div>

        <dl className="space-y-2.5 border-b border-dashed border-[#cfd5d1] py-5 text-xs sm:text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.subtotal')}</dt><dd>{formatCurrency(order.subtotalAmount)}</dd></div>
          {Number(order.discountAmount) > 0 ? <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.discount')}</dt><dd>-{formatCurrency(order.discountAmount)}</dd></div> : null}
          <div className="flex justify-between gap-4"><dt className="text-[#68736f]">{t('summary.shipping')}</dt><dd>{Number(order.shippingAmount) === 0 ? t('summary.free') : formatCurrency(order.shippingAmount)}</dd></div>
          <div className="flex justify-between gap-4 pt-2 text-sm font-semibold sm:text-base"><dt>{t('summary.total')}</dt><dd>{formatCurrency(order.totalAmount)}</dd></div>
        </dl>

        <div className="grid gap-3 border-b border-dashed border-[#cfd5d1] py-5 text-xs leading-5 text-[#68736f] sm:grid-cols-2">
          <p className="flex items-start gap-2"><Mail className="mt-0.5 size-3.5 shrink-0" /><span>{t(order.emailDeliveryStatus === 'sent' ? 'result.emailSentNotice' : 'result.emailNotice', { email: order.contactEmail })}</span></p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span>{t('result.trackingNotice')}</span></p>
        </div>

        <dl className="grid gap-2 py-5 text-[0.7rem] text-[#68736f] sm:grid-cols-2">
          <div className="flex justify-between gap-3 sm:block"><dt>{t('result.orderNumber')}</dt><dd className="font-mono font-medium text-[#172536] sm:mt-1">{order.number}</dd></div>
          {placedAt ? <div className="flex justify-between gap-3 sm:block sm:text-right"><dt>{t('result.orderDate')}</dt><dd className="font-medium text-[#172536] sm:mt-1">{placedAt}</dd></div> : null}
        </dl>

        <div aria-hidden="true" className="mx-auto h-11 w-[70%] opacity-70" style={{ background: 'repeating-linear-gradient(90deg,#172536 0 2px,transparent 2px 4px,#172536 4px 5px,transparent 5px 8px)' }} />
        <p className="mt-2 text-center font-mono text-[0.62rem] tracking-[0.24em] text-[#68736f]">{order.number.replaceAll('-', ' ')}</p>
      </div>
      <div aria-hidden="true" className="h-3 bg-[#fffef9]" style={{ clipPath: 'polygon(0 0,100% 0,100% 20%,98.5% 100%,97% 20%,95.5% 100%,94% 20%,92.5% 100%,91% 20%,89.5% 100%,88% 20%,86.5% 100%,85% 20%,83.5% 100%,82% 20%,80.5% 100%,79% 20%,77.5% 100%,76% 20%,74.5% 100%,73% 20%,71.5% 100%,70% 20%,68.5% 100%,67% 20%,65.5% 100%,64% 20%,62.5% 100%,61% 20%,59.5% 100%,58% 20%,56.5% 100%,55% 20%,53.5% 100%,52% 20%,50.5% 100%,49% 20%,47.5% 100%,46% 20%,44.5% 100%,43% 20%,41.5% 100%,40% 20%,38.5% 100%,37% 20%,35.5% 100%,34% 20%,32.5% 100%,31% 20%,29.5% 100%,28% 20%,26.5% 100%,25% 20%,23.5% 100%,22% 20%,20.5% 100%,19% 20%,17.5% 100%,16% 20%,14.5% 100%,13% 20%,11.5% 100%,10% 20%,8.5% 100%,7% 20%,5.5% 100%,4% 20%,2.5% 100%,1% 20%,0 100%)' }} />

      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        {trackingHref ? <Link href={trackingHref} className={cn(siteButtonVariants({ size: 'wide' }), 'rounded-none')}><PackageCheck />{t('actions.trackOrder')}</Link> : null}
        {authenticated ? <Link href="/account?section=orders" className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'rounded-none')}><ShoppingBag />{t('actions.viewOrders')}</Link> : <Link href="/shop" className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'rounded-none')}>{t('actions.continueShopping')}</Link>}
      </div>
    </div>
  );
}
