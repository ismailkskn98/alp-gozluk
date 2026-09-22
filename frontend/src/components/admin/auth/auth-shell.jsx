import { CheckCircle2, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@/components/admin/ui/theme-toggle';

export default function AdminAuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <main className="admin-canvas-grid grid min-h-svh w-full min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-hidden lg:grid-cols-[minmax(22rem,0.78fr)_minmax(32rem,1.22fr)]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-[#101318] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_15%,#2c6ed0_0,transparent_34%),radial-gradient(circle_at_90%_80%,#16a078_0,transparent_26%)]" />
        <div className="relative"><Link href="/" aria-label="ALP Gözlük ana sayfa"><Image src="/brand/logo.png" alt="ALP Gözlük" width={160} height={62} className="h-12 w-auto brightness-0 invert" priority /></Link></div>
        <div className="relative max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">ALP Command Center</p><p className="mt-5 text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[0.94] tracking-[-0.055em]">Mağazayı sakin, hızlı ve güvenli yönetin.</p><div className="mt-10 grid gap-3 text-sm text-white/65">{['Rol ve izin kontrollü erişim', 'TOTP tabanlı iki faktörlü doğrulama', 'Kritik işlemler için audit log'].map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#62d4a4]" />{item}</p>)}</div></div>
        <p className="relative text-xs text-white/40">Yetkisiz erişim girişimleri kayıt altına alınır.</p>
      </aside>
      <section className="flex min-h-svh min-w-0 flex-col bg-background">
        <header className="flex h-16 min-w-0 items-center justify-between border-b border-border px-5 sm:px-8"><Link href="/" className="flex min-w-0 items-center gap-2 text-xs font-semibold lg:hidden"><ShieldCheck className="size-4 shrink-0 text-primary" /><span className="truncate">ALP Yönetim</span></Link><span className="hidden text-xs text-muted-foreground lg:block">Güvenli yönetim erişimi</span><ThemeToggle /></header>
        <div className="grid min-w-0 flex-1 place-items-center px-5 py-10 sm:px-8"><div className="min-w-0 w-full max-w-[30rem]"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.05em]">{title}</h1><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-8 min-w-0">{children}</div>{footer ? <div className="mt-8 min-w-0 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">{footer}</div> : null}</div></div>
      </section>
    </main>
  );
}
