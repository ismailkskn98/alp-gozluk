"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getPathname } from "@/i18n/navigation";

export default function AccountLogout({ locale }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(getPathname({ href: "/", locale }));
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="group ml-0.5 flex h-8 w-full items-center gap-2 border-0 bg-transparent py-1 pl-5 pr-2.5 text-[#68736f] transition-colors duration-200 hover:text-[#172536] focus-visible:outline-none"
      style={{ fontSize: '14px', fontWeight: 400, lineHeight: '20px', appearance: 'none' }}
    >
      <LogOut className="shrink-0 transition-colors group-hover:text-[#172536]" style={{ width: '16px', height: '16px' }} strokeWidth={1.5} />
      {locale === "tr" ? "Çıkış yap" : "Sign out"}
    </button>
  );
}
