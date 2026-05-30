import { ArrowRight, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import heroFootball from "@/public/kick1.jpg";

const heroStats = [
  { label: "Popular markets", value: "1X2, Goals, BTTS" },
  { label: "Account safety", value: "Secure wallet" },
  { label: "Football focus", value: "Fixtures and live odds" },
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#06101F] px-4 py-12 text-white sm:px-8 lg:px-10 lg:py-16"
    >
      <div className="mx-auto grid w-full max-w-[1420px] items-center gap-10 lg:min-h-[calc(100vh-92px)] lg:grid-cols-[0.48fr_0.52fr]">
        <div>
         

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Football Betting Made Simple
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Pick football matches, compare odds, place secure bets, and follow
            every result from one clear EFC betting experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register/000208"
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg bg-[#1BB6FF] px-7 text-base font-black text-[#06101F] shadow-[0_18px_45px_rgba(27,182,255,0.24)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1BB6FF]"
            >
              Create Account
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[50px] items-center justify-center rounded-lg border border-white/[0.18] px-7 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Log in
            </Link>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-xs font-bold uppercase text-white/[0.45]">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#10284D] shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
          <Image
            src={heroFootball}
            alt="Football player kicking a ball"
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="aspect-[16/11] h-auto w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#06101F]/88 p-4 text-white backdrop-blur">
              <div className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-[#1BB6FF]" aria-hidden="true" />
                <span className="text-sm font-black">Secure Deposits</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/[0.62]">
                Fund your wallet and confirm football slips with confidence.
              </p>
            </div>
            <div className="rounded-lg bg-[#06101F]/88 p-4 text-white backdrop-blur">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#1BB6FF]" aria-hidden="true" />
                <span className="text-sm font-black">Responsible Play</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/[0.62]">
                Set a budget, bet on football you understand, and stay in control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
