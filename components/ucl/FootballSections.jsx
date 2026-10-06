import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import LandingImage from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

const register = '/register/000208';
const markets = [
  { name: 'Live Betting', image: 'carousel-live', icon: 'market-stopwatch', detail: 'Live match updates' },
  { name: 'Over / Under Goals', image: 'carousel-goals', icon: 'market-goal', detail: 'Total goals' },
  { name: '1X2 Match Result', image: 'carousel-result', icon: 'market-trophy', detail: 'Home / Draw / Away' },
  { name: 'Both Teams To Score', image: 'carousel-btts', icon: 'market-balls', detail: 'Both sides to find the net' },
  { name: 'Correct Score', image: 'carousel-score', icon: 'market-scoreboard', detail: 'The final score' },
];
const fixtures = [
  { home: 'Real Madrid', away: 'Barcelona', badges: ['madrid', 'barcelona'] },
  { home: 'Manchester City', away: 'Liverpool', badges: ['city', 'liverpool'] },
  { home: 'Inter', away: 'AC Milan', badges: ['inter', 'milan'] },
];

export default function FootballSections() {
  const [slide, setSlide] = useState(2);
  const [fixtureMarket, setFixtureMarket] = useState('1X2');
  const start = Math.min(Math.max(slide - 1, 0), markets.length - 3);
  const move = amount => setSlide(current => Math.max(0, Math.min(markets.length - 1, current + amount)));
  return <>
    <section className={`${styles.container} ${styles.section} ${styles.carouselSection}`} aria-labelledby="football-moments">
      <header className={styles.carouselHeading}><h2 id="football-moments">Bet on the moments that decide a match.</h2><p>Choose simple football markets before kickoff or follow live odds while the match is running.</p></header>
      <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Football markets" onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
        <div className={styles.carouselTrack}>
          {markets.map((market, index) => <Link key={market.name} href={register} className={styles.slide} data-active={index === slide} data-visible={index >= start && index < start + 3} aria-label={`Explore ${market.name}`}>
            <LandingImage name={market.image} className={styles.carouselPhoto} /><h3>{market.name}</h3><p className={styles.slideDetail} aria-hidden={index !== slide}>{market.detail}</p>
          </Link>)}
        </div>
        <div className={styles.carouselControls}>
          <div className={styles.dots} aria-label="Choose a market slide">{markets.map((market, index) => <button type="button" key={market.name} aria-label={`Show ${market.name}`} aria-pressed={slide === index} onClick={() => setSlide(index)}><span /></button>)}</div>
          <div className={styles.carouselArrows}><button type="button" aria-label="Previous market" disabled={slide === 0} onClick={() => move(-1)}><ArrowLeft size={24} strokeWidth={2} aria-hidden="true" /></button><button type="button" aria-label="Next market" disabled={slide === markets.length - 1} onClick={() => move(1)}><ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button></div>
        </div>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section} ${styles.focusSection}`} aria-labelledby="football-focus">
      <header className={styles.featureHeading}><h2 id="football-focus">Everything focused on football betting.</h2><p>Clear football markets, secure wallet controls, and simple bet tracking.</p></header>
      <div className={styles.featureGrid}>
        <article className={`${styles.card} ${styles.oddsCard}`}>
          <div className={styles.fixtureTabs} role="group" aria-label="Preview a football market">{['1X2', 'Goals', 'BTTS'].map(name => <button type="button" key={name} aria-pressed={fixtureMarket === name} onClick={() => setFixtureMarket(name)}>{name}</button>)}</div>
          <div className={styles.fixtures}>{fixtures.map(fixture => <Link href={register} className={styles.fixture} key={fixture.home} aria-label={`${fixture.home} versus ${fixture.away}, ${fixtureMarket} market`}><LandingImage name={`badge-${fixture.badges[0]}`} sizes="24px" /><span>VS</span><LandingImage name={`badge-${fixture.badges[1]}`} sizes="24px" /><span className={styles.fixturePreview} aria-hidden="true">{fixtureMarket === '1X2' ? <><i /><i /></> : fixtureMarket === 'Goals' ? 'O / U' : 'Yes / No'}</span><ChevronRight size={24} strokeWidth={2} aria-hidden="true" /></Link>)}</div>
          <h3>Competitive football odds</h3><p>Compare clear prices across popular match markets.</p>
        </article>
        <article className={`${styles.card} ${styles.marketsCard}`}><div className={styles.marketPills}>{['Match Result', 'Goals', 'BTTS', 'Correct Score', 'Live'].map(name => <Link href={register} key={name}>{name}</Link>)}</div><LandingImage name="market-ball" className={styles.grassBall} /><div className={styles.cardCaption}><h3>Football markets</h3><p>Explore all the key betting markets in one place.</p></div></article>
        <article className={`${styles.card} ${styles.liveCard}`}><h3>Follow in-play movement as football matches change minute by minute.</h3><span className={styles.liveRule} aria-hidden="true" /><p>Live match updates</p><LandingImage name="blue-stadium" /></article>
        <Link href="/login" className={`${styles.card} ${styles.walletCard}`}><LandingImage name="blue-wallet" /><div><h3>Secure wallet controls</h3><p>Manage deposits, withdrawals, and bet history from your account.</p></div></Link>
        <article className={`${styles.card} ${styles.flowCard}`}><div className={styles.steps} aria-label="Three steps"><span>1</span><i /><span>2</span><i /><span>3</span></div><h3>Fast bet slip flow</h3><p>Move from fixture to confirmed bet with fewer steps.</p></article>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section} ${styles.workflowSection}`} id="how-it-works" aria-labelledby="fixture-heading"><h2 className={styles.workflowHeading} id="fixture-heading">From fixture to confirmed football bet.</h2><div className={styles.workflowGrid}>
      <figure className={`${styles.card} ${styles.matchCard}`}><LandingImage name="match-phone" alt="Phone displaying a football live-score preview" /><figcaption><h3>Follow the match</h3><p>Live scores and match updates.</p><small>FotMob live-score preview</small></figcaption></figure>
      <Link href={register} className={`${styles.card} ${styles.stepCard}`}><span className={styles.stepNumber}>1</span><LandingImage name="account-card" /><div><h3>Create your account</h3><p>Register with UCL and secure your football betting profile.</p></div></Link>
      <Link href="/login" className={`${styles.card} ${styles.stepCard}`}><span className={styles.stepNumber}>2</span><LandingImage name="fund-wallet" /><div><h3>Fund your wallet</h3><p>Start from the 3,000 FCFA minimum deposit.</p></div></Link>
      <Link href="/login" className={`${styles.card} ${styles.trackCard}`}><LandingImage name="blue-check" /><div><h3>Place and track</h3><p>Confirm your slip, follow the match, and review withdrawal status.</p></div></Link>
    </div></section>
    <section className={`${styles.container} ${styles.section} ${styles.findMarkets}`} aria-labelledby="find-market"><h2 id="find-market">Find your football market.</h2><div className={styles.findGrid}>{[markets[2], markets[1], markets[3], markets[4], markets[0]].map(market => <Link href={register} key={market.name} className={styles.marketTile}><LandingImage name={market.icon} /><h3>{market.name}</h3></Link>)}</div></section>
  </>;
}
