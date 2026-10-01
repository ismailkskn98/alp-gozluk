import GuestOrderTracking from '@/components/site/order-tracking';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Sipariş takibi' : 'Order tracking',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

export default async function OrderTrackingPage({ params, searchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  return <GuestOrderTracking locale={locale} initialOrderNumber={String(query?.order || '')} />;
}
