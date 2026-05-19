import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
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
    <main className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-electric-500/20">
      <Head>
        <title>European Football</title>
        <meta name="description" content="European football club" />
        <link rel="icon" href="/logo.png" />
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
      ])),
      // Will be passed to the page component as props
    },
  }
}