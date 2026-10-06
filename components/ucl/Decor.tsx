/**
 * Shared decorative pieces for the UCL landing page.
 * The starfield and orb live behind content; the hairline and ribbon divide it.
 */

export function Starfield() {
  return <div className="ucl-stars" aria-hidden="true" />;
}

type OrbProps = {
  className?: string;
  drift?: boolean;
};

export function Orb({ className = "", drift = true }: OrbProps) {
  return (
    <div
      className={`ucl-orb ${drift ? "ucl-drift" : ""} ${className}`}
      aria-hidden="true"
    />
  );
}

export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`ucl-hairline ${className}`} />;
}

export function AccentRule({ className = "" }: { className?: string }) {
  return <hr className={`ucl-accent-rule ${className}`} />;
}

/** Small uppercase kicker above a heading. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="ucl-eyebrow">{children}</p>;
}
