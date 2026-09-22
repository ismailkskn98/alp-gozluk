import CartExperience from "./cart-experience";
import { cartRecommendations, demoCartItems } from "@/data/cart";
import { getSessionUser } from "@/lib/server-api";

export default async function Cart({ locale }) {
  const user = await getSessionUser();
  const initialItems = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ? demoCartItems : [];
  return (
    <section className="grid-container py-[clamp(2rem,5vw,5rem)] max-w-full xl:max-w-11/12  2xl:max-w-10/12 mx-auto">
      <CartExperience locale={locale} authenticated={Boolean(user)} initialItems={initialItems} recommendations={cartRecommendations} />
    </section>
  );
}
