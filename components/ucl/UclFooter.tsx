"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, Send, Twitter } from "lucide-react";
import { useTranslation } from "next-i18next";
import { UclSection } from "./UclSection";
import { Star, Starball } from "./Starball";
import { AccentRule, Starfield } from "./Decor";

const socialIcons = [Twitter, Linkedin, Instagram, Facebook];

export function UclFooter() {
  const { t } = useTranslation("common");

  const faqItems = t("landing.faq.items", { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;
  const footerGroups = t("landing.footer.groups", { returnObjects: true }) as Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;

  return (
    <>
      <UclSection
        id="faq"
        eyebrow={t("landing.faq.eyebrow")}
        title={t("landing.faq.title")}
        copy={t("landing.faq.copy")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <div key={item.question} className="ucl-panel ucl-cut p-6">
              <h3 className="text-lg font-black text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-silver-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </UclSection>

      {/* ── Closing call to action ──────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-8 lg:px-10 lg:py-28">
        <Starfield />
        <div className="ucl-rays" aria-hidden="true" />
        <Starball
          className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 opacity-20"
          tilt={6}
          density={0.17}
        />
        <div className="ucl-content mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2.5">
            <Star className="h-3.5 w-3.5 text-cyan-300" />
            <span className="ucl-eyebrow">{t("landing.cta.eyebrow")}</span>
          </p>
          <div
            className="mx-auto my-7 h-[2px] w-24 bg-ucl-ribbon"
            style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
            aria-hidden="true"
          />
          <h2 className="ucl-display text-3xl text-white sm:text-4xl lg:text-5xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-silver-400">
            {t("landing.cta.copy")}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register/000208" className="ucl-btn ucl-btn-primary group">
              {t("common.createAccount")}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link href="/login" className="ucl-btn ucl-btn-ghost">
              {t("common.login")}
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="ucl-content px-4 pb-8 sm:px-8 lg:px-10">
        <div className="ucl-panel-strong ucl-cut mx-auto max-w-[1420px] overflow-hidden">
          <AccentRule />

          <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_1fr_1fr] lg:py-14">
            <div>
              <div className="flex items-center gap-3">
                <Image
                  src="/champions-league-logo.png"
                  alt={t("landing.footer.logoAlt")}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.14em] text-white">
                    {t("common.appName")}
                  </p>
                  <p className="text-sm text-silver-500">{t("common.brandCompany")}</p>
                </div>
              </div>

              <p className="mt-6 max-w-sm text-sm leading-6 text-silver-500">
                {t("landing.footer.copy")}
              </p>

              <div className="mt-6 flex gap-3">
                {socialIcons.map((Icon, index) => (
                  <a
                    key={index}
                    href="#contact"
                    aria-label={t("landing.footer.communityLink")}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-silver-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-black text-white">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-silver-500 transition hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-black text-white">{t("landing.footer.matchNews")}</h3>
              <form className="mt-4 flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] p-1.5">
                <label className="sr-only" htmlFor="ucl-newsletter-email">
                  {t("common.emailAddress")}
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                  <Mail className="h-4 w-4 shrink-0 text-silver-500" aria-hidden="true" />
                  <input
                    id="ucl-newsletter-email"
                    type="email"
                    placeholder={t("landing.footer.emailPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-silver-500"
                  />
                </div>
                <button
                  type="submit"
                  aria-label={t("common.subscribe")}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ucl-ribbon text-[#000A1E] transition hover:brightness-110"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
