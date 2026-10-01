import PaymentResult from '@/components/site/checkout/payment-result';
import { getSessionUser } from '@/lib/server-api';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Sipariş sonucu' : 'Order result',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

export default async function CheckoutResultPage({ params, searchParams }) {
  const [{ locale }, query, user] = await Promise.all([params, searchParams, getSessionUser()]);
  return <PaymentResult locale={locale} authenticated={Boolean(user)} paymentAttemptId={String(query?.paymentAttemptId || '')} />;
}
