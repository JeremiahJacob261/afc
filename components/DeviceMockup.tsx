import { ChartLine } from "./ChartLine";

type DeviceMockupProps = {
  className?: string;
};

export function DeviceMockup({ className = "" }: DeviceMockupProps) {
  return (
    <div className={`relative mx-auto aspect-[9/19] w-full max-w-[270px] rounded-[2.4rem] bg-navy-950 p-3 shadow-[0_30px_90px_rgba(6,16,31,0.34)] ring-1 ring-white/20 ${className}`}>
      <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-navy-950" />
      <div className="h-full overflow-hidden rounded-[1.8rem] bg-white">
        <div className="bg-premium-radial px-5 pb-6 pt-12 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-electric-400">EFC Live</p>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-white/62">Portfolio</p>
              <p className="text-3xl font-black">$86,420</p>
            </div>
            <span className="rounded-full bg-electric-500/20 px-3 py-1 text-xs font-black text-electric-400">
              +24.8%
            </span>
          </div>
          <ChartLine className="mt-5 h-16 w-full" color="#23B5FF" />
        </div>
        <div className="space-y-3 p-4">
          {[
            ["Madrid Crown", "2.18", "+7.2%"],
            ["London Serve", "1.64", "+3.9%"],
            ["Milan Press", "58%", "-1.1%"],
          ].map(([name, odd, move]) => (
            <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-100 p-3">
              <div>
                <p className="text-sm font-black text-navy-950">{name}</p>
                <p className="text-xs text-slate-500">Market signal</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-navy-950">{odd}</p>
                <p className={`text-xs font-bold ${move.startsWith("-") ? "text-brick-600" : "text-emerald-600"}`}>{move}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
