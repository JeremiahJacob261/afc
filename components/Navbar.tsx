"use client";

import Image from "next/image";
import Link from "next/link";
import { navItems } from "@/data/landing";
import Logo from "@/public/european.ico";

export function Navbar() {
  return (
    <header className="relative z-50 border-b border-white/10 bg-[#06101F] px-4 py-4 sm:px-8 lg:px-10">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-[1420px] items-center justify-between gap-4"
      >
        <Link
          href="#home"
          className="flex min-h-[44px] items-center gap-2 text-white"
        >
          <Image src={Logo} alt="EFC logo" width={34} height={34} />
          <span className="text-2xl font-black">EFC</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-white/70 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-[44px] items-center rounded-lg border border-white/[0.14] px-5 text-sm font-bold text-white transition hover:border-white/[0.38] hover:bg-white/[0.08] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register/000208"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#1BB6FF] px-5 text-sm font-black text-[#06101F] shadow-[0_14px_34px_rgba(27,182,255,0.22)] transition hover:bg-white"
          >
            Join Now
          </Link>
        </div>
      </nav>
    </header>
  );
}
