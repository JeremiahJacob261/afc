import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Send, Twitter } from "lucide-react";
import { footerGroups } from "@/data/landing";
import { Button } from "./Button";
import { Section } from "./Section";

export function FinalCtaFooter() {
  return (
    <>
      <Section id="pricing" className="pb-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#091B34,#06101F)] px-6 py-16 text-center text-white shadow-[0_34px_100px_rgba(6,16,31,0.34)] sm:px-10 lg:py-24">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-electric-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-electric-400">EFC premium</p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-none sm:text-6xl">
              Join the Future of Sports Investment
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68">
              EFC brings elite sports research, live analytics, and investment opportunities into one global ecosystem.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/register/000208" variant="light">Start Investing</Button>
              <Button href="/login" variant="secondary" icon="arrow">
                Login
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <footer id="contact" className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-t-[2rem] rounded-b-[2rem] bg-black text-white shadow-[0_-1px_0_rgba(35,181,255,0.5)]">
          <div className="h-px bg-gradient-to-r from-transparent via-electric-400 to-transparent" />
          <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_1fr_1fr] lg:py-14">
            <div>
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/efc-logo.jpg"
                  alt="EFC European Football Clubs logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-black">EFC</p>
                  <p className="text-sm text-white/50">European Football Clubs</p>
                </div>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/52">
                Premium sports-fintech analytics for sophisticated market participants.
              </p>
              <div className="mt-6 flex gap-3">
                {[Twitter, Linkedin, Instagram, Facebook].map((Icon, index) => (
                  <a
                    key={index}
                    href="#contact"
                    aria-label="Social link"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white/70 transition hover:bg-electric-400 hover:text-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric-400"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
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
                      <li key={link}>
                        <a href="#home" className="text-sm text-white/48 transition hover:text-white">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-black">Subscribe to News</h3>
              <form className="mt-4 flex rounded-full border border-white/10 bg-white/5 p-1">
                <label className="sr-only" htmlFor="email">Email address</label>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                  <Mail className="h-4 w-4 shrink-0 text-white/32" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    placeholder="Your e-mail"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/32"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-electric-400 text-navy-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric-400"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
