'use client';

import { ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import CartItem from './cart-item';
import CheckoutSteps from './checkout-steps';
import OrderSummary from './order-summary';
import CartRecommendations from './recommendations';
import { Link } from '@/i18n/navigation';

export default function CartExperience({ locale, initialItems, recommendations }) {
  const t = useTranslations('Cart');
  const [items, setItems] = useState(initialItems);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  const labels = useMemo(() => ({
    checkoutProgress: t('checkoutProgress'),
    cartSummary: t('cartSummary'),
    deliveryAndPayment: t('deliveryAndPayment'),
    orderResult: t('orderResult'),
    campaign: t('campaign'),
    campaignApplied: t('campaignApplied'),
    size: t('size'),
    quantity: t('quantity'),
    decreaseQuantity: t('decreaseQuantity'),
    increaseQuantity: t('increaseQuantity'),
    remove: t('remove'),
    viewProduct: t('viewProduct'),
    freeShippingReached: t('freeShippingReached'),
    subtotal: t('subtotal'),
    discount: t('discount'),
    shipping: t('shipping'),
    free: t('free'),
    total: t('total'),
    confirmCart: t('confirmCart'),
    continueShopping: t('continueShopping'),
    secureCheckout: t('secureCheckout'),
    promoTitle: t('promoTitle'),
    promoLabel: t('promoLabel'),
    promoPlaceholder: t('promoPlaceholder'),
    apply: t('apply'),
    recommendations: t('recommendations'),
    viewAll: t('viewAll'),
  }), [t]);

  const formatCurrency = useMemo(() => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format, [locale]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const saleTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const couponDiscount = couponApplied ? Math.round(saleTotal * 0.1) : 0;
    return {
      subtotal,
      discount: subtotal - saleTotal + couponDiscount,
      total: saleTotal - couponDiscount,
    };
  }, [couponApplied, items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(id, quantity) {
    setItems((currentItems) => currentItems.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  function removeItem(id) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function applyCoupon(event) {
    event.preventDefault();
    if (couponCode.trim().toUpperCase() === 'ALP10') {
      setCouponApplied(true);
      setCouponMessage(t('promoSuccess'));
      return;
    }
    setCouponApplied(false);
    setCouponMessage(t('promoInvalid'));
  }

  return (
    <div>
      <CheckoutSteps itemCount={itemCount} labels={labels} />

      <div className="mt-[clamp(2rem,4vw,3.5rem)] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('eyebrow')}</p>
          <h1 className="mt-2 text-[clamp(2.5rem,5vw,5.25rem)] font-light leading-[0.92] tracking-[-0.045em]">{t('title')}</h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{t('description')}</p>
      </div>

      {items.length ? (
        <div className="mt-8 grid gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-8 lg:grid-cols-[minmax(0,1fr)_clamp(19rem,24vw,23rem)]">
          <div className="min-w-0">
            <div className="mb-4 flex min-h-12 items-center justify-center bg-[#e9ece6] px-4 text-center text-sm">
              {t('campaign')}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  labels={labels}
                  locale={locale}
                  formatCurrency={formatCurrency}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          <OrderSummary
            totals={totals}
            labels={labels}
            formatCurrency={formatCurrency}
            couponCode={couponCode}
            couponMessage={couponMessage}
            onCouponChange={setCouponCode}
            onCouponSubmit={applyCoupon}
          />

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <CartRecommendations products={recommendations} labels={labels} locale={locale} formatCurrency={formatCurrency} />
          </div>
        </div>
      ) : (
        <div className="mt-10 border border-border bg-[#f7f7f4] px-6 py-16 text-center sm:py-24">
          <ShoppingBag className="mx-auto size-8" strokeWidth={1.25} />
          <h2 className="mt-5 text-3xl">{t('emptyTitle')}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{t('emptyDescription')}</p>
          <Link href="/shop" className="mt-7 inline-flex h-11 items-center bg-foreground px-5 text-sm font-semibold text-white hover:bg-primary">{t('startShopping')}</Link>
        </div>
      )}
    </div>
  );
}
