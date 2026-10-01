'use client';

import { AlertCircle, Clock3, LoaderCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import OrderReceipt from '@/components/site/checkout/order-receipt';
import { siteButtonVariants } from '@/components/site/ui/button';
import { fetchPaymentStatus } from '@/features/checkout/api';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const paymentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const checkoutSessionKey = 'alp_checkout_order_v1';

export default function PaymentResult({ paymentAttemptId, locale, authenticated }) {
  const t = useTranslations('Checkout');
  const [payment, setPayment] = useState(null);
  const [state, setState] = useState(paymentIdPattern.test(paymentAttemptId || '') ? 'loading' : 'invalid');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!paymentIdPattern.test(paymentAttemptId || '')) return undefined;
    const controller = new AbortController();
    let timeoutId;
    let pollCount = 0;

    async function loadStatus() {
      try {
        const result = await fetchPaymentStatus(paymentAttemptId, { signal: controller.signal });
        setPayment(result);
        if (result.status === 'paid') {
          window.sessionStorage.removeItem(checkoutSessionKey);
          setState('paid');
          return;
        }
        if (['failed', 'cancelled', 'expired'].includes(result.status)) {
          window.sessionStorage.removeItem(checkoutSessionKey);
          setState(result.status);
          return;
        }
        setState(result.providerStatus === 'FRAUD_REVIEW' || result.providerStatus === 'ITEM_REVIEW' ? 'review' : 'pending');
        pollCount += 1;
        if (pollCount < 20) timeoutId = window.setTimeout(loadStatus, 2000);
      } catch (error) {
        if (error.name !== 'AbortError') setState('error');
      }
    }

    loadStatus();
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [paymentAttemptId, retryKey]);

  const presentation = {
    pending: { icon: Clock3, tone: 'bg-[#f5f0df] text-[#846813]', title: t('result.pendingTitle'), description: t('result.pendingDescription') },
    review: { icon: Clock3, tone: 'bg-[#f5f0df] text-[#846813]', title: t('result.reviewTitle'), description: t('result.reviewDescription') },
    failed: { icon: AlertCircle, tone: 'bg-[#fff0f0] text-[#a53e3e]', title: t('result.failedTitle'), description: t('result.failedDescription') },
    cancelled: { icon: AlertCircle, tone: 'bg-[#fff0f0] text-[#a53e3e]', title: t('result.cancelledTitle'), description: t('result.failedDescription') },
    expired: { icon: Clock3, tone: 'bg-[#fff0f0] text-[#a53e3e]', title: t('result.expiredTitle'), description: t('result.expiredDescription') },
  }[state];
  const ResultIcon = presentation?.icon;

  if (state === 'paid' && payment) {
    return (
      <section className="grid-container bg-[#f5f6f3] py-[clamp(2rem,5vw,4.5rem)]">
        <OrderReceipt payment={payment} locale={locale} authenticated={authenticated} />
      </section>
    );
  }

  return (
    <section className="grid-container bg-[#f5f6f3] py-[clamp(3rem,8vw,7rem)]">
      <div className="mx-auto w-full max-w-2xl border border-[#d8ddd7] bg-white px-5 py-10 text-center sm:px-10 sm:py-14">
          {state === 'loading' ? (
            <div role="status"><LoaderCircle className="mx-auto size-7 animate-spin text-[#172536]" /><p className="mt-4 text-sm text-[#68736f]">{t('result.checking')}</p></div>
          ) : state === 'invalid' ? (
            <><span className="mx-auto grid size-14 place-items-center bg-[#fff0f0] text-[#a53e3e]"><AlertCircle /></span><h1 className="mt-6 text-3xl font-light tracking-[-0.03em]">{t('result.invalidTitle')}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#68736f]">{t('result.invalidDescription')}</p></>
          ) : state === 'error' ? (
            <><span className="mx-auto grid size-14 place-items-center bg-[#fff0f0] text-[#a53e3e]"><AlertCircle /></span><h1 className="mt-6 text-3xl font-light tracking-[-0.03em]">{t('result.errorTitle')}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#68736f]">{t('result.errorDescription')}</p><button type="button" onClick={() => { setState('loading'); setRetryKey((value) => value + 1); }} className={cn(siteButtonVariants({ variant: 'secondary' }), 'mt-7 rounded-none')}><RefreshCw />{t('actions.tryAgain')}</button></>
          ) : presentation ? (
            <>
              <span className={cn('mx-auto grid size-14 place-items-center', presentation.tone)}><ResultIcon /></span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#68736f]">{payment?.order?.number}</p>
              <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-[-0.04em]">{presentation.title}</h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#68736f]">{presentation.description}</p>
            </>
          ) : null}

          {state !== 'loading' ? (
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              {['failed', 'cancelled', 'expired'].includes(state) ? <Link href="/cart" className={cn(siteButtonVariants(), 'rounded-none')}>{t('actions.backToCart')}</Link> : null}
              <Link href="/shop" className={cn(siteButtonVariants({ variant: 'secondary' }), 'rounded-none')}>{t('actions.continueShopping')}</Link>
            </div>
          ) : null}
      </div>
    </section>
  );
}
