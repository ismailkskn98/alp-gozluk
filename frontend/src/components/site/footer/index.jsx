import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export default function SiteFooter({ locale }) {
  const isTurkish = locale === 'tr';
  const columns = [
    {
      title: isTurkish ? 'Alışveriş' : 'Shop',
      links: [
        [isTurkish ? 'Tüm ürünler' : 'All products', '/shop'],
        [isTurkish ? 'Yeni gelenler' : 'New arrivals', '/new'],
        [isTurkish ? 'Koleksiyonlar' : 'Collections', '/shop'],
      ],
    },
    {
      title: isTurkish ? 'Yardım' : 'Help',
      links: [
        [isTurkish ? 'Gözlük rehberi' : 'Eyewear guide', '/guide'],
        [isTurkish ? 'Teslimat ve iade' : 'Delivery and returns', '/help'],
        [isTurkish ? 'İletişim' : 'Contact', '/help'],
      ],
    },
    {
      title: 'ALP',
      links: [
        [isTurkish ? 'Hakkımızda' : 'About', '/about'],
        [isTurkish ? 'Gizlilik' : 'Privacy', '/legal/privacy'],
        [isTurkish ? 'Kullanım koşulları' : 'Terms', '/legal/terms'],
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-[#0d2138] text-white">
      <div className="grid-container">
        <div className="grid gap-12 py-16 md:grid-cols-[1.35fr_2fr]">
          <div>
            <Image src="/brand/logo.png" alt="ALP Gözlük" width={190} height={74} className="h-14 w-auto rounded bg-white object-contain" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              {isTurkish
                ? 'Bakışına karakter katan, özenle seçilmiş güneş gözlüğü ve optik çerçeveler.'
                : 'Carefully selected sunglasses and optical frames that add character to your look.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{column.title}</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {column.links.map(([label, href]) => (
                    <li key={label}><Link href={href} className="text-white/75 hover:text-white">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ALP Gözlük. {isTurkish ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</p>
          <div className="flex gap-3">
            <a href="https://www.instagram.com/alpgozlukofficial/" target="_blank" rel="noreferrer" aria-label="Instagram" className="font-semibold">IG</a>
            <a href="https://www.facebook.com/people/Alp-G%C3%B6zl%C3%BCk/61594147804711/" target="_blank" rel="noreferrer" aria-label="Facebook" className="font-semibold">FB</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
