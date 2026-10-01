import AuthForm from '@/components/auth/auth-form';
import AuthShell from '@/components/auth/auth-shell';
import GoogleAuthSection from '@/components/auth/google-auth-section';
import { getPathname, Link } from '@/i18n/navigation';

export default async function RegisterPage({ params, searchParams }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const tr = locale === 'tr';
  const checkoutDestination = '/checkout';
  const redirectTo = query?.next === checkoutDestination
    ? getPathname({ href: checkoutDestination, locale })
    : undefined;
  const loginHref = query?.next === checkoutDestination
    ? `/login?next=${encodeURIComponent(checkoutDestination)}`
    : '/login';
  return (
    <AuthShell
      locale={locale}
      eyebrow={tr ? 'Yeni hesap' : 'New account'}
      title={tr ? 'ALP dünyasına katıl.' : 'Join the world of ALP.'}
      description={tr ? 'Siparişlerini takip etmek ve alışverişini hızlandırmak için hesap oluştur.' : 'Create an account to track orders and speed up checkout.'}
      footer={(
        <>
          {tr ? 'Zaten hesabın var mı? ' : 'Already registered? '}
          <Link href={loginHref} className="font-semibold text-primary">
            {tr ? 'Giriş yap' : 'Sign in'}
          </Link>
        </>
      )}
    >
      <GoogleAuthSection locale={locale} mode="register" redirectTo={redirectTo} />
      <AuthForm mode="register" locale={locale} redirectTo={redirectTo} />
    </AuthShell>
  );
}
