import { getTranslations } from "next-intl/server";
import HeaderActions from "./actions";
import HeaderLogo from "./logo";
import MobileNavbar from "./mobile-navbar";
import Navbar from "./navbar";

export default async function SiteHeader({ locale }) {
  const t = await getTranslations("Navigation");
  const items = [
    { href: "/shop", label: t("shop") },
    { href: "/new", label: t("new") },
    { href: "/guide", label: t("guide") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/96 backdrop-blur-md">
      <div className="grid-container">
        <div className="relative grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="col-start-1 row-start-1 md:hidden">
            <MobileNavbar items={items} labels={{ open: t("openMenu"), close: t("closeMenu"), navigation: t("mobileMenu") }} />
          </div>
          <HeaderLogo locale={locale} label={`ALP Gözlük — ${t("home")}`} />
          <Navbar items={items} label={t("navigation")} />
          <HeaderActions locale={locale} labels={{ search: t("search"), account: t("account"), cart: t("cart"), language: t("language") }} />
        </div>
      </div>
    </header>
  );
}
