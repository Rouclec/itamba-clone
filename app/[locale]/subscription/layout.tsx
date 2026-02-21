"use client";

import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/app/i18n/client";
import { ArrowLeft } from "lucide-react";
import { MdLanguage } from "react-icons/md";
import i18next from "@/app/i18n/i18next";
import { LocaleLink } from "@/components/locale-link";

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { t, i18n } = useT("translation");
  const locale = (i18n.language ?? "en") as string;

  const switchLocale = () => {
    const newLocale = locale === "en" ? "fr" : "en";
    const newPath = pathname.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    const search = searchParams.toString();
    i18next.changeLanguage(newLocale);
    router.push(search ? `${newPath}?${search}` : newPath);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 lg:px-20">
        <LocaleLink href="/client" className="flex items-center gap-2">
          <div className="relative h-11 w-12 shrink-0">
            <Image
              src="/assets/logo.png"
              alt="Itamba"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <div className="font-extrabold leading-none text-2xl text-primary">
              Itamba
            </div>
            <div className="text-xs leading-tight text-[#9A33FD]">
              {t("signupLayout.legalLibrary")}
            </div>
          </div>
        </LocaleLink>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={switchLocale}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm uppercase text-[#64748B] hover:bg-hover hover:text-foreground"
            aria-label={
              locale === "fr" ? "Switch to English" : "Switch to French"
            }
          >
            <MdLanguage className="size-4" />
            <span>{locale === "fr" ? "FR" : "EN"}</span>
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors shrink-0"
            aria-label={t("common.back")}
          >
            <div className="w-8 h-8 bg-[#F0F0F0] rounded-sm flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-semibold">{t("common.back")}</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1">{children}</main>

      <footer className="shrink-0 border-t border-border py-4 text-center text-lg font-normal text-body-text">
        {t("payment.havingIssues")}{" "}
        <a
          href="https://itamba.net/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="text-tertiary underline"
        >
          {t("common.contactUs")}
        </a>
      </footer>
    </div>
  );
}
