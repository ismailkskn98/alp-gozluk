import Link from 'next/link';
import AdminAuthShell from '@/components/admin/auth/auth-shell';
import ResetPasswordForm from '@/components/admin/auth/reset-password-form';

export default function AdminResetPasswordPage() {
  return <AdminAuthShell eyebrow="Yeni parola" title="Güçlü bir şifre belirleyin." description="Bağlantı tek kullanımlıktır. Parolanızı başka bir hesapta kullandığınız şifrelerden farklı seçin." footer={<Link href="/admin/login" className="font-medium text-foreground hover:text-primary">← Güvenli girişe dön</Link>}><ResetPasswordForm /></AdminAuthShell>;
}
