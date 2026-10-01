'use client';

import { AlertCircle, ArrowLeft, LoaderCircle, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import CheckoutSteps from '@/components/site/cart/checkout-steps';
import { SiteButton, siteButtonVariants } from '@/components/site/ui/button';
import { useCart } from '@/features/commerce';
import { commerceKeys } from '@/features/commerce/query-keys';
import { cancelOrder, fetchOrder, prepareOrder } from '@/features/checkout/api';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import CheckoutSummary from './checkout-summary';
import DeliveryForm from './delivery-form';
import PaymentCardForm from './payment-card-form';

const checkoutSessionKey = 'alp_checkout_order_v1';
const orderNumberPattern = /^AG-\d{2}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;

function localized(value, locale, fallback = '') {
  if (typeof value === 'string') return value;
  return value?.[locale] || value?.tr || value?.en || fallback;
}

function normalizeCartItem(item, locale) {
  const product = item.product || {};
  const variant = item.variant || {};
  const image = item.image?.url || item.image || item.imageUrl || product.primaryImage?.url || product.images?.[0]?.url || product.images?.[0] || '';
  const unitPrice = Number(item.currentUnitPrice ?? item.unitPrice ?? variant.price ?? 0);
  const quantity = Number(item.quantity || 1);
  return {
    variantId: item.variantId ?? variant.id,
    sku: item.sku || variant.sku || '',
    name: item.name || localized(product.name, locale, 'Ürün'),
    color: localized(item.color || item.colorCode || variant.color || variant.colorName, locale),
    size: item.size || item.frameSize || variant.frameSize || variant.size || '',
    image,
    imageAlt: item.image?.altText || item.imageAlt || '',
    quantity,
    totalAmount: unitPrice * quantity,
    selected: item.selected ?? item.isSelected ?? true,
    available: item.available !== false,
  };
}

function normalizeOrderItem(item) {
  return {
    variantId: item.variantId,
    sku: item.sku || '',
    name: item.name,
    color: item.colorCode || '',
    size: item.frameSize || '',
    image: item.image?.url || '',
    imageAlt: item.image?.altText || '',
    quantity: Number(item.quantity || 1),
    totalAmount: Number(item.totalAmount || 0),
    selected: true,
    available: true,
  };
}

function createIdempotencyKey() {
  return `checkout:${crypto.randomUUID()}`;
}

function orderIsPayable(order) {
  return order?.status === 'pending_payment' && order?.paymentStatus === 'pending' &&
    new Date(order.reservationExpiresAt).getTime() > Date.now();
}

export default function CheckoutExperience({ locale, profile, addresses, settings }) {
  const t = useTranslations('Checkout');
  const cartQuery = useCart();
  const queryClient = useQueryClient();
  const checkoutIdempotencyKey = useRef(null);
  const [order, setOrder] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [changing, setChanging] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const storedOrderNumber = window.sessionStorage.getItem(checkoutSessionKey);
    if (!orderNumberPattern.test(storedOrderNumber || '')) {
      window.sessionStorage.removeItem(checkoutSessionKey);
      queueMicrotask(() => setRestoring(false));
      return () => controller.abort();
    }

    fetchOrder(storedOrderNumber, { signal: controller.signal })
      .then(async (result) => {
        const restoredOrder = result?.order;
        if (orderIsPayable(restoredOrder)) {
          setOrder(restoredOrder);
          return;
        }
        window.sessionStorage.removeItem(checkoutSessionKey);
        if (restoredOrder?.status === 'pending_payment') {
          try {
            await cancelOrder(storedOrderNumber);
          } catch {
            // Süresi dolan rezervasyonu backend worker'ı da idempotent biçimde temizler.
          }
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') window.sessionStorage.removeItem(checkoutSessionKey);
      })
      .finally(() => setRestoring(false));

    return () => controller.abort();
  }, []);

  const cartItems = useMemo(() => (cartQuery.data?.items || [])
    .map((item) => normalizeCartItem(item, locale))
    .filter((item) => item.selected && item.available), [cartQuery.data?.items, locale]);
  const items = order ? order.items.map(normalizeOrderItem) : cartItems;
  const cartSummary = cartQuery.data?.summary || {};
  const totals = order ? {
    subtotal: Number(order.subtotalAmount || 0),
    discount: Number(order.discountAmount || 0),
    shipping: Number(order.shippingAmount || 0),
    total: Number(order.totalAmount || 0),
  } : {
    subtotal: Number(cartSummary.subtotalAmount || 0),
    discount: Number(cartSummary.discountAmount || 0),
    shipping: Number(cartSummary.shippingAmount || 0),
    total: Number(cartSummary.totalAmount || 0),
  };
  const currency = order?.currency || cartSummary.currency || 'TRY';
  const formatCurrency = useMemo(() => (value) => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(Number(value || 0)), [currency, locale]);
  const labels = useMemo(() => ({
    checkoutProgress: t('steps.progress'),
    cartSummary: t('steps.cart'),
    deliveryAndPayment: t('steps.delivery'),
    orderResult: t('steps.result'),
  }), [t]);

  async function confirmDelivery(values) {
    if (preparing || order) return;
    setPreparing(true);
    setPageError('');
    checkoutIdempotencyKey.current ||= createIdempotencyKey();
    const shippingAddress = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      countryCode: 'TR',
      city: values.city,
      district: values.district,
      neighborhood: values.neighborhood,
      postalCode: values.postalCode,
      addressLine: values.addressLine,
    };
    const billingAddress = values.billingSameAsShipping ? shippingAddress : {
      firstName: values.billingFirstName,
      lastName: values.billingLastName,
      phone: values.billingPhone,
      countryCode: 'TR',
      city: values.billingCity,
      district: values.billingDistrict,
      neighborhood: values.billingNeighborhood,
      postalCode: values.billingPostalCode,
      addressLine: values.billingAddressLine,
    };
    try {
      const result = await prepareOrder({
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        shippingAddress,
        billingSameAsShipping: values.billingSameAsShipping,
        billingAddress,
        notes: values.notes,
        locale,
      }, checkoutIdempotencyKey.current);
      if (!orderIsPayable(result?.order)) throw new Error(t('errors.orderUnavailable'));
      setOrder(result.order);
      setPaymentAmount(Number(result.order.totalAmount || 0));
      window.sessionStorage.setItem(checkoutSessionKey, result.order.orderNumber);
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
      requestAnimationFrame(() => document.getElementById('payment-title')?.focus?.({ preventScroll: true }));
    } catch (error) {
      setPageError(error.message || t('errors.prepare'));
      throw error;
    } finally {
      setPreparing(false);
    }
  }

  async function changeOrder() {
    if (!order || changing) return;
    setChanging(true);
    setPageError('');
    try {
      await cancelOrder(order.orderNumber);
      setOrder(null);
      setPaymentAmount(null);
      checkoutIdempotencyKey.current = null;
      window.sessionStorage.removeItem(checkoutSessionKey);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commerceKeys.cart() }),
        queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() }),
      ]);
    } catch (error) {
      setPageError(error.message || t('errors.cancel'));
    } finally {
      setChanging(false);
    }
  }

  const onPaymentBusyChange = useCallback((value) => setPaymentBusy(value), []);
  const onPaymentAmountChange = useCallback((value) => setPaymentAmount(Number(value || 0)), []);
  const busy = preparing || changing || paymentBusy;
  const actionForm = order ? 'checkout-payment-form' : 'checkout-delivery-form';
  const actionLabel = order ? t('actions.pay') : t('actions.confirmDelivery');

  if (restoring || cartQuery.isPending) {
    return (
      <section className="grid-container py-[clamp(2rem,5vw,4rem)]">
        <div className="grid min-h-[32rem] place-items-center border-y border-[#d8ddd7]" role="status">
          <p className="flex items-center gap-2 text-sm text-[#68736f]"><LoaderCircle className="size-4 animate-spin" />{t('loading')}</p>
        </div>
      </section>
    );
  }

  if (cartQuery.isError && !order) {
    return (
      <section className="grid-container py-[clamp(2rem,5vw,4rem)]">
        <div className="border border-[#d9a8a8] bg-[#fff6f6] p-6" role="alert">
          <p className="flex items-center gap-2 text-sm text-[#9f3434]"><AlertCircle className="size-4" />{t('errors.cart')}</p>
          <button type="button" className="mt-4 text-sm font-medium underline" onClick={() => cartQuery.refetch()}>{t('actions.tryAgain')}</button>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="grid-container py-[clamp(2rem,5vw,5rem)]">
        <div>
          <CheckoutSteps itemCount={0} labels={labels} activeStep={1} />
          <div className="mt-10 border border-[#d8ddd7] bg-[#f7f8f5] px-6 py-16 text-center sm:py-24">
            <ShoppingBag className="mx-auto size-7" strokeWidth={1.35} />
            <h1 className="mt-5 text-3xl font-light tracking-[-0.03em]">{t('empty.title')}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#68736f]">{t('empty.description')}</p>
            <Link href="/cart" className={cn(siteButtonVariants(), 'mt-7 rounded-none')}><ArrowLeft />{t('actions.backToCart')}</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid-container pb-28 pt-[clamp(1.5rem,3vw,2.75rem)] lg:pb-[clamp(2.5rem,5vw,4.5rem)]">
      <div>
        <CheckoutSteps itemCount={items.reduce((total, item) => total + item.quantity, 0)} labels={labels} activeStep={1} />
        <div className="mt-[clamp(1.5rem,3vw,2.5rem)] flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs text-[#68736f]">{t('eyebrow')}</p><h1 className="mt-1 text-[clamp(1.65rem,2.4vw,2.25rem)] font-medium leading-tight tracking-[-0.03em]">{t('title')}</h1></div>
          <p className="max-w-md text-xs leading-5 text-[#68736f] sm:text-right">{t('description')}</p>
        </div>

        {pageError ? <p className="mt-6 border border-[#d9a8a8] bg-[#fff6f6] p-4 text-sm text-[#9f3434]" role="alert">{pageError}</p> : null}

        <div className="mt-5 grid gap-x-[clamp(1rem,2.5vw,2.25rem)] gap-y-5 lg:grid-cols-[minmax(0,1fr)_clamp(18.5rem,23vw,22rem)]">
          <div className="min-w-0 space-y-4">
            <DeliveryForm
              t={t}
              profile={profile}
              addresses={addresses}
              order={order}
              preparing={preparing}
              changing={changing}
              settings={settings}
              onConfirm={confirmDelivery}
              onChangeOrder={changeOrder}
            />
            {order ? (
              <PaymentCardForm order={order} locale={locale} t={t} formatCurrency={formatCurrency} onBusyChange={onPaymentBusyChange} onAmountChange={onPaymentAmountChange} />
            ) : null}
          </div>
          <CheckoutSummary t={t} items={items} totals={{ ...totals, total: order ? paymentAmount ?? totals.total : totals.total }} currency={currency} locale={locale} order={order} busy={busy} formatCurrency={formatCurrency} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8ddd7] bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1"><p className="text-xs text-[#68736f]">{t('summary.total')}</p><p className="truncate text-lg font-semibold text-[#172536]">{formatCurrency(order ? paymentAmount ?? totals.total : totals.total)}</p></div>
          <SiteButton type="submit" form={actionForm} className="min-w-[9.5rem] rounded-none" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : null}{actionLabel}
          </SiteButton>
        </div>
      </div>
    </section>
  );
}
