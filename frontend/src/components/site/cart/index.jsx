import CartExperience from "./cart-experience";
import { listProducts } from "@/data/products";
import { getSessionUser } from "@/lib/server-api";

export default async function Cart({ locale }) {
  const [user, products] = await Promise.all([
    getSessionUser(),
    listProducts(locale, { limit: 3, sort: "featured" }),
  ]);
  const recommendations = products
    .filter((product) => product.images?.[0])
    .slice(0, 3)
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      type: product.brand,
      price: product.priceAmount,
      image: product.images[0],
    }));
  return (
    <section className="grid-container py-[clamp(1.5rem,3vw,3.25rem)]">
      <CartExperience locale={locale} authenticated={Boolean(user)} recommendations={recommendations} />
    </section>
  );
}
