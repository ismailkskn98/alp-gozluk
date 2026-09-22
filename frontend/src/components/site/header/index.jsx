import { getTranslations } from "next-intl/server";
import HeaderActions from "./actions";
import HeaderLogo from "./logo";
import MobileNavbar from "./mobile-navbar";
import Navbar from "./navbar";
import { fetchHeaderNavigation } from "@/data/navigation";
import { buildFallbackNavigation, completeNavigation } from "./menu-data";
import { getSessionUser } from "@/lib/server-api";
import { fetchAnnouncements } from "@/data/announcements";
import AnnouncementBar from "./announcement-bar";

export default async function SiteHeader({ locale }) {
  const [t, remoteMenu, user, announcements] = await Promise.all([
    getTranslations("Navigation"),
    fetchHeaderNavigation(locale),
    getSessionUser(),
    fetchAnnouncements(locale),
  ]);
  const fallbackMenu = buildFallbackNavigation(locale, t);
  const menu = completeNavigation(remoteMenu, fallbackMenu);

  return (
    <header className="sticky top-0 z-40 bg-white">
      <AnnouncementBar announcements={announcements} locale={locale} />
      <div className="border-b border-black/10">
        <div className="grid-container">
          <div className="relative grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-0 lg:h-[3.75rem] lg:gap-3">
          <div className="col-start-1 row-start-1 lg:hidden">
            <MobileNavbar items={menu.items} labels={{ open: t("openMenu"), close: t("closeMenu"), navigation: t("mobileMenu"), toggle: t("toggleGroup") }} />
          </div>
          <HeaderLogo label={`ALP Gözlük — ${t("home")}`} />
          <Navbar items={menu.items} labels={{ navigation: t("navigation"), viewAll: t("viewAll") }} />
          <HeaderActions authenticated={Boolean(user)} locale={locale} navigationItems={menu.items} labels={{ search: t("search"), account: t("account"), cart: t("cart"), language: t("language") }} />
          </div>
        </div>
      </div>
    </header>
  );
}
