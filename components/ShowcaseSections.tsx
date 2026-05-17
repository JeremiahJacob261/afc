"use client";

import { CheckCircle2, CircleDollarSign, Radio, TrendingUp } from "lucide-react";
import { marketRows } from "@/data/landing";
import { Button } from "./Button";
import { ChartLine } from "./ChartLine";
import { DeviceMockup } from "./DeviceMockup";
import { GlassCard } from "./GlassCard";
import { MotionReveal } from "./MotionReveal";
import { Section } from "./Section";

export function ShowcaseSections() {
  return (
    <>
      <Section id="markets" dark className="py-10 lg:py-16">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2.25rem] bg-premium-radial p-6 text-white shadow-[0_34px_100px_rgba(6,16,31,0.35)] sm:p-10 lg:p-14">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] animate-shimmer" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-electric-400">Sports market pulse</p>
                <h2 className="mt-4 text-balance text-4xl font-black leading-none sm:text-6xl">
                  Keep Your Finger on the Investment Market Pulse
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                  Monitor odds movement, player performance indexes, market heatmaps, and exposure curves in one cinematic analytics layer.
                </p>
                <div className="mt-8">
                  <Button href="#app" variant="light" icon="arrow">Get Started</Button>
                </div>
              </div>
              <GlassCard dark className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/56">Total balance</p>
                    <p className="text-3xl font-black">$128,604</p>
                  </div>
                  <span className="rounded-full bg-electric-400/20 px-3 py-1 text-xs font-black text-electric-400">+19.7%</span>
                </div>
                <ChartLine className="mt-8 h-24 w-full" color="#23B5FF" />
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-white/62">
                  <span>Odds</span>
                  <span>Risk</span>
                  <span>Yield</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section
        eyebrow="Live exchange"
        title="Trade in Real Time"
        copy="Orders, hedges, and portfolio adjustments are updated with live sports data and market conviction."
      >
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <MotionReveal>
            <GlassCard className="relative overflow-hidden bg-navy-950 p-6 text-white">
              <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-electric-400/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-electric-400">Volatility</span>
                  <TrendingUp className="h-6 w-6 text-electric-400" aria-hidden />
                </div>
                <ChartLine className="mt-9 h-32 w-full" color="#F8FAFC" muted />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["Liquidity", "Spread", "Signal"].map((item, index) => (
                    <div key={item} className="rounded-2xl bg-white/8 p-3">
                      <p className="text-xs text-white/50">{item}</p>
                      <p className="mt-1 text-lg font-black">{["84%", "1.6", "BUY"][index]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </MotionReveal>
          <div className="space-y-3">
            {marketRows.map((row, index) => (
              <MotionReveal key={row.label} delay={index * 0.05}>
                <div className="glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${row.hot ? "bg-electric-400/15 text-electric-600" : "bg-brick-500/12 text-brick-600"}`}>
                      {row.hot ? <Radio className="h-5 w-5" aria-hidden /> : <CircleDollarSign className="h-5 w-5" aria-hidden />}
                    </span>
                    <div>
                      <h3 className="font-black text-navy-950">{row.label}</h3>
                      <p className="text-sm text-slate-500">{row.sport} market</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-8 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Price</p>
                      <p className="text-lg font-black text-navy-950">{row.odds}</p>
                    </div>
                    <p className={`min-w-16 text-right text-sm font-black ${row.move.startsWith("-") ? "text-brick-600" : "text-emerald-600"}`}>
                      {row.move}
                    </p>
                  </div>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="app"
        eyebrow="Mobile command center"
        title="100,000+ Sports Signals in Your App"
        copy="Track match forecasts, live scores, portfolio exposure, and investment metrics in an interface designed for repeated professional use."
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <MotionReveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {["Live score tracking", "Betting insights", "Portfolio management", "Secure withdrawals"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(6,16,31,0.08)] ring-1 ring-navy-900/5">
                  <CheckCircle2 className="h-5 w-5 text-electric-600" aria-hidden />
                  <span className="text-sm font-black text-navy-950">{item}</span>
                </div>
              ))}
            </div>
          </MotionReveal>
          <MotionReveal delay={0.1} className="relative">
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-400/18 blur-3xl" />
            <DeviceMockup className="relative rotate-3" />
          </MotionReveal>
        </div>
      </Section>
    </>
  );
}
