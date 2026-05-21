"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

            {/* ── RIGHT CONTENT — Hero image ── */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative flex items-end justify-center lg:justify-end"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20 w-full max-w-[600px] lg:max-w-[660px]"
              >
                <Image
                  src="/hero-models.png"
                  alt="Athletes holding a football and tennis racket"
                  width={1536}
                  height={1024}
                  priority
                  className="h-auto w-full rounded-[2rem] object-cover shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
