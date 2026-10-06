"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CircleDollarSign, Clock3, Goal, Trophy } from "lucide-react";
import { useTranslation } from "next-i18next";
import { UclSection } from "./UclSection";

const marketIcons = [Trophy, Goal, BarChart3, CircleDollarSign, Clock3];

export function UclMarkets() {
  const { t } = useTranslation("common");

  const markets = t("landing.markets.items", { returnObjects: true }) as Array<{
    title: string;
    label: string;
    copy: string;
    odds: string;
  }>;

  return (
    <UclSection
      id="markets"
      eyebrow={t("landing.markets.eyebrow")}
      title={t("landing.markets.title")}
      copy={t("landing.markets.copy")}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {markets.map((market, index) => {
          const Icon = marketIcons[index] || Trophy;

          return (
            <div
              key={market.title}
              className="ucl-panel ucl-cut group flex min-h-[260px] flex-col justify-between p-5 transition hover:border-white/25"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-black tabular-nums text-white">
                    {market.odds}
                  </span>
                </div>

                <p className="mt-5 text-[0.6875rem] font-black uppercase tracking-[0.14em] text-cyan-300">
                  {market.label}
                </p>
                <h3 className="mt-2 text-xl font-black text-white">{market.title}</h3>
                <p className="mt-3 text-sm leading-6 text-silver-400">{market.copy}</p>
              </div>

              <Link
                href="/register/000208"
                className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-300 transition group-hover:gap-3"
              >
                {t("landing.markets.pickMarket")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </UclSection>
  );
}
