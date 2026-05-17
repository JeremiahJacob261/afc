import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  icon?: "arrow" | "download";
  className?: string;
};

export function Button({
  href = "#",
  children,
  variant = "primary",
  icon = "arrow",
  className = "",
}: ButtonProps) {
  const Icon = icon === "download" ? Download : ArrowRight;
  const variants = {
    primary:
      "bg-navy-900 text-white shadow-glow hover:bg-navy-800 focus-visible:outline-electric-400",
    secondary:
      "bg-white/80 text-navy-900 ring-1 ring-navy-900/10 hover:bg-white focus-visible:outline-electric-400",
    light:
      "bg-white text-navy-950 shadow-[0_18px_46px_rgba(0,0,0,0.18)] hover:bg-slate-100 focus-visible:outline-white",
  };

  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold tracking-normal transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${variants[variant]} ${className}`}
    >
      <span>{children}</span>
      <Icon className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
