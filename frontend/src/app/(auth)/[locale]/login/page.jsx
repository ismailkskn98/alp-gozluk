import AuthForm from '@/components/auth/auth-form';
import AuthShell from '@/components/auth/auth-shell';
import GoogleAuthSection from '@/components/auth/google-auth-section';
import { getPathname, Link } from '@/i18n/navigation';

const favoriteDestination = '/account?section=favorites';
const checkoutDestination = '/checkout';

function resolveDestination(next, locale) {
  if (next === favoriteDestination) {
    return `${getPathname({ href: '/account', locale })}?section=favorites`;
  }
  if (next === checkoutDestination) return getPathname({ href: checkoutDestination, locale });
  return getPathname({ href: '/account', locale });
}

export default async function LoginPage({ params, searchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const tr = locale === 'tr';
  const safeNext = [favoriteDestination, checkoutDestination].includes(query?.next) ? query.next : null;
  const redirectTo = resolveDestination(safeNext, locale);
  const registerHref = safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : '/register';
  return (
    <AuthShell locale={locale} eyebrow={tr ? 'Hesabım' : 'My account'} title={tr ? 'Tekrar hoş geldin.' : 'Welcome back.'} description={tr ? 'Siparişlerini ve adreslerini yönetmek için giriş yap.' : 'Sign in to manage your orders and addresses.'} footer={<>{tr ? 'Hesabın yok mu? ' : 'No account? '}<Link href={registerHref} className="font-semibold text-primary">{tr ? 'Hesap oluştur' : 'Create account'}</Link></>}>
      <GoogleAuthSection locale={locale} redirectTo={redirectTo} />
      <AuthForm locale={locale} redirectTo={redirectTo} />
      <div className="mt-4 text-right"><Link href="/forgot-password" className="text-sm text-primary hover:underline">{tr ? 'Şifremi unuttum' : 'Forgot password'}</Link></div>
    </AuthShell>
  );
}
