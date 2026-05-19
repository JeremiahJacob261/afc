"use client";

import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/data/landing";
import Logo from "@/public/european.ico";

export function Navbar() {
  return (
    <header className="relative z-50 px-4 pt-6 sm:px-8 lg:px-10">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-[1420px] items-center justify-between gap-4"
      >
        {/* Logo */}
        <Link
          href="#home"
          className="flex items-center gap-1 text-xl font-black tracking-[-0.04em] text-black"
        >
          <Image src={Logo} alt="thelogo" width={32} height={32} />
          <span className="text-2xl font-bold">EFC</span>
        </Link>

        {/* Centre nav links */}
        <div className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-md font-medium text-[#1a1a2e] transition hover:text-[#10284D]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-[44px] items-center rounded-xl border border-gray-200 bg-white px-6 text-md font-semibold text-[#1a1a2e] shadow-sm transition hover:bg-gray-50 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register/000208"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[#10284D] px-6 text-md font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0B1D3A]"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
