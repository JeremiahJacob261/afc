type SponsorMarkProps = {
  name: string;
  initials: string;
  domain?: string;
};

export function SponsorMark({ name, initials, domain }: SponsorMarkProps) {
  return (
    <div className="group flex h-16 items-center justify-center gap-3 rounded-full bg-white/70 px-5 text-navy-950 shadow-[0_14px_44px_rgba(6,16,31,0.07)] ring-1 ring-navy-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      {domain ? (
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={`${name} logo`}
          className="h-8 w-8 object-contain"
        />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-950 text-xs font-black text-white transition duration-300 group-hover:bg-electric-500">
          {initials}
        </span>
      )}
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 transition duration-300 group-hover:text-navy-950">
        {name}
      </span>
    </div>
  );
}
