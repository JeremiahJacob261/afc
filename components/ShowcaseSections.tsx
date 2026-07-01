import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gift,
  Radio,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { Button } from "./Button";
import { ChartLine } from "./ChartLine";
import { Section } from "./Section";
import bfc2 from "@/public/bfc2.jpg";
import bfc3 from "@/public/bfc3.jpg";
import bfc5 from "@/public/bfc5.jpg";

export function ShowcaseSections() {
  const { t } = useTranslation("common");
  const liveMatches = t("landing.live.matches", { returnObjects: true }) as Array<{
    fixture: string;
    market: string;
    price: string;
    status: string;
  }>;
  const invitationTiers = t("landing.bonuses.tiers", { returnObjects: true }) as Array<{
    members: string;
    reward: string;
  }>;
  const bonuses = t("landing.bonuses.items", { returnObjects: true }) as Array<{
    title: string;
    copy: string;
  }>;
  const agentRebates = t("landing.agents.rebates", { returnObjects: true }) as Array<{
    level: string;
    rebate: string;
  }>;
  const agentSalaryLevels = t("landing.agents.salaryLevels", { returnObjects: true }) as Array<{
    agent: string;
    teamLevel: string;
    teamVolume: string;
    salary: string;
  }>;
  const trustItems = t("landing.trust.items", { returnObjects: true }) as string[];

  return (
    <>
      <Section
        id="live"
        dark
        eyebrow={t("landing.live.eyebrow")}
        title={t("landing.live.title")}
        copy={t("landing.live.copy")}
        className="bg-[#06101F]"
      >
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-[#1BB6FF]">
                  {t("landing.live.board")}
                </p>
                <h3 className="mt-3 text-3xl font-black leading-tight">
                  {t("landing.live.boardTitle")}
                </h3>
              </div>
              <Radio className="h-8 w-8 shrink-0 text-[#1BB6FF]" aria-hidden="true" />
            </div>
            <ChartLine className="mt-8 h-28 w-full" color="#23B5FF" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[t("landing.live.shots"), t("landing.live.corners"), t("landing.live.cards")].map((label, index) => (
                <div key={label} className="rounded-lg bg-white/[0.08] p-4">
                  <p className="text-xs font-bold uppercase text-white/[0.48]">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {["12", "7", "3"][index]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <Button href="/register/000208" variant="light">
                {t("landing.live.startBetting")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {liveMatches.map((match) => (
              <div
                key={match.fixture}
                className="rounded-lg border border-white/10 bg-white p-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#1BB6FF]/12 text-[#1294D4]">
                      <Clock3 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-black text-navy-950">
                        {match.fixture}
                      </h3>
                      <p className="text-sm text-slate-500">{match.market}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      {match.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {t("landing.live.odds")}
                      </p>
                      <p className="text-xl font-black text-navy-950">
                        {match.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="bonuses"
        eyebrow={t("landing.bonuses.eyebrow")}
        title={t("landing.bonuses.title")}
        copy={t("landing.bonuses.copy")}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,16,31,0.12)]">
            <Image
              src={bfc3}
              alt={t("landing.bonuses.imageAlt")}
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {invitationTiers.map((tier) => (
                <div key={tier.members} className="rounded-lg bg-slate-100 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    {t("landing.bonuses.inviteActive", { members: tier.members })}
                  </p>
                  <p className="mt-2 text-2xl font-black text-navy-950">
                    {t("landing.bonuses.earnReward", { reward: tier.reward })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {bonuses.map((bonus) => (
              <div
                key={bonus.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#1BB6FF]/12 text-[#1294D4]">
                  <Gift className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-navy-950">
                  {bonus.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {bonus.copy}
                </p>
                <Link
                  href="/register/000208"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#1294D4] transition hover:text-navy-950"
                >
                  {t("landing.bonuses.viewOffers")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="agents"
        eyebrow={t("landing.agents.eyebrow")}
        title={t("landing.agents.title")}
        copy={t("landing.agents.copy")}
        className="bg-white"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={bfc5}
              alt={t("landing.agents.rebateAlt")}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {agentRebates.map((rebate) => (
                <div key={rebate.level} className="rounded-lg bg-white p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    {rebate.level}
                  </p>
                  <p className="mt-2 text-3xl font-black text-navy-950">
                    {rebate.rebate}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={bfc2}
              alt={t("landing.agents.salaryAlt")}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3 pr-4 font-black">{t("landing.agents.agent")}</th>
                    <th className="py-3 pr-4 font-black">{t("landing.agents.teamLevel")}</th>
                    <th className="py-3 pr-4 font-black">{t("landing.agents.teamVolume")}</th>
                    <th className="py-3 font-black">{t("landing.agents.salary")}</th>
                  </tr>
                </thead>
                <tbody>
                  {agentSalaryLevels.map((row) => (
                    <tr key={row.agent} className="border-b border-slate-200 last:border-b-0">
                      <td className="py-3 pr-4 font-black text-navy-950">{row.agent}</td>
                      <td className="py-3 pr-4 text-slate-600">{row.teamLevel}</td>
                      <td className="py-3 pr-4 font-bold text-slate-800">{row.teamVolume}</td>
                      <td className="py-3 font-black text-[#1294D4]">{row.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="trust"
        dark
        eyebrow={t("landing.trust.eyebrow")}
        title={t("landing.trust.title")}
        copy={t("landing.trust.copy")}
        className="bg-[#10284D]"
      >
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-white/10 bg-[#06101F] p-6 text-white sm:p-8">
            <ShieldCheck className="h-10 w-10 text-[#1BB6FF]" aria-hidden="true" />
            <h3 className="mt-5 text-3xl font-black leading-tight">
              {t("landing.trust.cardTitle")}
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/[0.62]">
              {t("landing.trust.cardCopy")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item, index) => {
              const Icon = [ShieldCheck, WalletCards, TrendingUp, CheckCircle2][index] || CheckCircle2;

              return (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white p-5"
                >
                  <Icon className="h-6 w-6 text-[#1294D4]" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-black text-navy-950">
                    {item}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t("landing.trust.itemCopy")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </>
  );
}
