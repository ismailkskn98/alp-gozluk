import { getTranslations } from "next-intl/server";
import HeaderActions from "./actions";
import HeaderLogo from "./logo";
import MobileNavbar from "./mobile-navbar";
import Navbar from "./navbar";
import { fetchHeaderNavigation } from "@/data/navigation";
import { buildFallbackNavigation, completeNavigation } from "./menu-data";

export default async function SiteHeader({ locale }) {
  const t = await getTranslations("Navigation");
  const fallbackMenu = buildFallbackNavigation(locale, t);
  const menu = completeNavigation(await fetchHeaderNavigation(locale), fallbackMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/96 backdrop-blur-md">
      <div className="grid-container">
        <div className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="col-start-1 row-start-1 lg:hidden">
            <MobileNavbar items={menu.items} labels={{ open: t("openMenu"), close: t("closeMenu"), navigation: t("mobileMenu"), toggle: t("toggleGroup") }} />
          </div>
          <HeaderLogo locale={locale} label={`ALP Gözlük — ${t("home")}`} />
          <Navbar items={menu.items} labels={{ navigation: t("navigation"), viewAll: t("viewAll") }} />
          <HeaderActions locale={locale} labels={{ search: t("search"), account: t("account"), cart: t("cart"), language: t("language") }} />
        </div>
      </div>
    </header>
  );
}
