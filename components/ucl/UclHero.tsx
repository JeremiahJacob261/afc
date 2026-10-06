"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useTranslation } from "next-i18next";
import { Star, Starball } from "./Starball";
import { Hairline, Starfield } from "./Decor";

/**
 * The correct-score grid the product actually sells, shown as the hero visual.
 * Four by four plus "Other" — the same seventeen markets the bet screen offers.
 */
const SAMPLE_MARKETS: Array<[string, string]> = [
  ["0 - 0", "145"],
  ["1 - 0", "78"],
  ["0 - 1", "82"],
  ["1 - 1", "62"],
  ["2 - 0", "96"],
  ["0 - 2", "101"],
  ["2 - 1", "74"],
  ["1 - 2", "76"],
  ["2 - 2", "58"],
  ["3 - 0", "215"],
  ["0 - 3", "222"],
  ["3 - 1", "150"],
  ["1 - 3", "155"],
  ["3 - 2", "148"],
  ["2 - 3", "146"],
  ["3 - 3", "310"],
];

export function UclHero() {
  const { t } = useTranslation("common");

  const stats = [
    { label: t("landing.hero.stats.marketsLabel"), value: t("landing.hero.stats.marketsValue") },
    { label: t("landing.hero.stats.safetyLabel"), value: t("landing.hero.stats.safetyValue") },
    { label: t("landing.hero.stats.focusLabel"), value: t("landing.hero.stats.focusValue") },
  ];

  const assurances = [
    { icon: WalletCards, title: t("landing.hero.secureDeposits"), copy: t("landing.hero.secureDepositsCopy") },
    { icon: ShieldCheck, title: t("landing.hero.responsiblePlay"), copy: t("landing.hero.responsiblePlayCopy") },
  ];

  return (
    <section id="home" className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-8 lg:px-10 lg:pb-32 lg:pt-24">
      <Starfield />
      <div className="ucl-rays" aria-hidden="true" />

      {/* Watermark starball — the poster element the type sits against. */}
      <Starball
        className="pointer-events-none absolute -right-40 top-[-6rem] hidden h-[46rem] w-[46rem] opacity-[0.22] lg:block"
        tilt={18}
        density={0.16}
      />

      <div className="ucl-content mx-auto grid max-w-[1420px] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ── Copy ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3">
            <Star className="h-4 w-4 shrink-0 text-cyan-300" />
            <p className="ucl-eyebrow">{t("common.brandFull")}</p>
          </div>

          <h1 className="mt-8 text-[3.25rem] font-black uppercase leading-[0.86] tracking-[-0.045em] sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
            <span className="ucl-silver block">{t("landing.hero.titleLine1")}</span>
            <span className="ucl-ribbon block">{t("landing.hero.titleLine2")}</span>
          </h1>

          <div className="mt-8 flex items-center gap-4">
            <span className="h-px w-16 bg-ucl-ribbon" aria-hidden="true" />
            <span className="h-2 w-2 rotate-45 bg-magenta-400" aria-hidden="true" />
            <span className="h-px w-24 bg-white/20" aria-hidden="true" />
          </div>

          <p className="mt-7 max-w-xl text-base leading-7 text-silver-300 sm:text-lg">
            {t("landing.hero.copy")}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register/000208" className="ucl-btn ucl-btn-primary group">
              {t("landing.hero.createAccount")}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link href="/login" className="ucl-btn ucl-btn-ghost">
              {t("common.login")}
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="border-l border-white/12 pl-4">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-silver-500">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 text-sm font-black text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Product visual ───────────────────────────────────────────── */}
        <div className="relative">
          <Starball
            className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 opacity-40 blur-[1px] lg:-right-24 lg:-top-32 lg:h-[26rem] lg:w-[26rem]"
            tilt={-8}
            density={0.2}
          />

          <div className="ucl-panel-strong ucl-cut relative overflow-hidden bg-[#001240]/85 p-5 backdrop-blur-xl sm:p-7">
            <div className="ucl-cut-rule absolute inset-x-0 top-0" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="ucl-eyebrow">{t("landing.hero.boardEyebrow")}</p>
                <h2 className="mt-2 text-lg font-black uppercase tracking-[0.04em] text-white sm:text-xl">
                  {t("landing.hero.boardTitle")}
                </h2>
              </div>
              <span className="ucl-chip ucl-cut-sm">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                {t("landing.hero.boardStatus")}
              </span>
            </div>

            <p className="relative mt-3 text-center text-sm font-black text-silver-200">
              {t("landing.hero.boardFixture")}
            </p>

            <Hairline className="my-4" />

            <div className="relative grid grid-cols-4 gap-2">
              {SAMPLE_MARKETS.map(([score, odds], index) => (
                <div
                  key={score}
                  className={`ucl-cut-sm px-1.5 py-2.5 text-center transition ${
                    index === 3
                      ? "bg-cyan-400/15 shadow-[inset_0_0_0_1px_rgba(41,224,255,0.55)]"
                      : "bg-white/[0.04] hover:bg-white/[0.09]"
                  }`}
                >
                  <p className="text-[0.6875rem] font-bold text-silver-400">{score}</p>
                  <p
                    className={`mt-0.5 text-sm font-black tabular-nums ${
                      index === 3 ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {odds}
                  </p>
                </div>
              ))}

              <div className="col-span-4 ucl-cut-sm bg-white/[0.04] px-1.5 py-2.5 text-center">
                <p className="text-[0.6875rem] font-bold text-silver-400">
                  {t("mobile.markets.other")}
                </p>
              </div>
            </div>

            <p className="relative mt-4 text-center text-[0.6875rem] leading-4 text-silver-500">
              {t("landing.hero.boardFootnote")}
            </p>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            {assurances.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="ucl-panel ucl-cut-sm p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    <span className="text-sm font-black text-white">{item.title}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-silver-400">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
