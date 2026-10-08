import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';
import FootballSections from './FootballSections';
import LandingClosing from './LandingClosing';
import LandingImage, { imageSourceSet } from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

export default function Home() {
  const { t } = useTranslation('common');
  return <div className={styles.page} id="home">
    <Head>
      <title>{t('website.uclFootballBettingMadeSimple')}</title>
      <meta name="description" content={t('website.pickFootballMatchesCompareOddsPlaceSecureBetsAndFollowEveryResultFromOneClearUclBetti')} />
      <link rel="preload" as="image" type="image/avif" imageSrcSet={imageSourceSet('hero', 'avif')} imageSizes="100vw" />
    </Head>
    <header className={styles.hero}>
      <div className={styles.heroArtwork} aria-hidden="true"><LandingImage name="hero" eager sizes="100vw" /></div>
      <nav className={`${styles.container} ${styles.nav}`} aria-label={t('website.mainNavigation')}>
        <a className={styles.brand} href="#home" aria-label={t('website.uclHome')}>UCL</a>
        <div className={styles.navLinks}><a href="#markets">{t('website.markets')}</a><a href="#football-moments">{t('website.liveBetting')}</a><a href="#how-it-works">{t('website.howItWorks')}</a><Link href="/register/000208">{t('website.bonuses')}</Link></div>
        <div className={styles.navActions}><LocaleSwitcher compact /><Link className={styles.join} href="/register/000208">{t('website.joinNow')}</Link></div>
      </nav>
      <div className={`${styles.container} ${styles.heroCopy}`}>
        <h1>{t('website.footballBetting')}<br />{t('website.madeSimple')}</h1>
        <p>{t('website.pickFootballMatchesCompareOddsPlaceSecureBetsAndFollowEveryResultFromOneClearUclBetti')}</p>
        <div className={styles.actions}><Link className={styles.create} href="/register/000208">{t('website.createAccount')}</Link><Link className={styles.login} href="/login">{t('website.logIn')}</Link></div>
      </div>
    </header>
    <LandingClosing>
      <section className={`${styles.container} ${styles.features} ${styles.section}`} aria-label={t('website.uclFeatures')}>
        <article><LandingImage name="football" /><h2>{t('website.competitiveFootballOdds')}</h2><p>{t('website.compareClearPricesAcrossPopularMatchMarkets')}</p></article>
        <article><LandingImage name="floodlight" /><h2>{t('website.liveMatchUpdates')}</h2><p>{t('website.followInPlayMovementAsFootballMatchesChangeMinuteByMinute')}</p></article>
        <article><div className={styles.walletImage}><LandingImage name="wallet" /><span aria-hidden="true">UCL</span></div><h2>{t('website.secureWalletControls')}</h2><p>{t('website.manageDepositsWithdrawalsAndBetHistoryFromYourAccount')}</p></article>
      </section>
      <section className={`${styles.container} ${styles.marketPanel} ${styles.section}`} id="markets" aria-labelledby="market-heading">
        <nav className={styles.tabs} aria-label={t('website.exploreUcl')}><a href="#markets" aria-current="location">{t('website.footballMarkets')}</a><a href="#football-moments">{t('website.liveBetting')}</a><a href="#how-it-works">{t('website.howItWorks')}</a></nav>
        <div className={styles.marketCopy}>
          <p className={styles.eyebrow}>{t('website.footballMarketsAlt')}</p><h2 id="market-heading">{t('website.betOnTheMomentsThatDecideAMatch')}</h2><p>{t('website.chooseSimpleFootballMarketsBeforeKickoffOrFollowLiveOddsWhileTheMatchIsRunning')}</p>
          <div className={styles.marketDetails}><article><h3>{t('website.1x2MatchResult')}</h3><p>{t('website.pickTheMatchWinnerOrBackTheDrawBeforeKickoff')}</p></article><article><h3>{t('website.bothTeamsToScore')}</h3><p>{t('website.backBothSidesToFindTheNetInTheSameMatch')}</p></article></div>
        </div>
        <figure className={styles.phoneFigure}><div className={styles.phone}><div className={styles.phoneTop}><Trophy size={32} strokeWidth={2} aria-hidden="true" /><span className={styles.odds}>2.18</span></div><div className={styles.phoneCopy}><p className={styles.phoneLabel}>{t('website.homeDrawAway')}</p><h3>{t('website.1x2MatchResult')}</h3><p>{t('website.pickTheMatchWinnerOrBackTheDrawBeforeKickoff')}</p><Link href="/register/000208" className={styles.pick}>{t('website.pickMarket')} <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></Link></div></div><figcaption>{t('website.actualUclWebsiteScreenshot')}</figcaption></figure>
      </section>
      <FootballSections />
    </LandingClosing>
  </div>;
}

