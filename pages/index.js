import Head from 'next/head'
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";

const FeatureSections = dynamic(() =>
  import("@/components/FeatureSections").then((mod) => mod.FeatureSections)
);
const ShowcaseSections = dynamic(() =>
  import("@/components/ShowcaseSections").then((mod) => mod.ShowcaseSections)
);
const FinalCtaFooter = dynamic(() =>
  import("@/components/FinalCtaFooter").then((mod) => mod.FinalCtaFooter)
);

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-electric-500/20">
      <Head>
        <title>EFC Football Betting | Live Odds and Football Markets</title>
        <meta
          name="description"
          content="Bet on football with EFC. Browse football markets, compare live odds, manage your wallet, and play responsibly."
        />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <Hero />
      <FeatureSections />
      <ShowcaseSections />
      <FinalCtaFooter />
    </main>
  );
}
