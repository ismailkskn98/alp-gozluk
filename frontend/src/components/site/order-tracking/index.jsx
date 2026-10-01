'use client';

import { Check, LoaderCircle, MapPin, PackageCheck, Search, Truck } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchGuestOrderTracking, fetchOrder } from '@/features/checkout/api';
import { SiteButton } from '@/components/site/ui/button';
import { cn } from '@/lib/utils';

const orderNumberPattern = /^AG-\d{2}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;
const deliverySteps = [
  { key: 'preparing', icon: PackageCheck },
  { key: 'shipped', icon: Truck },
  { key: 'delivered', icon: Check },
];

const requestOrder = (orderNumber, trackingToken, signal) => (
  trackingToken
    ? fetchGuestOrderTracking(orderNumber, trackingToken, { signal })
    : fetchOrder(orderNumber, { signal })
);

function resolveDeliveryState(order) {
  if (order.status === 'cancelled' || order.fulfillmentStatus === 'cancelled') return 'cancelled';
  if (order.fulfillmentStatus === 'delivered' || order.status === 'delivered') return 'delivered';
  if (order.fulfillmentStatus === 'shipped' || order.status === 'shipped') return 'shipped';
  return 'preparing';
}

export default function GuestOrderTracking({ initialOrderNumber, locale }) {
  const t = useTranslations('OrderTracking');
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [state, setState] = useState(initialOrderNumber ? 'loading' : 'idle');
  const activeState = useMemo(() => order ? resolveDeliveryState(order) : null, [order]);

  async function loadOrder(number, trackingToken) {
    const normalizedNumber = String(number || '').trim().toUpperCase();
    if (!orderNumberPattern.test(normalizedNumber)) {
      setState('error');
      setOrder(null);
      return;
    }
    setState('loading');
    setOrderNumber(normalizedNumber);
    try {
      const result = await requestOrder(normalizedNumber, trackingToken);
      setOrder(result.order);
      setState('success');
    } catch {
      setOrder(null);
      setState('error');
    }
  }

  useEffect(() => {
    if (!initialOrderNumber || !orderNumberPattern.test(initialOrderNumber)) return undefined;
    const controller = new AbortController();
    const trackingToken = new URLSearchParams(window.location.hash.slice(1)).get('token');
    requestOrder(initialOrderNumber, trackingToken, controller.signal)
      .then((result) => {
        setOrder(result.order);
        setState('success');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setOrder(null);
        setState('error');
      });
    return () => controller.abort();
  }, [initialOrderNumber]);

  const formatDate = (value) => value ? new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value)) : '—';

  return (
    <section className="grid-container bg-[#f5f6f3] py-[clamp(2rem,5vw,5rem)]">
      <div className="mx-auto w-full max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68736f]">{t('eyebrow')}</p>
          <h1 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1] tracking-[-0.05em] text-[#172536]">{t('title')}</h1>
          <p className="mt-4 text-sm leading-6 text-[#68736f]">{t('description')}</p>
        </header>

        <form
          className="mt-7 grid gap-2 border border-[#d8ddd7] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            loadOrder(orderNumber, null);
          }}
        >
          <label className="min-w-0">
            <span className="sr-only">{t('orderNumber')}</span>
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
              placeholder={t('placeholder')}
              autoComplete="off"
              spellCheck="false"
              className="min-h-11 w-full rounded-none border border-[#cfd5d1] bg-white px-3 font-mono text-sm uppercase tracking-[0.06em] text-[#172536] outline-none transition-colors focus:border-[#172536]"
            />
          </label>
          <SiteButton type="submit" className="rounded-none sm:min-w-36" disabled={state === 'loading'}>
            {state === 'loading' ? <LoaderCircle className="animate-spin" /> : <Search />}{t('submit')}
          </SiteButton>
        </form>

        {state === 'loading' ? <p className="mt-7 flex items-center gap-2 text-sm text-[#68736f]" role="status"><LoaderCircle className="size-4 animate-spin" />{t('loading')}</p> : null}
        {state === 'error' ? (
          <div className="mt-7 border border-[#e3c6c6] bg-[#fff7f7] p-5 text-sm leading-6 text-[#8d3434]" role="alert">
            <p>{t('notFound')}</p>
            <p className="mt-2 text-xs text-[#68736f]">{t('privateLink')}</p>
          </div>
        ) : null}

        {state === 'success' && order ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 border border-[#d8ddd7] bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d8ddd7] pb-5">
                <div>
                  <p className="text-xs text-[#68736f]">{t('orderNumber')}</p>
                  <p className="mt-1 font-mono text-sm font-semibold tracking-[0.06em] text-[#172536]">{order.orderNumber}</p>
                </div>
                <div className={cn('px-3 py-2 text-xs font-medium', activeState === 'cancelled' ? 'bg-[#fff0f0] text-[#a53e3e]' : 'bg-[#edf4ee] text-[#356a50]')}>
                  {t(`statuses.${activeState}`)}
                </div>
              </div>

              {activeState === 'cancelled' ? (
                <div className="py-7"><h2 className="text-lg font-medium text-[#172536]">{t('statuses.cancelled')}</h2><p className="mt-2 text-sm leading-6 text-[#68736f]">{t('statuses.cancelledDescription')}</p></div>
              ) : (
                <ol className="grid gap-0 py-7 sm:grid-cols-3" aria-label={t('title')}>
                  {deliverySteps.map((step, index) => {
                    const activeIndex = deliverySteps.findIndex((candidate) => candidate.key === activeState);
                    const reached = index <= activeIndex;
                    const Icon = step.icon;
                    return (
                      <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0 sm:block sm:pb-0 sm:pr-4">
                        <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center border', reached ? 'border-[#172536] bg-[#172536] text-white' : 'border-[#cfd5d1] bg-white text-[#9aa39f]')}><Icon className="size-4" /></span>
                        {index < deliverySteps.length - 1 ? <span aria-hidden="true" className={cn('absolute left-[0.95rem] top-8 h-[calc(100%-2rem)] w-px sm:left-8 sm:top-[0.95rem] sm:h-px sm:w-[calc(100%-2rem)]', index < activeIndex ? 'bg-[#172536]' : 'bg-[#d8ddd7]')} /> : null}
                        <div className="sm:mt-3">
                          <h3 className="text-sm font-medium text-[#172536]">{t(`statuses.${step.key}`)}</h3>
                          <p className="mt-1 text-xs leading-5 text-[#68736f]">{t(`statuses.${step.key}Description`)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="border-t border-[#d8ddd7] pt-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#172536]">{t('summary')}</h2>
                <div className="mt-3 divide-y divide-[#e2e6e2]">
                  {order.items.map((item) => (
                    <article key={`${item.variantId}-${item.sku}`} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-3">
                      <div className="relative aspect-square bg-[#f7f8f5]">{item.image?.url ? <Image src={item.image.url} alt={item.image.altText || item.name} fill sizes="56px" className="object-contain" /> : null}</div>
                      <div className="min-w-0"><h3 className="text-sm font-medium text-[#172536]">{item.name}</h3><p className="mt-1 text-xs text-[#68736f]">{[item.colorCode, item.frameSize, item.sku].filter(Boolean).join(' · ')}</p><p className="mt-1 text-xs text-[#68736f]">{t('quantity', { count: item.quantity })}</p></div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border border-[#d8ddd7] bg-[#eef1ed] p-5 lg:self-start">
              <dl className="space-y-5 text-xs">
                <div><dt className="text-[#68736f]">{t('destination')}</dt><dd className="mt-1 flex items-center gap-2 font-medium text-[#172536]"><MapPin className="size-3.5" />{order.destination ? `${order.destination.district} / ${order.destination.city}` : '—'}</dd></div>
                <div><dt className="text-[#68736f]">{t('shippingMethod')}</dt><dd className="mt-1 font-medium text-[#172536]">{order.shippingMethod?.name || '—'}</dd></div>
                <div><dt className="text-[#68736f]">{t('lastUpdate')}</dt><dd className="mt-1 font-medium text-[#172536]">{formatDate(order.updatedAt)}</dd></div>
              </dl>
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}
