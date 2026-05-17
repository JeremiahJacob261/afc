"use client";

import { motion } from "framer-motion";
import { ChartLine } from "./ChartLine";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "red" | "dark";
  className?: string;
};

export function StatCard({ label, value, detail, tone = "blue", className = "" }: StatCardProps) {
  const color = tone === "red" ? "#D14B45" : tone === "dark" ? "#091B34" : "#23B5FF";

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className={`glass rounded-3xl p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-navy-950">{value}</p>
        </div>
        <span className="rounded-full bg-navy-900 px-2.5 py-1 text-xs font-black text-white">{detail}</span>
      </div>
      <ChartLine className="mt-3 h-12 w-full" color={color} />
    </motion.div>
  );
}
