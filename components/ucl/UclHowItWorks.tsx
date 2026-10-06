"use client";

import { Radio, WalletCards } from "lucide-react";
import { useTranslation } from "next-i18next";
import { UclSection } from "./UclSection";
import { AccentRule, Hairline } from "./Decor";

export function UclHowItWorks() {
  const { t } = useTranslation("common");

  const steps = t("landing.howItWorks.steps", { returnObjects: true }) as Array<{
    title: string;
    copy: string;
  }>;

  const liveMetrics = [t("landing.live.shots"), t("landing.live.corners"), t("landing.live.cards")];
  const metricValues = ["12", "7", "3"];

  return (
    <>
      <UclSection
        id="how-it-works"
        eyebrow={t("landing.howItWorks.eyebrow")}
        title={t("landing.howItWorks.title")}
        copy={t("landing.howItWorks.copy")}
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="ucl-panel ucl-cut relative p-6">
              <span className="ucl-silver text-4xl font-black tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-black text-white">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-silver-400">{step.copy}</p>
            </li>
          ))}
        </ol>
      </UclSection>

      <UclSection
        id="live"
        eyebrow={t("landing.live.eyebrow")}
        title={t("landing.live.title")}
        copy={t("landing.live.copy")}
      >
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="ucl-panel-strong ucl-cut relative overflow-hidden p-6 sm:p-8">
            <AccentRule className="absolute inset-x-0 top-0" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ucl-eyebrow">{t("landing.live.board")}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-white">
                  {t("landing.live.boardTitle")}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-magenta-400/35 bg-magenta-500/12 px-3 py-1 text-[0.6875rem] font-black uppercase tracking-[0.1em] text-magenta-300">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                {t("landing.hero.boardStatus")}
              </span>
            </div>

            <Hairline className="my-6" />

            <div className="grid grid-cols-3 gap-3">
              {liveMetrics.map((label, index) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-silver-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-white">
                    {metricValues[index]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-silver-500">
              <WalletCards className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              {t("landing.hero.boardFootnote")}
            </div>
          </div>

          <ul className="grid content-start gap-3">
            {(
              t("landing.live.matches", { returnObjects: true }) as Array<{
                fixture: string;
                market: string;
                price: string;
                status: string;
              }>
            ).map((match) => (
              <li
                key={match.fixture}
                className="ucl-panel ucl-cut flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-black text-white">{match.fixture}</h3>
                  <p className="mt-1 text-sm text-silver-400">{match.market}</p>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[0.6875rem] font-black uppercase tracking-[0.08em] text-cyan-300">
                    {match.status}
                  </span>
                  <div className="text-right">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-silver-500">
                      {t("landing.live.odds")}
                    </p>
                    <p className="text-xl font-black tabular-nums text-white">{match.price}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </UclSection>
    </>
  );
}
