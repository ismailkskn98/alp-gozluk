import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function SiteFooter({ locale }) {
  const tr = locale === 'tr';
  const columns = [
    {
      title: tr ? 'Ürünler' : 'Products',
      links: [[tr ? 'Tüm gözlükler' : 'All eyewear', '/shop'], [tr ? 'Güneş gözlükleri' : 'Sunglasses', '/category/sunglasses'], [tr ? 'Optik çerçeveler' : 'Optical frames', '/category/optical'], [tr ? 'Yeni gelenler' : 'New arrivals', '/new']],
    },
    {
      title: tr ? 'Rehber' : 'Guides',
      links: [[tr ? 'Gözlük rehberi' : 'Eyewear guide', '/guide'], [tr ? 'Yüz şekline göre seçim' : 'Choose by face shape', '/guide'], [tr ? 'Çerçeve ölçüleri' : 'Frame measurements', '/guide'], [tr ? 'Bakım önerileri' : 'Care tips', '/guide']],
    },
    {
      title: tr ? 'Destek' : 'Support',
      links: [[tr ? 'Teslimat ve iade' : 'Delivery and returns', '/help'], [tr ? 'Sipariş desteği' : 'Order support', '/help'], [tr ? 'Sıkça sorulanlar' : 'Frequently asked', '/help'], [tr ? 'Hesabım' : 'My account', '/account']],
    },
    {
      title: 'ALP',
      links: [[tr ? 'Hakkımızda' : 'About us', '/about'], [tr ? 'İletişim' : 'Contact', '/help'], [tr ? 'Gizlilik' : 'Privacy', '/legal/privacy'], [tr ? 'Kullanım koşulları' : 'Terms', '/legal/terms']],
    },
  ];

  return (
    <footer className="border-t border-black/10 bg-[#f3f3f1] text-[#232323]">
      <div className="grid-container">
        <div className="grid gap-[clamp(3.5rem,7vw,7rem)] py-[clamp(4rem,7vw,7rem)] lg:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]">
          <div className="flex flex-col items-start">
            <Image src="/brand/logo.png" alt="ALP Gözlük" width={150} height={100} className="h-10 w-auto object-contain" />
            <p className="mt-8 max-w-md text-[clamp(2rem,3.25vw,3.75rem)] font-normal leading-[0.98] tracking-[-0.045em]">
              {tr ? 'Bakışına uyan çerçeveyi bul.' : 'Find the frame that fits your perspective.'}
            </p>
            <p className="mt-7 max-w-sm text-sm leading-6 text-black/58">
              {tr ? 'Yeni modelleri, stil notlarını ve mağaza duyurularını sosyal hesaplarımızdan takip edin.' : 'Follow new frames, styling notes and store updates on our social channels.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href="https://www.instagram.com/alpgozlukofficial/" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 border border-black/15 px-4 text-sm transition-colors hover:border-black hover:bg-black hover:text-white">
                Instagram
                <ArrowUpRight className="size-3.5" />
              </a>
              <a href="https://www.facebook.com/people/Alp-G%C3%B6zl%C3%BCk/61594147804711/" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 border border-black/15 px-4 text-sm transition-colors hover:border-black hover:bg-black hover:text-white">
                Facebook
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>

          <nav aria-label={tr ? 'Alt menü' : 'Footer navigation'} className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-medium text-black/48">{column.title}</h2>
                <ul className="mt-6 space-y-3.5 text-sm">
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="transition-opacity hover:opacity-55">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 border-t border-black/10 py-6 text-xs text-black/48 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ALP Gözlük. {tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</p>
          <Link href="/shop" className="inline-flex items-center gap-2 text-[#232323]">
            {tr ? 'Koleksiyonu keşfet' : 'Explore the collection'}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
