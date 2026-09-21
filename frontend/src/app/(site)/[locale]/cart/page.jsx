import Cart from '@/components/site/cart';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: locale === 'tr' ? 'Sepet' : 'Cart' };
}

export default async function CartPage({ params }) {
  const { locale } = await params;
  return <Cart locale={locale} />;
}
