import { ArrowRight, CircleCheck, Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = locale === 'tr';

  return (
    <>
      <section className="grid-container min-h-[calc(100svh-4.5rem)] bg-[#e9f2f9]">
        <div className="fluid relative grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10 flex flex-col justify-center px-[8%] py-20 lg:px-[10%]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">ALP / SS 2026</p>
            <h1 className="display-serif mt-5 max-w-xl text-balance text-[clamp(3.8rem,7vw,7.5rem)] leading-[0.84] tracking-[-0.055em]">
              {tr ? 'Bakışını seç.' : 'Choose your perspective.'}
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-foreground/65">
              {tr
                ? 'Günlük ritmine uyum sağlayan, karakterli ve zamansız çerçeveler.'
                : 'Characterful, timeless frames designed around your daily rhythm.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#124887]">
                {tr ? 'Koleksiyonu keşfet' : 'Explore the collection'} <ArrowRight className="size-4" />
              </Link>
              <Link href="/guide" className="inline-flex h-12 items-center rounded-md border border-border-strong bg-white px-6 text-sm font-semibold hover:bg-muted">
                {tr ? 'Çerçeve rehberi' : 'Frame guide'}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[26rem] bg-[#10233d] lg:min-h-0">
            <video
              className="absolute inset-0 size-full object-cover opacity-90"
              src="/media/alp-brand-film.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-label={tr ? 'ALP Gözlük marka filmi' : 'ALP Eyewear brand film'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10233d]/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="grid-container py-20 sm:py-28">
        <div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr ? 'Seçkiler' : 'Editions'}</p>
              <h2 className="display-serif mt-3 text-4xl tracking-[-0.03em] sm:text-5xl">{tr ? 'Tarzına göre keşfet' : 'Discover your style'}</h2>
            </div>
            <Link href="/shop" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">{tr ? 'Tümünü gör' : 'View all'} <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [tr ? 'Güneş gözlükleri' : 'Sunglasses', 'UV koruması, net bir tavır.', 'bg-[#dcecf5]'],
              [tr ? 'Optik çerçeveler' : 'Optical frames', 'Her gün için hafif ve dengeli.', 'bg-[#e9e6df]'],
              [tr ? 'Yeni gelenler' : 'New arrivals', 'Sezonun yeni ALP seçkisi.', 'bg-[#dff2ee]'],
            ].map(([title, copy, tone], index) => (
              <Link key={title} href={index === 2 ? '/new' : '/shop'} className={`group flex min-h-80 flex-col justify-end overflow-hidden rounded-xl p-7 ${tone}`}>
                <div className="mb-auto grid size-14 place-items-center rounded-full bg-white/65">
                  {index === 0 ? <Sparkles /> : index === 1 ? <Gem /> : <CircleCheck />}
                </div>
                <h3 className="display-serif text-3xl">{title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{copy}</p>
                <span className="mt-5 flex items-center gap-2 text-sm font-semibold">{tr ? 'İncele' : 'Explore'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-container bg-white py-16">
        <div className="grid gap-8 border-y border-border py-10 sm:grid-cols-3">
          {[
            [ShieldCheck, tr ? 'Güvenli alışveriş' : 'Secure shopping', tr ? 'Ödeme ve kişisel veriler backend üzerinde doğrulanır.' : 'Payments and personal data are verified on the backend.'],
            [Gem, tr ? 'Özenli seçki' : 'Curated collection', tr ? 'Stil, konfor ve kullanım odağında seçilmiş modeller.' : 'Frames selected for style, comfort and everyday use.'],
            [CircleCheck, tr ? 'Kolay destek' : 'Easy support', tr ? 'Sipariş öncesi ve sonrası ulaşılabilir destek.' : 'Accessible support before and after your order.'],
          ].map(([Icon, title, copy]) => (
            <article key={title} className="flex gap-4">
              <Icon className="mt-1 size-5 shrink-0 text-primary" />
              <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
