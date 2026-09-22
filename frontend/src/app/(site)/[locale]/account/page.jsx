import AccountLogout from '@/components/auth/account-logout';
import AccountExperience from '@/components/site/account';
import { redirect } from '@/i18n/navigation';
import { getAccountOverview, getSessionUser } from '@/lib/server-api';

const accountSections = new Set(['overview', 'orders', 'addresses', 'favorites', 'profile']);

export default async function AccountPage({ params, searchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const requestedSection = accountSections.has(query?.section) ? query.section : 'overview';
  const user = await getSessionUser();
  if (!user) {
    const next = requestedSection === 'favorites' ? '/account?section=favorites' : '/account';
    redirect({ href: `/login?next=${encodeURIComponent(next)}`, locale });
  }
  const account = await getAccountOverview();
  return <AccountExperience key={requestedSection} locale={locale} user={user} account={account} initialSection={requestedSection} logout={<AccountLogout locale={locale} />} />;
}
