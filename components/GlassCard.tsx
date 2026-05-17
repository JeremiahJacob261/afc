"use client";

import { motion } from "framer-motion";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
};

export function GlassCard({ children, className = "", dark }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`${dark ? "dark-glass" : "glass"} rounded-[2rem] ${className}`}
    >
      {children}
    </motion.div>
  );
}
