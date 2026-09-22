'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import AccountNav from './account-nav';
import AccountOverview from './account-overview';
import AddressBook from './address-book';
import Favorites from './favorites';
import Orders from './orders';
import ProfileForm from './profile-form';

export default function AccountExperience({ locale, user, account, logout }) {
  const [active, setActive] = useState('overview');
  const [data, setData] = useState(account || { profile: user, addresses: [], orders: [], favorites: [] });
  const reduceMotion = useReducedMotion();
  const profile = data.profile || user;
  async function removeFavorite(productId) { const response = await fetch(`/api/account/favorites/${productId}`, { method: 'DELETE' }); const payload = await response.json(); if (response.ok) setData(payload.data); }
  const view = active === 'overview' ? <AccountOverview user={profile} account={data} onNavigate={setActive} /> : active === 'orders' ? <Orders orders={data.orders || []} locale={locale} /> : active === 'addresses' ? <AddressBook addresses={data.addresses || []} onUpdated={setData} /> : active === 'favorites' ? <Favorites favorites={data.favorites || []} locale={locale} onRemove={removeFavorite} /> : <ProfileForm profile={profile} onUpdated={setData} />;
  return <section className="grid-container bg-[#f7f8f5] py-[clamp(2rem,6vw,5rem)]"><div><div className="mb-7 max-w-2xl"><p className="text-sm text-[#69717b]">Hesap merkezi</p><p className="mt-2 text-sm leading-6 text-[#59616b]">Sipariş, adres ve kişisel bilgilerin sadece sana ait güvenli alanda tutulur.</p></div><div className="grid gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10"><AccountNav active={active} onChange={setActive} logout={logout} /><motion.div key={active} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>{view}</motion.div></div></div></section>;
}
