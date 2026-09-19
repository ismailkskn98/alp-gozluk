import { redirect } from '@/i18n/navigation';

export default async function CheckoutPage({ params }) {
  const { locale } = await params;
  redirect({ href: '/cart', locale });
}
