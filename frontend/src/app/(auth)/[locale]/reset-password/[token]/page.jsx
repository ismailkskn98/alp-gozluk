import AuthShell from '@/components/auth/auth-shell';
import UnavailableForm from '@/components/auth/unavailable-form';

export default async function ResetPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <AuthShell locale={locale} eyebrow={tr ? 'Hesap kurtarma' : 'Account recovery'} title={tr ? 'Yeni şifre belirle.' : 'Choose a new password.'} description={tr ? 'Güçlü ve daha önce kullanmadığın bir şifre seç.' : 'Choose a strong password you have not used before.'}><UnavailableForm locale={locale} type="password" /></AuthShell>;
}
