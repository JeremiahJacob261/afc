import Head from 'next/head'
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { getI18nServerSideProps } from "@/lib/i18nServerSideProps";

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
  const { t } = useTranslation("common");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-electric-500/20">
      <Head>
        <title>{t("landing.meta.title")}</title>
        <meta
          name="description"
          content={t("landing.meta.description")}
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await getI18nServerSideProps(locale)),
    },
  };
}
