import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import LandingImage from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

const register = '/register/000208';
function getMarkets(t) { return [
  { name: t('website.liveBetting'), image: 'carousel-live', icon: 'market-stopwatch', detail: t('website.liveMatchUpdates') },
  { name: t('website.overUnderGoals'), image: 'carousel-goals', icon: 'market-goal', detail: t('website.totalGoals') },
  { name: t('website.1x2MatchResult'), image: 'carousel-result', icon: 'market-trophy', detail: t('website.homeDrawAwayLabel') },
  { name: t('website.bothTeamsToScore'), image: 'carousel-btts', icon: 'market-balls', detail: t('website.bothSidesToFindTheNet') },
  { name: t('website.correctScore'), image: 'carousel-score', icon: 'market-scoreboard', detail: t('website.theFinalScore') },
]; }
const fixtures = [
  { home: 'Real Madrid', away: 'Barcelona', badges: ['madrid', 'barcelona'] },
  { home: 'Manchester City', away: 'Liverpool', badges: ['city', 'liverpool'] },
  { home: 'Inter', away: 'AC Milan', badges: ['inter', 'milan'] },
];

export default function FootballSections() {
  const { t } = useTranslation('common');
  const markets = getMarkets(t);
  const [slide, setSlide] = useState(2);
  const [fixtureMarket, setFixtureMarket] = useState('1X2');
  const start = Math.min(Math.max(slide - 1, 0), markets.length - 3);
  const move = amount => setSlide(current => Math.max(0, Math.min(markets.length - 1, current + amount)));
  return <>
    <section className={`${styles.container} ${styles.section} ${styles.carouselSection}`} aria-labelledby="football-moments">
      <header className={styles.carouselHeading}><h2 id="football-moments">{t('website.betOnTheMomentsThatDecideAMatchAlt')}</h2><p>{t('website.chooseSimpleFootballMarketsBeforeKickoffOrFollowLiveOddsWhileTheMatchIsRunning')}</p></header>
      <div className={styles.carousel} role="region" aria-roledescription={t('website.carouselDescription')} aria-label={t('website.footballMarkets')} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
        <div className={styles.carouselTrack}>
          {markets.map((market, index) => <Link key={market.name} href={register} className={styles.slide} data-active={index === slide} data-visible={index >= start && index < start + 3} aria-label={t('website.exploreMarket', { market: market.name })}>
            <LandingImage name={market.image} className={styles.carouselPhoto} /><h3>{market.name}</h3><p className={styles.slideDetail} aria-hidden={index !== slide}>{market.detail}</p>
          </Link>)}
        </div>
        <div className={styles.carouselControls}>
          <div className={styles.dots} aria-label={t('website.chooseAMarketSlide')}>{markets.map((market, index) => <button type="button" key={market.name} aria-label={t('website.showMarket', { market: market.name })} aria-pressed={slide === index} onClick={() => setSlide(index)}><span /></button>)}</div>
          <div className={styles.carouselArrows}><button type="button" aria-label={t('website.previousMarket')} disabled={slide === 0} onClick={() => move(-1)}><ArrowLeft size={24} strokeWidth={2} aria-hidden="true" /></button><button type="button" aria-label={t('website.nextMarket')} disabled={slide === markets.length - 1} onClick={() => move(1)}><ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button></div>
        </div>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section} ${styles.focusSection}`} aria-labelledby="football-focus">
      <header className={styles.featureHeading}><h2 id="football-focus">{t('website.everythingFocusedOnFootballBetting')}</h2><p>{t('website.clearFootballMarketsSecureWalletControlsAndSimpleBetTracking')}</p></header>
      <div className={styles.featureGrid}>
        <article className={`${styles.card} ${styles.oddsCard}`}>
          <div className={styles.fixtureTabs} role="group" aria-label={t('website.previewAFootballMarket')}>{['1X2', 'Goals', 'BTTS'].map(name => <button type="button" key={name} aria-pressed={fixtureMarket === name} onClick={() => setFixtureMarket(name)}>{name === 'Goals' ? t('website.goals') : name}</button>)}</div>
          <div className={styles.fixtures}>{fixtures.map(fixture => <Link href={register} className={styles.fixture} key={fixture.home} aria-label={t('website.fixturePreview', { home: fixture.home, away: fixture.away, market: fixtureMarket === 'Goals' ? t('website.goals') : fixtureMarket })}><LandingImage name={`badge-${fixture.badges[0]}`} sizes="24px" /><span>VS</span><LandingImage name={`badge-${fixture.badges[1]}`} sizes="24px" /><span className={styles.fixturePreview} aria-hidden="true">{fixtureMarket === '1X2' ? <><i /><i /></> : fixtureMarket === 'Goals' ? t('website.overUnder') : t('website.yesNo')}</span><ChevronRight size={24} strokeWidth={2} aria-hidden="true" /></Link>)}</div>
          <h3>{t('website.competitiveFootballOdds')}</h3><p>{t('website.compareClearPricesAcrossPopularMatchMarkets')}</p>
        </article>
        <article className={`${styles.card} ${styles.marketsCard}`}><div className={styles.marketPills}>{[t('website.matchResult'), t('website.goals'), 'BTTS', t('website.correctScore'), t('website.live')].map(name => <Link href={register} key={name}>{name}</Link>)}</div><LandingImage name="market-ball" className={styles.grassBall} /><div className={styles.cardCaption}><h3>{t('website.footballMarkets')}</h3><p>{t('website.exploreAllTheKeyBettingMarketsInOnePlace')}</p></div></article>
        <article className={`${styles.card} ${styles.liveCard}`}><h3>{t('website.followInPlayMovementAsFootballMatchesChangeMinuteByMinute')}</h3><span className={styles.liveRule} aria-hidden="true" /><p>{t('website.liveMatchUpdates')}</p><LandingImage name="blue-stadium" /></article>
        <Link href="/login" className={`${styles.card} ${styles.walletCard}`}><LandingImage name="blue-wallet" /><div><h3>{t('website.secureWalletControls')}</h3><p>{t('website.manageDepositsWithdrawalsAndBetHistoryFromYourAccount')}</p></div></Link>
        <article className={`${styles.card} ${styles.flowCard}`}><div className={styles.steps} aria-label={t('website.threeSteps')}><span>1</span><i /><span>2</span><i /><span>3</span></div><h3>{t('website.fastBetSlipFlow')}</h3><p>{t('website.moveFromFixtureToConfirmedBetWithFewerSteps')}</p></article>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section} ${styles.workflowSection}`} id="how-it-works" aria-labelledby="fixture-heading"><h2 className={styles.workflowHeading} id="fixture-heading">{t('website.fromFixtureToConfirmedFootballBet')}</h2><div className={styles.workflowGrid}>
      <figure className={`${styles.card} ${styles.matchCard}`}><LandingImage name="match-phone" alt={t('website.phoneDisplayingAFootballLiveScorePreview')} /><figcaption><h3>{t('website.followTheMatch')}</h3><p>{t('website.liveScoresAndMatchUpdates')}</p><small>{t('website.fotmobLiveScorePreview')}</small></figcaption></figure>
      <Link href={register} className={`${styles.card} ${styles.stepCard}`}><span className={styles.stepNumber}>1</span><LandingImage name="account-card" /><div><h3>{t('website.createYourAccount')}</h3><p>{t('website.registerWithUclAndSecureYourFootballBettingProfile')}</p></div></Link>
      <Link href="/login" className={`${styles.card} ${styles.stepCard}`}><span className={styles.stepNumber}>2</span><LandingImage name="fund-wallet" /><div><h3>{t('website.fundYourWallet')}</h3><p>{t('website.reviewTheMinimumDepositShownForYourChosenPaymentMethod')}</p></div></Link>
      <Link href="/login" className={`${styles.card} ${styles.trackCard}`}><LandingImage name="blue-check" /><div><h3>{t('website.placeAndTrack')}</h3><p>{t('website.confirmYourSlipFollowTheMatchAndReviewWithdrawalStatus')}</p></div></Link>
    </div></section>
    <section className={`${styles.container} ${styles.section} ${styles.findMarkets}`} aria-labelledby="find-market"><h2 id="find-market">{t('website.findYourFootballMarket')}</h2><div className={styles.findGrid}>{[markets[2], markets[1], markets[3], markets[4], markets[0]].map(market => <Link href={register} key={market.name} className={styles.marketTile}><LandingImage name={market.icon} /><h3>{market.name}</h3></Link>)}</div></section>
  </>;
}
