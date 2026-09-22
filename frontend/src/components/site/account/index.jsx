"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import AccountNav from "./account-nav";
import { accountNavigationItems } from "./account-nav";
import AccountHeader from "./account-header";
import AccountOverview from "./account-overview";
import AddressBook from "./address-book";
import Favorites from "./favorites";
import { GooeyNav } from "@/components/ui/gooey-nav";
import Orders from "./orders";
import ProfileForm from "./profile-form";
import { withDemoAccount } from "@/data/demo-account";
import { useFavorites, useToggleFavorite } from "@/features/commerce";

const demoEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function AccountExperience({ locale, user, account, initialSection = "overview", logout }) {
  const [active, setActive] = useState(initialSection);
  const [data, setData] = useState(() => (demoEnabled ? withDemoAccount(account, user) : account || { profile: user, addresses: [], orders: [], returns: [], favorites: [] }));
  const favoritesQuery = useFavorites({ authenticated: true });
  const toggleFavorite = useToggleFavorite({ authenticated: true });
  const reduceMotion = useReducedMotion();
  const profile = data.profile || user;
  const favorites = demoEnabled ? (data.favorites || []) : (favoritesQuery.data || data.favorites || []);
  const accountData = { ...data, favorites };

  async function removeFavorite(productId) {
    if (String(productId).startsWith("demo-")) {
      setData((current) => ({ ...current, favorites: current.favorites.filter((product) => product.id !== productId) }));
      return;
    }
    await toggleFavorite.mutateAsync({ productId: Number(productId), isFavorite: true });
  }

  function updateDemoAddresses(addresses) {
    setData((current) => ({ ...current, addresses }));
  }

  const view =
    active === "overview" ? (
      <AccountOverview user={profile} account={accountData} onNavigate={setActive} locale={locale} />
    ) : active === "orders" ? (
      <Orders orders={data.orders || []} returns={data.returns || []} locale={locale} />
    ) : active === "addresses" ? (
      <AddressBook addresses={data.addresses || []} onUpdated={setData} onDemoChange={updateDemoAddresses} />
    ) : active === "favorites" ? (
      <Favorites favorites={favorites} locale={locale} onRemove={removeFavorite} pending={toggleFavorite.isPending} error={favoritesQuery.isError || toggleFavorite.isError} />
    ) : (
      <ProfileForm profile={profile} onUpdated={setData} />
    );
  return (
    // bg-[#f7f8f5]
    <section className="grid-container py-[clamp(2rem,5vw,3rem)] max-w-full xl:max-w-11/12  2xl:max-w-10/12 mx-auto">
      <div>
        <AccountHeader user={profile} />
        <div className="mt-6 overflow-x-auto pb-1 lg:hidden">
          <GooeyNav
            items={accountNavigationItems.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon strokeWidth={1.55} /> }))}
            value={accountNavigationItems.findIndex((item) => item.id === active)}
            onChange={(index) => setActive(accountNavigationItems[index].id)}
            size="xs"
            activeColor="#1d2b3c"
            activeLabelColor="#ffffff"
            separation={10}
            radius={7}
            aria-label="Hesap bölümleri"
          />
        </div>
        <div className="grid gap-10 lg:grid-cols-[11.75rem_minmax(0,1fr)] lg:gap-[clamp(2.5rem,5vw,5rem)]">
          <AccountNav active={active} onChange={setActive} logout={logout} />
          <motion.div key={active} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            {view}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
