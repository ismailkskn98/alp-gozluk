import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export default function AuthShell({ locale, eyebrow, title, description, children, footer }) {
  return (
    <main className="grid min-h-svh bg-white lg:grid-cols-[0.85fr_1.15fr]">
      <section className="flex flex-col px-[8%] py-8 sm:px-[12%] lg:px-[14%]">
        <Link href="/" locale={locale} aria-label="ALP Gözlük ana sayfa">
          <Image src="/brand/logo.png" alt="ALP Gözlük" width={170} height={66} className="h-12 w-auto object-contain" priority />
        </Link>
        <div className="my-auto py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="display-serif mt-3 text-balance text-5xl leading-[0.95]">{title}</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8 max-w-md">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-[#10233d] lg:block" aria-hidden="true">
        <video className="absolute inset-0 size-full object-cover opacity-75" src="/media/alp-brand-film.mp4" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10233d]/70 to-transparent" />
        <p className="display-serif absolute bottom-12 left-12 max-w-lg text-5xl leading-none text-white">See the world in your own way.</p>
      </aside>
    </main>
  );
}
