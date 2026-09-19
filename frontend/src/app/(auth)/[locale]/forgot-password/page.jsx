import AuthShell from '@/components/auth/auth-shell';
import UnavailableForm from '@/components/auth/unavailable-form';

export default async function ForgotPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <AuthShell locale={locale} eyebrow={tr ? 'Hesap kurtarma' : 'Account recovery'} title={tr ? 'Şifreni yenile.' : 'Reset your password.'} description={tr ? 'Kayıtlı e-posta adresine tek kullanımlık bağlantı gönderilecek.' : 'A one-time link will be sent to your registered email.'}><UnavailableForm locale={locale} /></AuthShell>;
}
