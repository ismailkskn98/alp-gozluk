import CartExperience from './cart-experience';
import { cartRecommendations, demoCartItems } from '@/data/cart';

export default function Cart({ locale }) {
  return (
    <section className="grid-container py-[clamp(2rem,5vw,5rem)]">
      <CartExperience
        locale={locale}
        initialItems={demoCartItems}
        recommendations={cartRecommendations}
      />
    </section>
  );
}
