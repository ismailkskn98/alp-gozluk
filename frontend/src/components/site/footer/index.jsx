import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import FooterScene from "./footer-scene";
import LanguageSwitcher from "./language-switcher";

export default function SiteFooter({ locale }) {
  const tr = locale === "tr";
  const columns = [
    {
      title: tr ? "Ürünler" : "Products",
      links: [
        [tr ? "Tüm gözlükler" : "All eyewear", "/shop"],
        [tr ? "Güneş gözlükleri" : "Sunglasses", "/category/sunglasses"],
        [tr ? "Optik çerçeveler" : "Optical frames", "/category/optical"],
        [tr ? "Yeni gelenler" : "New arrivals", "/new"],
      ],
    },
    {
      title: tr ? "Rehber" : "Guides",
      links: [
        [tr ? "Gözlük rehberi" : "Eyewear guide", "/guide"],
        [tr ? "Yüz şekline göre seçim" : "Choose by face shape", "/guide"],
        [tr ? "Çerçeve ölçüleri" : "Frame measurements", "/guide"],
        [tr ? "Bakım önerileri" : "Care tips", "/guide"],
      ],
    },
    {
      title: tr ? "Destek" : "Support",
      links: [
        [tr ? "Teslimat ve iade" : "Delivery and returns", "/help"],
        [tr ? "Sipariş desteği" : "Order support", "/help"],
        [tr ? "Sıkça sorulanlar" : "Frequently asked", "/help"],
        [tr ? "Hesabım" : "My account", "/account"],
      ],
    },
    {
      title: "ALP",
      links: [
        [tr ? "Hakkımızda" : "About us", "/about"],
        [tr ? "İletişim" : "Contact", "/help"],
        [tr ? "Gizlilik" : "Privacy", "/legal/privacy"],
        [tr ? "Kullanım koşulları" : "Terms", "/legal/terms"],
      ],
    },
  ];

  return (
    <FooterScene>
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] px-[clamp(1rem,4vw,4rem)] py-[clamp(1.1rem,3.2vh,2.75rem)]">
        <div data-footer-copy className="flex items-center justify-between gap-4 text-[0.65rem] font-medium uppercase tracking-[0.24em] sm:text-xs">
          <p>{tr ? "Yaz / 26 — Işık edisyonu" : "Summer / 26 — The light edition"}</p>
          <Link href="/shop" className="inline-flex items-center gap-2 text-right transition-opacity hover:opacity-70">
            <span className="hidden min-[25rem]:inline">{tr ? "Güneş için tasarlandı" : "Designed for the sun"}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div data-footer-copy className="flex min-h-0 flex-col items-center justify-center text-center">
          <p className="mb-[clamp(0.7rem,1.5vh,1.25rem)] text-[0.62rem] font-medium uppercase tracking-[0.3em] sm:text-xs">ALP / Sun frame</p>
          <h2 className="text-[clamp(3.3rem,11vw,10.5rem)] font-semibold leading-[0.76] tracking-[-0.075em] text-balance">
            {tr ? (
              <>
                GÜNEŞİ
                <br />
                FARKLI GÖR.
              </>
            ) : (
              <>
                SEE THE SUN
                <br />
                DIFFERENTLY.
              </>
            )}
          </h2>
          <p className="mt-[clamp(1rem,2.4vh,2rem)] text-[0.65rem] font-medium uppercase tracking-[0.28em] sm:text-sm">
            {tr ? "Işık değişmez. Bakışın değişir." : "The light stays. Your perspective changes."}
          </p>
          <div data-footer-scroll-cue className="mt-[clamp(1rem,2.8vh,2.5rem)] flex flex-col items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] sm:text-[0.65rem]">
            <span>{tr ? "Kaydır ve gözlüğü tak" : "Scroll to put them on"}</span>
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </div>
        </div>

        <div data-footer-copy className="min-h-0">
          <div className="grid gap-[clamp(1rem,2.4vw,3rem)] border-t border-white/25 pt-[clamp(0.9rem,2.2vh,1.75rem)] md:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)]">
            <div className="hidden md:block">
              <Image src="/brand/logo.png" alt="ALP Gözlük" width={150} height={100} className="h-8 w-auto brightness-0 invert" />
              <p className="mt-3 max-w-xs text-xs leading-5 text-white/72">{tr ? "Işığa cesur bak. Dünyayı kendi gözünden gör." : "Face the light. See the world through your own eyes."}</p>
            </div>

            <nav aria-label={tr ? "Alt menü" : "Footer navigation"} className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-x-7">
              {columns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-white/68 sm:text-[0.65rem]">{column.title}</h3>
                  <ul className="mt-2 space-y-1 text-[0.65rem] leading-4 sm:mt-3 sm:space-y-1.5 sm:text-xs">
                    {column.links.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} className="transition-opacity hover:opacity-60">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-[clamp(0.75rem,1.8vh,1.4rem)] flex items-center justify-between gap-4 border-t border-white/20 pt-[clamp(0.65rem,1.6vh,1.15rem)] text-[0.62rem] text-white/72 sm:text-xs">
            <p>
              © {new Date().getFullYear()} ALP Gözlük. {tr ? "Tüm hakları saklıdır." : "All rights reserved."}
            </p>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <LanguageSwitcher locale={locale} />
              <a href="https://www.instagram.com/alpgozlukofficial/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 transition-opacity hover:opacity-60 sm:inline-flex">
                Instagram
                <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </FooterScene>
  );
}
