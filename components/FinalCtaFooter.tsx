import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, Send, Twitter } from "lucide-react";
import { useTranslation } from "next-i18next";
import { Button } from "./Button";
import { Section } from "./Section";

export function FinalCtaFooter() {
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
      <Section
        id="faq"
        eyebrow={t("landing.faq.eyebrow")}
        title={t("landing.faq.title")}
        copy={t("landing.faq.copy")}
        className="bg-white"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="rounded-lg border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-lg font-black text-navy-950">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-50 pb-12">
        <div className="relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#091B34,#06101F)] px-6 py-14 text-center text-white shadow-[0_34px_100px_rgba(6,16,31,0.28)] sm:px-10 lg:py-20">
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase text-[#1BB6FF]">
              {t("landing.cta.eyebrow")}
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/[0.68]">
              {t("landing.cta.copy")}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/register/000208" variant="light">
                {t("common.createAccount")}
              </Button>
              <Button href="/login" variant="secondary" icon="arrow">
                {t("common.login")}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <footer id="contact" className="bg-[#06101F] px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-black text-white shadow-[0_-1px_0_rgba(35,181,255,0.5)]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#1BB6FF] to-transparent" />
          <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_1fr_1fr] lg:py-14">
            <div>
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/efc-logo.jpg"
                  alt={t("landing.footer.logoAlt")}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-black">{t("common.appName")}</p>
                  <p className="text-sm text-white/50">
                    {t("common.brandCompany")}
                  </p>
                </div>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/[0.52]">
                {t("landing.footer.copy")}
              </p>
              <div className="mt-6 flex gap-3">
                {[Twitter, Linkedin, Instagram, Facebook].map((Icon, index) => (
                  <a
                    key={index}
                    href="#contact"
                    aria-label={t("landing.footer.communityLink")}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-[#1BB6FF] hover:text-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1BB6FF]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-black">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-white/[0.48] transition hover:text-white"
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
              <h3 className="text-sm font-black">{t("landing.footer.matchNews")}</h3>
              <form className="mt-4 flex rounded-full border border-white/10 bg-white/[0.05] p-1">
                <label className="sr-only" htmlFor="email">
                  {t("common.emailAddress")}
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                  <Mail className="h-4 w-4 shrink-0 text-white/[0.32]" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    placeholder={t("landing.footer.emailPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/[0.32]"
                  />
                </div>
                <button
                  type="submit"
                  aria-label={t("common.subscribe")}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1BB6FF] text-navy-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1BB6FF]"
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
