"use client";

import { CheckCircle2, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { useTranslation } from "next-i18next";
import { UclSection } from "./UclSection";
import { Starball } from "./Starball";

const trustIcons = [ShieldCheck, WalletCards, TrendingUp, CheckCircle2];

export function UclTrust() {
  const { t } = useTranslation("common");

  const items = t("landing.trust.items", { returnObjects: true }) as string[];

  return (
    <UclSection
      id="trust"
      eyebrow={t("landing.trust.eyebrow")}
      title={t("landing.trust.title")}
      copy={t("landing.trust.copy")}
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="ucl-panel-strong ucl-cut relative overflow-hidden p-6 sm:p-8">
          <Starball
            className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 opacity-30"
            tilt={22}
            density={0.22}
          />
          <ShieldCheck className="relative h-10 w-10 text-cyan-300" aria-hidden="true" />
          <h3 className="relative mt-5 text-2xl font-black leading-tight text-white">
            {t("landing.trust.cardTitle")}
          </h3>
          <p className="relative mt-4 text-sm leading-6 text-silver-400">
            {t("landing.trust.cardCopy")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => {
            const Icon = trustIcons[index] || CheckCircle2;

            return (
              <div key={item} className="ucl-panel ucl-cut p-5">
                <Icon className="h-6 w-6 text-cyan-300" aria-hidden="true" />
                <h3 className="mt-4 text-base font-black text-white">{item}</h3>
                <p className="mt-2 text-sm leading-6 text-silver-400">
                  {t("landing.trust.itemCopy")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </UclSection>
  );
}
