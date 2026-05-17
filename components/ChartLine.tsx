"use client";

type ChartLineProps = {
  className?: string;
  color?: string;
  muted?: boolean;
};

export function ChartLine({ className = "", color = "#23B5FF", muted }: ChartLineProps) {
  return (
    <svg viewBox="0 0 220 74" className={className} role="img" aria-label="Animated market trend line">
      <defs>
        <linearGradient id={`chart-${color.replace("#", "")}`} x1="0" x2="1">
          <stop offset="0%" stopColor={muted ? "rgba(255,255,255,0.3)" : color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path
        d="M4 58 C 28 28, 42 32, 58 46 S 88 68, 108 34 S 142 4, 164 28 S 196 62, 216 18"
        fill="none"
        stroke={`url(#chart-${color.replace("#", "")})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="320"
        strokeDashoffset="320"
        className="animate-draw"
      />
      <path
        d="M4 58 C 28 28, 42 32, 58 46 S 88 68, 108 34 S 142 4, 164 28 S 196 62, 216 18"
        fill="none"
        stroke={color}
        strokeOpacity="0.1"
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}
