import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';
import FootballSections from './FootballSections';
import LandingClosing from './LandingClosing';
import LandingImage, { imageSourceSet } from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

export default function Home() {
  return <div className={styles.page} id="home">
    <Head>
      <title>UCL — Football Betting Made Simple.</title>
      <meta name="description" content="Pick football matches, compare odds, place secure bets, and follow every result from one clear UCL betting experience." />
      <link rel="preload" as="image" type="image/avif" imageSrcSet={imageSourceSet('hero', 'avif')} imageSizes="100vw" />
    </Head>
    <header className={styles.hero}>
      <div className={styles.heroArtwork} aria-hidden="true"><LandingImage name="hero" eager sizes="100vw" /></div>
      <nav className={`${styles.container} ${styles.nav}`} aria-label="Main navigation">
        <a className={styles.brand} href="#home" aria-label="UCL home">UCL</a>
        <div className={styles.navLinks}><a href="#markets">Markets</a><a href="#football-moments">Live Betting</a><a href="#how-it-works">How It Works</a><Link href="/register/000208">Bonuses</Link></div>
        <Link className={styles.join} href="/register/000208">Join Now</Link>
      </nav>
      <div className={`${styles.container} ${styles.heroCopy}`}>
        <h1>Football Betting<br />Made Simple.</h1>
        <p>Pick football matches, compare odds, place secure bets, and follow every result from one clear UCL betting experience.</p>
        <div className={styles.actions}><Link className={styles.create} href="/register/000208">Create Account</Link><Link className={styles.login} href="/login">Log in</Link></div>
      </div>
    </header>
    <LandingClosing>
      <section className={`${styles.container} ${styles.features} ${styles.section}`} aria-label="UCL features">
        <article><LandingImage name="football" /><h2>Competitive football odds</h2><p>Compare clear prices across popular match markets.</p></article>
        <article><LandingImage name="floodlight" /><h2>Live match updates</h2><p>Follow in-play movement as football matches change minute by minute.</p></article>
        <article><div className={styles.walletImage}><LandingImage name="wallet" /><span aria-hidden="true">UCL</span></div><h2>Secure wallet controls</h2><p>Manage deposits, withdrawals, and bet history from your account.</p></article>
      </section>
      <section className={`${styles.container} ${styles.marketPanel} ${styles.section}`} id="markets" aria-labelledby="market-heading">
        <nav className={styles.tabs} aria-label="Explore UCL"><a href="#markets" aria-current="location">Football markets</a><a href="#football-moments">Live Betting</a><a href="#how-it-works">How It Works</a></nav>
        <div className={styles.marketCopy}>
          <p className={styles.eyebrow}>FOOTBALL MARKETS</p><h2 id="market-heading">Bet on the moments that decide a match</h2><p>Choose simple football markets before kickoff or follow live odds while the match is running.</p>
          <div className={styles.marketDetails}><article><h3>1X2 Match Result</h3><p>Pick the match winner or back the draw before kickoff.</p></article><article><h3>Both Teams To Score</h3><p>Back both sides to find the net in the same match.</p></article></div>
        </div>
        <figure className={styles.phoneFigure}><div className={styles.phone}><div className={styles.phoneTop}><Trophy size={32} strokeWidth={2} aria-hidden="true" /><span className={styles.odds}>2.18</span></div><div className={styles.phoneCopy}><p className={styles.phoneLabel}>HOME / DRAW / AWAY</p><h3>1X2 Match Result</h3><p>Pick the match winner or back the draw before kickoff.</p><Link href="/register/000208" className={styles.pick}>Pick market <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></Link></div></div><figcaption>Actual UCL website screenshot</figcaption></figure>
      </section>
      <FootballSections />
    </LandingClosing>
  </div>;
}

