import { getTranslations } from "next-intl/server";
import HeaderActions from "./actions";
import HeaderLogo from "./logo";
import MobileNavbar from "./mobile-navbar";
import Navbar from "./navbar";
import { fetchHeaderNavigation } from "@/data/navigation";
import { buildFallbackNavigation, completeNavigation } from "./menu-data";
import { getSessionUser } from "@/lib/server-api";

export default async function SiteHeader({ locale }) {
  const [t, remoteMenu, user] = await Promise.all([getTranslations("Navigation"), fetchHeaderNavigation(locale), getSessionUser()]);
  const fallbackMenu = buildFallbackNavigation(locale, t);
  const menu = completeNavigation(remoteMenu, fallbackMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
      <div className="grid-container">
        <div className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-0 lg:gap-3">
          <div className="col-start-1 row-start-1 lg:hidden">
            <MobileNavbar items={menu.items} labels={{ open: t("openMenu"), close: t("closeMenu"), navigation: t("mobileMenu"), toggle: t("toggleGroup") }} />
          </div>
          <HeaderLogo label={`ALP Gözlük — ${t("home")}`} />
          <Navbar items={menu.items} labels={{ navigation: t("navigation"), viewAll: t("viewAll") }} />
          <HeaderActions
            authenticated={Boolean(user)}
            locale={locale}
            navigationItems={menu.items}
            labels={{ search: t("search"), account: t("account"), cart: t("cart"), language: t("language") }}
          />
        </div>
      </div>
    </header>
  );
}
