import Link from 'next/link';
import AdminAuthShell from '@/components/admin/auth/auth-shell';
import ForgotPasswordForm from '@/components/admin/auth/forgot-password-form';

export default function AdminForgotPasswordPage() {
  return <AdminAuthShell eyebrow="Hesap kurtarma" title="Şifrenizi yenileyin." description="Hesabınız sistemde bulunuyorsa, kısa süre geçerli güvenli bir yenileme bağlantısı gönderilecektir." footer={<Link href="/admin/login" className="font-medium text-foreground hover:text-primary">← Güvenli girişe dön</Link>}><ForgotPasswordForm /></AdminAuthShell>;
}
