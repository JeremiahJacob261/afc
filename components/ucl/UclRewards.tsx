"use client";

import Link from "next/link";
import { ArrowRight, Gift, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "next-i18next";
import { UclSection } from "./UclSection";

export function UclRewards() {
  const { t } = useTranslation("common");

  const tiers = t("landing.bonuses.tiers", { returnObjects: true }) as Array<{
    members: string;
    reward: string;
  }>;
  const bonuses = t("landing.bonuses.items", { returnObjects: true }) as Array<{
    title: string;
    copy: string;
  }>;
  const rebates = t("landing.agents.rebates", { returnObjects: true }) as Array<{
    level: string;
    rebate: string;
  }>;
  const salaryLevels = t("landing.agents.salaryLevels", { returnObjects: true }) as Array<{
    agent: string;
    teamLevel: string;
    teamVolume: string;
    salary: string;
  }>;

  return (
    <>
      <UclSection
        id="bonuses"
        eyebrow={t("landing.bonuses.eyebrow")}
        title={t("landing.bonuses.title")}
        copy={t("landing.bonuses.copy")}
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ucl-panel-strong ucl-cut overflow-hidden p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Gift className="h-5 w-5 text-magenta-400" aria-hidden="true" />
              <h3 className="text-xl font-black text-white">
                {t("landing.bonuses.title")}
              </h3>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.members}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-silver-500">
                    {t("landing.bonuses.inviteActive", { members: tier.members })}
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {t("landing.bonuses.earnReward", { reward: tier.reward })}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              {bonuses.map((bonus) => (
                <div
                  key={bonus.title}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                >
                  <h4 className="font-black text-white">{bonus.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-silver-400">{bonus.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="ucl-panel ucl-cut p-6">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                <h3 className="text-lg font-black text-white">
                  {t("landing.agents.title")}
                </h3>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {rebates.map((rebate) => (
                  <div
                    key={rebate.level}
                    className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.07] p-4 text-center"
                  >
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-silver-400">
                      {rebate.level}
                    </p>
                    <p className="mt-2 text-2xl font-black tabular-nums text-cyan-300">
                      {rebate.rebate}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ucl-panel ucl-cut overflow-x-auto p-6">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-magenta-400" aria-hidden="true" />
                <h3 className="text-lg font-black text-white">
                  {t("landing.agents.title")}
                </h3>
              </div>

              <table className="mt-5 w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                    <th className="py-3 pr-4 font-black">{t("landing.agents.agent")}</th>
                    <th className="py-3 pr-4 font-black">{t("landing.agents.teamLevel")}</th>
                    <th className="py-3 pr-4 font-black">{t("landing.agents.teamVolume")}</th>
                    <th className="py-3 font-black">{t("landing.agents.salary")}</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryLevels.map((row) => (
                    <tr key={row.agent} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="py-3 pr-4 font-black text-white">{row.agent}</td>
                      <td className="py-3 pr-4 text-silver-400">{row.teamLevel}</td>
                      <td className="py-3 pr-4 font-bold text-silver-200">{row.teamVolume}</td>
                      <td className="py-3 font-black tabular-nums text-cyan-300">{row.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link
              href="/register/000208"
              className="ucl-btn ucl-btn-magenta group"
            >
              {t("landing.bonuses.viewOffers")}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </UclSection>
    </>
  );
}
