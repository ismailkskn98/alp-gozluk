import AdminLoginForm from "@/components/admin/auth";
import AdminAuthShell from '@/components/admin/auth/auth-shell';

export default function AdminLoginPage() {
  return (
    <AdminAuthShell eyebrow="Yönetim paneli" title="Tekrar hoş geldiniz." description="Yetkili hesabınızla devam edin. Erişim rol, izin ve iki faktörlü doğrulama ile backend üzerinde denetlenir." footer="Yalnız size atanmış yönetici hesabını kullanın. Şüpheli bir erişim fark ederseniz süper yöneticiye bildirin."><AdminLoginForm /></AdminAuthShell>
  );
}
