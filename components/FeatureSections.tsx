"use client";

import { ArrowRight, Activity, Coins, Gauge, RadioTower, ShieldCheck, Shuffle, Trophy, WalletCards } from "lucide-react";
import { sponsorMarks } from "@/data/landing";
import { MotionReveal } from "./MotionReveal";
import { Section } from "./Section";
import Image from "next/image";
import ballPng from "@/public/soccer_ball_icon.png";
import chart from "@/public/bar_chart_icon.png";
import feature1 from "@/public/features-1.png"
import feature2 from "@/public/features-2.png"
import advan1 from "@/public/advan-1.png"
import advan2 from "@/public/advan-2.png"
import advan3 from "@/public/advan-3.png"
import advan4 from "@/public/advan-4.png"
import { SponsorMark } from "./SponsorMark";



export function FeatureSections() {
  return (
    <>
      <Section
        id="analytics"
        title="Get the Most Out of Your Bets ✨"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="group relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-50 to-rose-100/60 p-8 sm:p-10 lg:p-12">
            <div className="relative z-10 md:w-[65%]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <Image src={ballPng} alt="3D Soccer Ball" width={100} height={100} />
              </div>
              <h3 className="text-3xl font-bold leading-tight text-navy-950 sm:text-4xl">
                Smart Bets,<br />Better Wins
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Access expert picks, real-time odds, and detailed stats to place smarter bets with confidence.
              </p>
              <a href="#" className="mt-8 inline-flex items-center font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            
            <div className="absolute -bottom-4 -right-4 aspect-square w-[80%] sm:-bottom-8 sm:-right-8 sm:w-[65%] lg:w-[60%] xl:w-[55%]">
            <Image src={feature2} alt="3D Soccer Ball" width={300} height={300} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-50 to-blue-100/60 p-8 sm:p-10 lg:p-12">
            <div className="relative z-10 md:w-[65%]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <Image src={chart} alt="chart" width={100} height={100} />
              </div>
              <h3 className="text-3xl font-bold leading-tight text-navy-950 sm:text-4xl">
                Track. Analyze.<br />Increase Profits.
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Analyze your performance, track your bets, and discover insights that give you the winning edge.
              </p>
              <a href="#" className="mt-8 inline-flex items-center font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            
            <div className="absolute -bottom-4 -right-4 aspect-square w-[80%] sm:-bottom-8 sm:-right-8 sm:w-[65%] lg:w-[60%] xl:w-[55%]">
              <Image src={feature1} alt="feature2" width={300} height={300} />
            </div>
          </div>
        </div>
      </Section>

      <Section id="sports">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl mb-4">
            Advantages
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl font-medium">
            Powerful features designed to give you the ultimate sports betting experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Best Odds */}
          <MotionReveal delay={0.1}>
            <div className="group relative flex overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex w-full items-center gap-6">
                <div className="relative h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40">
                  <Image src={advan1} alt="Best Odds" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="text-xl font-bold text-navy-950 sm:text-2xl">Best Odds</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Get the most competitive odds across 1000+ sports markets.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-transform hover:scale-105">
                    Bet Now <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* Card 2: Live Betting */}
          <MotionReveal delay={0.2}>
            <div className="group relative flex overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex w-full items-center gap-6">
                <div className="relative h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40">
                  <Image src={advan3} alt="Live Betting" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="text-xl font-bold text-navy-950 sm:text-2xl">Live Betting</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Bet in-play with real-time updates and instant markets.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-transform hover:scale-105">
                    Bet Live <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* Card 3: Secure & Fast */}
          <MotionReveal delay={0.3}>
            <div className="group relative flex overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex w-full items-center gap-6">
                <div className="relative h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40">
                  <Image src={advan2} alt="Secure & Fast" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="text-xl font-bold text-navy-950 sm:text-2xl">Secure & Fast</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Your bets and payments are protected with top-tier security and fast withdrawals.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-transform hover:scale-105">
                    Learn More <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* Card 4: Rewards & Bonuses */}
          <MotionReveal delay={0.4}>
            <div className="group relative flex overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex w-full items-center gap-6">
                <div className="relative h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40">
                  <Image src={advan4} alt="Rewards & Bonuses" fill className="object-contain" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="text-xl font-bold text-navy-950 sm:text-2xl">Rewards & Bonuses</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Enjoy exclusive bonuses, free bets, and loyalty rewards every week.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-transform hover:scale-105">
                    Claim Bonus <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </Section>

      <Section
        id="about"
        title="Our Partners"
        copy="Trusted by leading sports brands and organizations worldwide."
        className="pt-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sponsorMarks.map((sponsor) => (
            <SponsorMark key={sponsor.name} name={sponsor.name} initials={sponsor.initials} domain={sponsor.domain} />
          ))}
        </div>
      </Section>
    </>
  );
}
