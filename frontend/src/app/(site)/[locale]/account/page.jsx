import AccountLogout from '@/components/auth/account-logout';
import { redirect } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/server-api';

export default async function AccountPage({ params }) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect({ href: '/login', locale });
  const tr = locale === 'tr';
  return <section className="grid-container py-16"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr ? 'Hesabım' : 'My account'}</p><h1 className="mt-3 text-5xl">{tr ? `Merhaba, ${user.firstName}` : `Hello, ${user.firstName}`}</h1><div className="mt-10 grid gap-4 md:grid-cols-3"><article className="rounded-lg border border-border bg-white p-5"><h2 className="font-semibold">{tr ? 'Profil' : 'Profile'}</h2><p className="mt-3 text-sm text-muted-foreground">{user.email}</p></article><article className="rounded-lg border border-border bg-white p-5"><h2 className="font-semibold">{tr ? 'Siparişler' : 'Orders'}</h2><p className="mt-3 text-sm text-muted-foreground">{tr ? 'Henüz sipariş yok.' : 'No orders yet.'}</p></article><article className="rounded-lg border border-border bg-white p-5"><h2 className="font-semibold">{tr ? 'Oturum' : 'Session'}</h2><AccountLogout locale={locale} /></article></div></div></section>;
}
