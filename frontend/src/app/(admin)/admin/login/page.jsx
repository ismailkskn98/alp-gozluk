import Image from "next/image";
import AuthForm from "@/components/auth/auth-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f3f6f9] px-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-white p-7 shadow-[0_12px_40px_rgba(16,35,61,0.08)] sm:p-9">
        <Image src="/brand/logo.png" alt="ALP Gözlük" width={160} height={62} className="h-12 w-auto object-contain" priority />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Yönetim paneli</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Güvenli giriş</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Yetkili hesabınızla devam edin. Erişim rol ve izinlerle backend üzerinde denetlenir.</p>
        <div className="mt-7">
          <AuthForm admin locale="tr" />
        </div>
      </section>
    </main>
  );
}
