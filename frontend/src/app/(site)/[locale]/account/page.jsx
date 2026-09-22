import AccountLogout from '@/components/auth/account-logout';
import AccountExperience from '@/components/site/account';
import { redirect } from '@/i18n/navigation';
import { getAccountOverview, getSessionUser } from '@/lib/server-api';

export default async function AccountPage({ params }) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect({ href: '/login', locale });
  const account = await getAccountOverview();
  return <AccountExperience locale={locale} user={user} account={account} logout={<AccountLogout locale={locale} />} />;
}
