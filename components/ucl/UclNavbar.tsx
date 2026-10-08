"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import Logo from "@/public/champions-league-logo.png";
import { Star } from "./Starball";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
];

export function UclNavbar() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const navItems = [
    { label: t("landing.nav.markets"), href: "#markets" },
    { label: t("landing.nav.liveBetting"), href: "#live" },
    { label: t("landing.nav.howItWorks"), href: "#how-it-works" },
    { label: t("landing.nav.bonuses"), href: "#bonuses" },
    { label: t("landing.nav.agents"), href: "#agents" },
    { label: t("landing.nav.faq"), href: "#trust" },
  ];

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale, scroll: false });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#000A1E]/85 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex min-h-[72px] max-w-[1420px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-10"
      >
        <Link href="#home" className="flex min-h-[44px] items-center gap-2.5">
          <Star className="h-4 w-4 shrink-0 text-cyan-300" />
          <Image src={Logo} alt="" width={30} height={30} aria-hidden="true" />
          <span className="text-xl font-black uppercase tracking-[0.2em] text-white">
            {t("common.appName")}
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-silver-300 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative hidden min-h-[44px] items-center rounded-lg border border-white/15 px-3 transition hover:border-white/35 sm:inline-flex">
            <span className="sr-only">{t("common.changeLanguage")}</span>
            <select
              aria-label={t("common.changeLanguage")}
              value={router.locale || "en"}
              onChange={(event) => changeLanguage(event.target.value)}
              className="min-h-[42px] cursor-pointer appearance-none bg-transparent pr-5 text-sm font-bold text-silver-200 outline-none"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 text-[0.6rem] text-silver-400"
              aria-hidden="true"
            >
              ▼
            </span>
          </label>

          <Link
            href="/login"
            className="hidden min-h-[44px] items-center rounded-lg border border-white/15 px-5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10 sm:inline-flex"
          >
            {t("common.login")}
          </Link>

          <Link
            href="/register/000208"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-ucl-ribbon px-5 text-sm font-black uppercase tracking-[0.08em] text-[#000A1E] shadow-ucl-cyan transition hover:brightness-110"
          >
            {t("common.joinNow")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
