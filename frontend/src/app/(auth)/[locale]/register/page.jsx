import AuthForm from '@/components/auth/auth-form';
import AuthShell from '@/components/auth/auth-shell';
import { Link } from '@/i18n/navigation';

export default async function RegisterPage({ params }) {
  const { locale } = await params;
  const tr = locale === 'tr';
  return <AuthShell locale={locale} eyebrow={tr ? 'Yeni hesap' : 'New account'} title={tr ? 'ALP dünyasına katıl.' : 'Join the world of ALP.'} description={tr ? 'Siparişlerini takip etmek ve alışverişini hızlandırmak için hesap oluştur.' : 'Create an account to track orders and speed up checkout.'} footer={<>{tr ? 'Zaten hesabın var mı? ' : 'Already registered? '}<Link href="/login" className="font-semibold text-primary">{tr ? 'Giriş yap' : 'Sign in'}</Link></>}><AuthForm mode="register" locale={locale} /></AuthShell>;
}
