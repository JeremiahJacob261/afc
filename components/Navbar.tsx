"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import Logo from "@/public/european.ico";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "my", label: "မြန်မာ" },
  { code: "ru", label: "Русский" },
];

export function Navbar() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const navItems = [
    { label: t("landing.nav.markets"), href: "#markets" },
    { label: t("landing.nav.liveBetting"), href: "#live" },
    { label: t("landing.nav.howItWorks"), href: "#how-it-works" },
    { label: t("landing.nav.bonuses"), href: "#bonuses" },
    { label: t("landing.nav.agents"), href: "#agents" },
    { label: t("landing.nav.faq"), href: "#faq" },
  ];

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale, scroll: false });
  };

  return (
    <header className="relative z-50 border-b border-white/10 bg-[#06101F] px-4 py-4 sm:px-8 lg:px-10">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-[1420px] items-center justify-between gap-4"
      >
        <Link
          href="#home"
          className="flex min-h-[44px] items-center gap-2 text-white"
        >
          <Image src={Logo} alt="EFC logo" width={34} height={34} />
          <span className="text-2xl font-black">{t("common.appName")}</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-white/70 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative hidden min-h-[44px] items-center rounded-lg border border-white/[0.14] bg-transparent px-3 text-sm font-bold text-white transition hover:border-white/[0.38] hover:bg-white/[0.08] sm:inline-flex">
            <span className="sr-only">{t("common.changeLanguage")}</span>
            <select
              aria-label={t("common.changeLanguage")}
              value={router.locale || "en"}
              onChange={(event) => changeLanguage(event.target.value)}
              className="min-h-[42px] cursor-pointer appearance-none bg-transparent pr-6 text-sm font-bold text-white outline-none"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-white/70">v</span>
          </label>
          <Link
            href="/login"
            className="hidden min-h-[44px] items-center rounded-lg border border-white/[0.14] px-5 text-sm font-bold text-white transition hover:border-white/[0.38] hover:bg-white/[0.08] sm:inline-flex"
          >
            {t("common.login")}
          </Link>
          <Link
            href="/register/000208"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#1BB6FF] px-5 text-sm font-black text-[#06101F] shadow-[0_14px_34px_rgba(27,182,255,0.22)] transition hover:bg-white"
          >
            {t("common.joinNow")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
