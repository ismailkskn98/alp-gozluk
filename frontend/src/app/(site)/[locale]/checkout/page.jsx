import CheckoutExperience from '@/components/site/checkout/checkout-experience';
import { getCommerceSettings } from '@/data/commerce-settings';
import { getAccountOverview, getSessionUser } from '@/lib/server-api';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Teslimat ve ödeme' : 'Delivery and payment',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }) {
  const { locale } = await params;
  const [user, settings] = await Promise.all([getSessionUser(), getCommerceSettings()]);
  const account = user ? await getAccountOverview() : null;

  return (
    <CheckoutExperience
      locale={locale}
      profile={account?.profile || user}
      addresses={account?.addresses || []}
      settings={settings}
    />
  );
}
