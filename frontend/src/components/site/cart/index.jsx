import CartExperience from "./cart-experience";
import { cartRecommendations, demoCartItems } from "@/data/cart";

export default function Cart({ locale }) {
  return (
    <section className="grid-container py-[clamp(2rem,5vw,5rem)] max-w-full xl:max-w-11/12  2xl:max-w-10/12 mx-auto">
      <CartExperience locale={locale} initialItems={demoCartItems} recommendations={cartRecommendations} />
    </section>
  );
}
