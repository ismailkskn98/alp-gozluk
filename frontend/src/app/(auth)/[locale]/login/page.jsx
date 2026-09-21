import AuthForm from '@/components/auth/auth-form';
import AuthShell from '@/components/auth/auth-shell';
import GoogleAuthSection from '@/components/auth/google-auth-section';
import { Link } from '@/i18n/navigation';

export default async function LoginPage({ params }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  return (
    <AuthShell locale={locale} eyebrow={tr ? 'Hesabım' : 'My account'} title={tr ? 'Tekrar hoş geldin.' : 'Welcome back.'} description={tr ? 'Siparişlerini ve adreslerini yönetmek için giriş yap.' : 'Sign in to manage your orders and addresses.'} footer={<>{tr ? 'Hesabın yok mu? ' : 'No account? '}<Link href="/register" className="font-semibold text-primary">{tr ? 'Hesap oluştur' : 'Create account'}</Link></>}>
      <GoogleAuthSection locale={locale} />
      <AuthForm locale={locale} />
      <div className="mt-4 text-right"><Link href="/forgot-password" className="text-sm text-primary hover:underline">{tr ? 'Şifremi unuttum' : 'Forgot password'}</Link></div>
    </AuthShell>
  );
}
