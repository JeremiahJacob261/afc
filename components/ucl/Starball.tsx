/**
 * The starball — a sphere built from five-pointed stars, the defining mark of
 * the Champions League identity. Drawn inline so it scales cleanly and costs no
 * network request. The star grid is a repeating pattern clipped to a circle,
 * with a radial gradient on top so it reads as a lit sphere rather than a disc.
 */

type StarballProps = {
  className?: string;
  /** Rotate the star grid, in degrees. */
  tilt?: number;
  /** Star size as a fraction of the sphere. Lower is denser. */
  density?: number;
};

/**
 * Five-pointed star centred in a unit cell, first point up. Outer radius 0.30
 * of the cell, inner radius the golden-ratio inner point of 0.382.
 */
const STAR_POINTS = [
  [0.5, 0.2],
  [0.576, 0.396],
  [0.673, 0.396],
  [0.629, 0.519],
  [0.679, 0.653],
  [0.5, 0.591],
  [0.321, 0.653],
  [0.371, 0.519],
  [0.327, 0.396],
  [0.424, 0.396],
]
  .map(([x, y]) => `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`)
  .join(" ");

export function Starball({ className = "", tilt = 12, density = 0.185 }: StarballProps) {
  // Unique ids per instance so multiple starballs on one page don't collide.
  const uid = `sb${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Champions League starball"
    >
      <defs>
        <pattern
          id={`${uid}-grid`}
          width={200 * density}
          height={200 * density}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${tilt})`}
        >
          <polygon points={STAR_POINTS} fill="#FFFFFF" />
        </pattern>

        {/* Light from the upper left, falling to a dark lower right. */}
        <radialGradient id={`${uid}-shade`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
          <stop offset="42%" stopColor="#7CEBFF" stopOpacity="0.14" />
          <stop offset="74%" stopColor="#002D72" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#000A1E" stopOpacity="0.72" />
        </radialGradient>

        {/* Brand-coloured bloom, magenta low-right against the cyan core. */}
        <radialGradient id={`${uid}-bloom`} cx="68%" cy="76%" r="52%">
          <stop offset="0%" stopColor="#FF2D95" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FF2D95" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${uid}-disc`}>
          <circle cx="100" cy="100" r="96" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-disc)`}>
        <rect x="0" y="0" width="200" height="200" fill="#001240" />
        <rect
          x="0"
          y="0"
          width="200"
          height="200"
          fill={`url(#${uid}-grid)`}
          opacity="0.72"
        />
        <rect x="0" y="0" width="200" height="200" fill={`url(#${uid}-shade)`} />
        <rect x="0" y="0" width="200" height="200" fill={`url(#${uid}-bloom)`} />
      </g>

      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        stroke="#C7CEDB"
        strokeWidth="1"
        opacity="0.22"
      />
    </svg>
  );
}

/** A single small star, for list bullets and rule ornaments. */
export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={STAR_POINTS} fill="currentColor" />
    </svg>
  );
}
