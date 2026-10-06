import { Star } from "./Starball";

type UclSectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  copy?: string;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function UclSection({
  id,
  eyebrow,
  title,
  copy,
  children,
  className = "",
  align = "left",
}: UclSectionProps) {
  const centered = align === "center";

  return (
    <section
      id={id}
      className={`ucl-content scroll-mt-24 px-4 py-16 sm:px-8 lg:px-10 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-[1420px]">
        {(eyebrow || title || copy) && (
          <div className={`mb-12 max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
            {eyebrow && (
              <p
                className={`flex items-center gap-2.5 ${centered ? "justify-center" : ""}`}
              >
                <Star className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span className="ucl-eyebrow">{eyebrow}</span>
              </p>
            )}

            {title && (
              <h2 className="ucl-display mt-5 text-3xl text-white sm:text-4xl lg:text-5xl">
                {title}
              </h2>
            )}

            {/* Angled rule between heading and copy. */}
            <div
              className={`mt-6 h-[2px] w-24 bg-ucl-ribbon ${centered ? "mx-auto" : ""}`}
              style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
              aria-hidden="true"
            />

            {copy && (
              <p className="mt-6 max-w-2xl text-base leading-7 text-silver-400 sm:text-lg">
                {copy}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
