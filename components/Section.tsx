type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  copy?: string;
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
};

export function Section({ id, eyebrow, title, copy, children, dark, className = "" }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {(eyebrow || title || copy) && (
          <div className={`mb-10 max-w-3xl ${dark ? "text-white" : "text-navy-950"}`}>
            {eyebrow && (
              <p className={`mb-3 text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-electric-400" : "text-electric-600"}`}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-balance text-3xl font-black leading-[0.96] sm:text-5xl lg:text-6xl">
                {title}
              </h2>
            )}
            {copy && (
              <p className={`mt-5 max-w-2xl text-base leading-7 sm:text-lg ${dark ? "text-white/68" : "text-slate-600"}`}>
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
