"use client";

import { CircleCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import AuthForm from "@/components/auth/auth-form";
import GoogleAuthSection from "@/components/auth/google-auth-section";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { Link } from "@/i18n/navigation";

export default function AccountAction({ authenticated, locale, label }) {
  const t = useTranslations("Auth");
  const [open, setOpen] = useState(false);

  if (authenticated) {
    return (
      <Link href="/account" aria-label={label} className="inline-flex h-11 items-center gap-2 px-2.5 text-[0.75rem] font-medium text-[#172536] transition-colors hover:bg-[#f4f5f6]">
        <UserRound className="size-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button type="button" aria-label={t("login")} className="inline-flex h-11 items-center gap-2 px-2.5 text-[0.75rem] font-medium text-[#172536] transition-colors hover:bg-[#f4f5f6]">
          <UserRound className="size-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{t("login")}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={t("close")} className="w-full gap-0 border-l border-border bg-white shadow-none sm:w-[min(32rem,100vw)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <SheetHeader className="border-b border-border px-6 pb-6 pt-16 sm:px-9 sm:pb-8 sm:pt-20">
            <p className="text-sm text-muted-foreground">ALP Gözlük</p>
            <SheetTitle className="max-w-sm text-[clamp(2.25rem,7vw,3.75rem)] font-light leading-[0.94] tracking-[-0.045em]">{t("sheetLoginTitle")}</SheetTitle>
            <SheetDescription className="max-w-md pt-2 text-sm leading-6">{t("sheetLoginDescription")}</SheetDescription>
          </SheetHeader>

          <div className="px-6 py-7 sm:px-9 sm:py-9">
            <GoogleAuthSection locale={locale} redirectOnSuccess={false} onSuccess={() => handleOpenChange(false)} />
            <AuthForm locale={locale} appearance="sheet" idPrefix="account-sheet-login" redirectOnSuccess={false} onSuccess={() => handleOpenChange(false)} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
              <Link href="/forgot-password" onClick={() => handleOpenChange(false)} className="border-b border-foreground pb-0.5">
                {t("forgotPassword")}
              </Link>
              <p className="text-muted-foreground">
                {t("noAccount")}{" "}
                <Link href="/register" onClick={() => handleOpenChange(false)} className="font-semibold text-foreground underline-offset-4 hover:underline">
                  {t("register")}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-border bg-[#f7f7f4] px-6 py-6 sm:px-9">
            {[t("benefitOrders"), t("benefitCheckout"), t("benefitFavorites")].map((benefit) => (
              <p key={benefit} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-success" />
                {benefit}
              </p>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
