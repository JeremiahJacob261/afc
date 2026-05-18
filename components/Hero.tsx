"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

/* ─── tiny reusable sport-row for the light phone ─── */
function BetRow({
  league,
  teams,
  score,
  live,
}: {
  league: string;
  teams: string;
  score: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {/* league badge */}
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-500 shrink-0">
          {league}
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">{league}</p>
          <p className="text-[10px] font-semibold text-gray-800 leading-tight">{teams}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {live && (
          <span className="flex items-center gap-1 text-[8px] font-bold text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        <span className="text-[10px] font-bold text-gray-700">{score}</span>
        <button className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 text-[10px]">
          +
        </button>
      </div>
    </div>
  );
}

/* ─── sparkle icon ─── */
function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

/* ─── micro sparkle chart line for dark phone ─── */
function SparkChart() {
  return (
    <svg viewBox="0 0 160 60" className="w-full h-12" preserveAspectRatio="none">
      {/* pink area */}
      <defs>
        <linearGradient id="pink-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4FA3" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF4FA3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="teal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#23B5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#23B5FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 50 C20 45 30 20 50 25 C70 30 80 10 100 15 C120 20 140 35 160 30 L160 60 L0 60Z"
        fill="url(#pink-grad)"
      />
      <path
        d="M0 50 C20 45 30 20 50 25 C70 30 80 10 100 15 C120 20 140 35 160 30"
        stroke="#FF4FA3"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M0 55 C20 52 30 40 50 42 C70 44 80 30 100 35 C120 40 140 48 160 44 L160 60 L0 60Z"
        fill="url(#teal-grad)"
      />
      <path
        d="M0 55 C20 52 30 40 50 42 C70 44 80 30 100 35 C120 40 140 48 160 44"
        stroke="#23B5FF"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden w-full min-h-screen flex items-center justify-center px-4 pb-16 pt-8 sm:px-8 lg:px-10 lg:pb-24"
    >
      <div className="mx-auto max-w-[1420px] w-full">
        <div className="relative min-h-[85vh] overflow-hidden rounded-[2.5rem] bg-[#10284D] px-7 py-12 shadow-[0_32px_90px_rgba(0,0,0,0.20)] sm:px-14 lg:px-24 lg:py-20">

          {/* Subtle background radials */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#1BB6FF]/5 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[80px]" />
          </div>

          <div className="relative z-10 grid min-h-[600px] items-center gap-12 lg:grid-cols-[0.52fr_0.48fr]">

            {/* ── LEFT CONTENT ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative z-20"
            >
              {/* Headline */}
              <div className="relative inline-block">
                <h1 className="text-balance text-[3.8rem] font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-[5rem] lg:text-[5.8rem] xl:text-[6.5rem]">
                  Invest in <br />
                  Every Game
                </h1>
                {/* Sparkle — positioned after "Every Game" */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                  className="absolute -right-10 top-[38%] text-white sm:-right-14"
                >
                  <Sparkle className="h-9 w-9 sm:h-12 sm:w-12" />
                </motion.div>
              </div>

              {/* Subtitle */}
              <p className="mt-7 max-w-[460px] text-base font-normal leading-[1.7] text-white/70 sm:text-lg">
                Leverage professional sports analytics, expert insights, and advanced betting tools to maximize your potential in the dynamic world of sports investment using Pro Sports!
              </p>

              {/* CTA row */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Gradient Get Started button */}
                <Link
                  href="/register/000208"
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #2ECFC4 0%, #FF6BC8 100%)",
                  }}
                >
                  Get Started
                </Link>
              </div>

              {/* Find Out More */}
              <a
                href="#more"
                className="mt-16 inline-flex items-center gap-2 text-base font-semibold text-white/80 transition hover:text-white hover:translate-y-0.5"
              >
                Find Out More <ArrowDown className="h-4 w-4" />
              </a>

              {/* Hand-drawn arrow pointing to the button */}
              <div className="absolute left-[260px] top-[68%] hidden lg:block pointer-events-none select-none sm:left-[300px]">
                <svg
                  width="160"
                  height="120"
                  viewBox="0 0 160 120"
                  fill="none"
                  className="text-white/50"
                >
                  <motion.path
                    d="M140 10 C120 10 80 30 60 80 C50 100 30 110 10 108"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.9, duration: 1.4, ease: "easeInOut" }}
                  />
                  {/* arrowhead */}
                  <motion.path
                    d="M10 108 L22 98 M10 108 L18 120"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.4, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </motion.div>

            {/* ── RIGHT CONTENT — Phone Mockups ── */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative flex items-end justify-center lg:justify-end"
            >
              {/* ── DARK PHONE (back, slightly behind + right) ── */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute right-0 bottom-0 w-[185px] sm:w-[210px] lg:w-[230px] rounded-[28px] bg-[#0B1526] shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 translate-x-6 translate-y-4 z-10"
              >
                {/* Dark phone status bar */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <svg viewBox="0 0 10 10" className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 8 L5 2 L8 8" />
                  </svg>
                  <p className="text-[9px] font-semibold text-white/80 text-center">Lakers vs Warriors</p>
                  <div className="w-3" />
                </div>

                {/* Team logos row */}
                <div className="px-4 py-2 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full bg-[#FDB927] flex items-center justify-center text-[10px] font-black text-[#552583]">LAL</div>
                    <p className="text-[8px] text-white/60">Lakers</p>
                  </div>
                  <p className="text-[9px] text-white/40 font-semibold">VS</p>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full bg-[#1D428A] flex items-center justify-center text-[10px] font-black text-[#FFC72C]">GSW</div>
                    <p className="text-[8px] text-white/60">Warriors</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mx-4 mt-1 mb-2 flex rounded-lg bg-white/[0.06] p-0.5 text-[8px]">
                  <button className="flex-1 rounded-md bg-white/10 py-1 text-white font-semibold">Betting line</button>
                  <button className="flex-1 py-1 text-white/40">Analysis</button>
                </div>

                {/* Chart label */}
                <p className="px-4 text-[7px] text-white/40 mb-1">Betting line performance</p>

                {/* Sparkline chart */}
                <div className="px-3 pb-1">
                  <SparkChart />
                </div>

                {/* Period selector */}
                <div className="px-4 pb-2 flex items-center gap-1">
                  <button className="rounded bg-white/10 px-2 py-0.5 text-[7px] text-white/60 font-semibold">1W</button>
                  <button className="rounded px-2 py-0.5 text-[7px] text-white/30">1M</button>
                  <span className="ml-auto text-[8px] text-white/50">›</span>
                </div>

                {/* Sell / Buy */}
                <div className="mx-4 mb-3 flex gap-2">
                  <button className="flex-1 rounded-xl bg-[#FF4B7A]/80 py-2 text-[9px] font-bold text-white">Sell</button>
                  <button className="flex-1 rounded-xl bg-[#FF4FA3] py-2 text-[9px] font-bold text-white">Buy</button>
                </div>

                {/* Bottom card */}
                <div className="mx-3 mb-3 rounded-xl bg-white/[0.05] px-3 py-2">
                  <p className="text-[7px] text-white/40 mb-1">Analysis · Line</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] text-white/60">Line</p>
                    <p className="text-[10px] font-bold text-white">$236</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="h-0.5 flex-1 rounded bg-white/10 mr-2">
                      <div className="h-0.5 w-3/5 rounded bg-[#23B5FF]" />
                    </div>
                    <span className="text-[7px] text-white/30">›</span>
                  </div>
                </div>
              </motion.div>

              {/* ── LIGHT PHONE (front, main) ── */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20 w-[200px] sm:w-[230px] lg:w-[255px] mr-24 lg:mr-28 rounded-[32px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.45)] overflow-hidden border border-gray-100"
              >
                {/* Status bar notch */}
                <div className="bg-white px-5 pt-4 pb-1 flex items-center justify-between">
                  <p className="text-[8px] text-gray-400">9:41</p>
                  <div className="w-16 h-3 rounded-full bg-black mx-auto" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-sm bg-gray-300" />
                    <div className="w-2 h-2 rounded-sm bg-gray-300" />
                  </div>
                </div>

                {/* Header */}
                <div className="px-5 pt-2 pb-3">
                  <h2 className="text-[18px] font-black text-[#1a1a2e]">
                    <span className="text-[#2ECFC4]">Live</span> Bets
                  </h2>
                </div>

                {/* Search bar */}
                <div className="px-4 pb-2 flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <p className="text-[9px] text-gray-400">Find stocks, funds, ETFs…</p>
                  </div>
                  <button className="rounded-full bg-gray-100 p-1.5">
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M6 12h12M9 18h6" />
                    </svg>
                  </button>
                </div>

                {/* Filter chips */}
                <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {["Stock", "Fond", "Bond", "Crypto", "Commodities"].map((c, i) => (
                    <span
                      key={c}
                      className={`shrink-0 rounded-full px-3 py-0.5 text-[9px] font-semibold ${i === 0
                          ? "bg-[#10284D] text-white"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Bet rows */}
                <div className="px-4 pb-2">
                  <BetRow league="NBA" teams="Lakers vs Warriors" score="18  10" live />
                  <div className="flex items-center gap-3 py-1 border-b border-gray-100 text-[9px] text-gray-500">
                    <span>+/-</span>
                    <span className="font-semibold text-gray-700">120</span>
                    <span>+/-</span>
                    <span className="font-semibold text-[#10284D]">+120</span>
                  </div>

                  <BetRow league="NFL" teams="Logons vs Warriors" score="11  15" />
                  <div className="flex items-center gap-3 py-1 border-b border-gray-100 text-[9px] text-gray-500">
                    <span>+/-</span>
                    <span className="font-semibold text-gray-700">120</span>
                    <span>+/-</span>
                    <span className="font-semibold text-[#10284D]">+120</span>
                  </div>

                  <BetRow league="NFL" teams="NFL Warrioms" score="4  0" />
                  <BetRow league="NBA" teams="Lakers vs Warriors" score="7  7" />
                </div>

                {/* Bottom nav bar */}
                <div className="border-t border-gray-100 px-6 py-2 flex items-center justify-between bg-white">
                  {[
                    { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Home", active: true },
                    { icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v16H4z", label: "Stocks" },
                    { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Crypto" },
                    { icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z", label: "Profile" },
                  ].map(({ icon, label, active }) => (
                    <button key={label} className="flex flex-col items-center gap-0.5">
                      <svg
                        className={`w-4 h-4 ${active ? "text-[#10284D]" : "text-gray-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                      <span className={`text-[7px] ${active ? "text-[#10284D] font-semibold" : "text-gray-400"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
