import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Clock3,
  Goal,
  ShieldCheck,
  Trophy,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "next-i18next";
import { Section } from "./Section";
import ballPng from "@/public/soccer_ball_icon.png";
import feature2 from "@/public/features-2.png";
import advan1 from "@/public/advan-1.png";
import advan2 from "@/public/advan-2.png";
import bfc1 from "@/public/bfc1.jpg";
import bfc4 from "@/public/bfc4.jpg";

const marketIcons = [Trophy, Goal, BarChart3, CircleDollarSign, Clock3];
const featureIcons = [BarChart3, Clock3, WalletCards, ShieldCheck];

export function FeatureSections() {
  const { t } = useTranslation("common");
  const footballMarkets = t("landing.markets.items", { returnObjects: true }) as Array<{
    title: string;
    label: string;
    copy: string;
    odds: string;
  }>;
  const howItWorks = t("landing.howItWorks.steps", { returnObjects: true }) as Array<{
    title: string;
    copy: string;
  }>;
  const platformOperations = t("landing.operations.items", { returnObjects: true }) as Array<{
    label: string;
    value: string;
  }>;
  const bettingFeatures = t("landing.features.items", { returnObjects: true }) as Array<{
    title: string;
    copy: string;
  }>;
  const walletRewards = t("landing.features.walletRewards", { returnObjects: true }) as Array<{
    label: string;
    value: string;
  }>;

  return (
    <>
      <Section
        id="markets"
        eyebrow={t("landing.markets.eyebrow")}
        title={t("landing.markets.title")}
        copy={t("landing.markets.copy")}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {footballMarkets.map((market, index) => {
            const Icon = marketIcons[index] || Trophy;

            return (
              <div
                key={market.title}
                className="flex min-h-[250px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(6,16,31,0.06)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#1BB6FF]/12 text-[#1294D4]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="rounded-full bg-[#06101F] px-3 py-1 text-xs font-black text-white">
                      {market.odds}
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-black uppercase text-[#1294D4]">
                    {market.label}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-navy-950">
                    {market.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {market.copy}
                  </p>
                </div>
                <Link
                  href="/register/000208"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#1294D4] transition hover:text-navy-950"
                >
                  {t("landing.markets.pickMarket")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="how-it-works"
        eyebrow={t("landing.howItWorks.eyebrow")}
        title={t("landing.howItWorks.title")}
        copy={t("landing.howItWorks.copy")}
        className="bg-white"
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-lg bg-[#06101F] p-6 text-white sm:p-8">
            <div className="relative z-10 max-w-md">
              <p className="text-sm font-black uppercase text-[#1BB6FF]">
                {t("landing.howItWorks.matchDayFlow")}
              </p>
              <h3 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                {t("landing.howItWorks.featureTitle")}
              </h3>
              <p className="mt-4 text-sm leading-6 text-white/[0.62]">
                {t("landing.howItWorks.featureCopy")}
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Image
                src={feature2}
                alt={t("landing.howItWorks.featureAlt")}
                className="h-44 w-full rounded-lg bg-white/[0.08] object-contain p-4"
              />
              <Image
                src={ballPng}
                alt={t("landing.howItWorks.ballAlt")}
                className="h-44 w-full rounded-lg bg-white/[0.08] object-contain p-4"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#1BB6FF] text-sm font-black text-[#06101F]">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-black text-navy-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow={t("landing.operations.eyebrow")}
        title={t("landing.operations.title")}
        copy={t("landing.operations.copy")}
      >
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,16,31,0.12)]">
            <Image
              src={bfc1}
              alt={t("landing.operations.imageAlt")}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {platformOperations.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-black uppercase text-[#1294D4]">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-black text-navy-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow={t("landing.features.eyebrow")}
        title={t("landing.features.title")}
        copy={t("landing.features.copy")}
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            {bettingFeatures.map((feature, index) => {
              const Icon = featureIcons[index] || ShieldCheck;
              const image = index % 2 === 0 ? advan1 : advan2;

              return (
                <div
                  key={feature.title}
                  className="grid items-center gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[120px_1fr]"
                >
                  <div className="relative h-28 rounded-lg bg-slate-100">
                    <Image
                      src={image}
                      alt=""
                      fill
                      className="object-contain p-4"
                      sizes="120px"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#1BB6FF]/12 text-[#1294D4]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-xl font-black text-navy-950">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {feature.copy}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,16,31,0.12)]">
            <Image
              src={bfc4}
              alt={t("landing.features.walletAlt")}
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {walletRewards.map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-100 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-navy-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
