import AuthShell from '@/components/auth/auth-shell';

export default async function VerifyPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <AuthShell locale={locale} eyebrow={tr ? 'E-posta doğrulama' : 'Email verification'} title={tr ? 'Gelen kutunu kontrol et.' : 'Check your inbox.'} description={tr ? 'Hesabını etkinleştirmek için gönderdiğimiz doğrulama bağlantısını aç.' : 'Open the verification link we sent to activate your account.'}><p className="rounded-md bg-accent-soft p-4 text-sm leading-6">{tr ? 'E-posta gönderim sağlayıcısı bağlandığında bu akış etkinleşecektir.' : 'This flow will be enabled when the email provider is connected.'}</p></AuthShell>;
}
