import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import LandingImage from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

function getResources(t) { return [
  { id: 'markets', category: t('website.footballMarketsAlt'), title: t('website.aSimpleGuideToFootballMarkets'), description: t('website.exploreMatchResultsGoalsAndBothTeamsToScore'), image: 'resource-markets', paragraphs: [
    [t('website.1x2MatchResult'), t('website.chooseTheHomeTeam1ADrawXOrTheAwayTeam2CheckTheMarketRulesToSeeWhichPeriodOfTheMatchCo')],
    [t('website.overUnderGoals'), t('website.chooseWhetherTheTotalNumberOfGoalsWillFinishAboveOrBelowTheLineShownOnTheMarket')],
    [t('website.bothTeamsToScore'), t('website.chooseWhetherBothTeamsWillScoreDuringThePeriodCoveredByTheMarketReviewTheSelectionAnd')],
  ] },
  { id: 'odds', category: t('website.bettingBasics'), title: t('website.understandingFootballOdds'), description: t('website.learnHowPricesAndPotentialReturnsWork'), image: 'resource-odds', paragraphs: [
    [t('website.readingDecimalOdds'), t('website.decimalOddsExpressTheTotalPotentialReturnPerUnitStakedIncludingTheOriginalStakeIfTheS')],
    [t('website.aSimpleExample'), t('website.a1000MmkStakeAtDecimalOddsOf210HasAPotentialTotalReturnOf2100MmkIncludingTheOriginal1')],
    [t('website.beforeYouConfirm'), t('website.oddsCanChangeEspeciallyDuringLiveMatchesReviewTheOddsStakePotentialReturnAndMarketRul')],
  ] },
  { id: 'wallet', category: t('website.accountWallet'), title: t('website.manageYourWalletWithConfidence'), description: t('website.aGuideToDepositsWithdrawalsAndBetHistory'), image: 'resource-wallet', paragraphs: [
    [t('website.deposits'), t('website.logInAndOpenYourWalletToSeeTheAvailablePaymentMethodsFollowTheInstructionsShownForYou')],
    [t('website.withdrawals'), t('website.useTheWithdrawalSectionOfYourAccountToReviewTheAvailableOptionsAndRequirementsCheckTh')],
    [t('website.keepTrack'), t('website.reviewYourTransactionAndBetHistoryFromYourAccountForQuestionsAboutATransactionContact')],
  ] },
]; }

export default function LandingClosing({ children }) {
  const { t } = useTranslation('common');
  const resources = getResources(t);
  const [activeGuide, setActiveGuide] = useState(null);
  const [supportUrl, setSupportUrl] = useState('https://t.me/EFC_Support');
  const dialog = useRef(null);
  const dialogHeading = useRef(null);
  const returnFocus = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/platform-settings', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        const url = result?.links?.customerSupportUrl;
        if (url && /^https:\/\//i.test(url)) setSupportUrl(url);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (activeGuide && !dialog.current.open) {
      returnFocus.current = document.activeElement;
      dialog.current.showModal();
    }
    else if (!activeGuide && dialog.current.open) dialog.current.close();
    if (activeGuide) dialogHeading.current?.focus();
  }, [activeGuide]);
  const article = resources.find(resource => resource.id === activeGuide);
  const dialogTitle = article?.title || (activeGuide === 'responsible' ? t('website.responsibleGaming') : t('website.resources'));

  return <div className={styles.closing}>
    <main id="landing-main">
    {children}
    <section className={`${styles.container} ${styles.resources} ${styles.section}`} id="resources" aria-labelledby="resources-heading">
      <header><h2 id="resources-heading">{t('website.resources')}</h2><p>{t('website.knowTheGameUnderstandYourOptions')}</p></header>
      <div className={styles.resourceList}>
        {resources.map(resource => <article key={resource.id} className={styles.resourceArticle}>
          <button type="button" className={styles.resourceLink} onClick={() => setActiveGuide(resource.id)} aria-haspopup="dialog">
            <LandingImage name={resource.image} sizes="(min-width: 1280px) 192px, (min-width: 768px) 16vw, calc(100vw - 48px)" />
            <span className={styles.resourceText}><span className={styles.category}>{resource.category}</span><span className={styles.resourceTitle}>{resource.title}</span><span className={styles.description}>{resource.description}</span></span>
            <ArrowRight className={styles.arrow} size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </article>)}
        <button type="button" className={styles.viewAll} onClick={() => setActiveGuide('all')} aria-haspopup="dialog">{t('website.viewAllResources')} <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button>
      </div>
    </section>

    <section className={`${styles.container} ${styles.cta} ${styles.section}`} aria-labelledby="closing-heading">
      <h2 id="closing-heading">{t('website.followFootball')}<br />{t('website.findYourMarket')}<br />{t('website.stayInControl')}</h2>
      <p>{t('website.compareOddsFollowLiveMatchesAndManageYourBetsWithUcl')}</p>
      <div className={styles.ctaActions}><Link href="/register/000208" className={styles.createAccount}>{t('website.createAccount')}</Link><Link href="/login" className={styles.login}>{t('website.logIn')} <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></Link></div>
      <small>{t('website.18PlayResponsibly')}</small>
    </section>

    </main>
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <div className={styles.footerTop}>
          <div className={styles.brandBlock}><a href="#home" className={styles.wordmark} aria-label={t('website.uclHome')}>UCL</a><p className={styles.tagline}>{t('website.footballBettingMadeSimple')}</p><p className={styles.brandDescription}>{t('website.clearMarketsLiveUpdatesSecureWalletControls')}</p></div>
          <nav className={styles.footerNav} aria-label={t('website.footerNavigation')}>
            <div><h3>{t('website.platform')}</h3><a href="#find-market">{t('website.footballMarketsAlt')}</a><a href="#football-moments">{t('website.liveBetting')}</a><a href="#how-it-works">{t('website.howItWorks')}</a><Link href="/register/000208">{t('website.bonuses')}</Link></div>
            <div><h3>{t('website.support')}</h3><Link href="/user/faq">{t('website.helpCenter')}</Link><button type="button" onClick={() => setActiveGuide('wallet')} aria-haspopup="dialog">{t('website.walletGuide')}</button><a href={supportUrl} target="_blank" rel="noopener noreferrer">{t('website.contactUs')}</a></div>
            <div><h3>{t('website.legal')}</h3><Link href="/terms">{t('website.termsOfService')}</Link><Link href="/privacy">{t('website.privacyPolicy')}</Link><button type="button" onClick={() => setActiveGuide('responsible')} aria-haspopup="dialog">{t('website.responsibleGamingAlt')}</button></div>
          </nav>
        </div>
        <div className={styles.footerBottom}><p>{t('website.2026UclAllRightsReserved')}</p><button type="button" onClick={() => setActiveGuide('responsible')} aria-label={t('website.18AndOverReadAboutResponsibleGaming')} aria-haspopup="dialog"><span className={styles.ageBadge}>18+</span>{t('website.playResponsibly')}</button></div>
      </div>
    </footer>

    <dialog ref={dialog} className={styles.guideDialog} aria-labelledby="guide-title" onClose={() => { setActiveGuide(null); returnFocus.current?.focus(); }} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current.close(); } }}>
      <button type="button" className={styles.closeDialog} aria-label={t('website.closeGuide')} onClick={() => dialog.current.close()}><X size={24} strokeWidth={2} aria-hidden="true" /></button>
      {article && <p className={styles.category}>{article.category}</p>}
      <h2 ref={dialogHeading} tabIndex={-1} id="guide-title">{dialogTitle}</h2>
      {article ? <><p className={styles.guideIntro}>{article.description}</p>{article.paragraphs.map(([heading, text]) => <section className={styles.guideSection} key={heading}><h3>{heading}</h3><p>{text}</p></section>)}</> : activeGuide === 'responsible' ? <div className={styles.guideSection}><p>{t('website.bettingIsForAdultsAged18AndOverOnlyBetWithMoneyYouCanAffordToLoseSetABudgetAndTakeReg')}</p><p>{t('website.neverChaseLossesOrTreatBettingAsAWayToEarnIncomeIfBettingIsAffectingYourFinancesOrWel')}</p><p><a href={supportUrl} target="_blank" rel="noopener noreferrer">{t('website.contactSupport')}</a> {t('website.forQuestionsAboutYourAccount')}</p></div> : <div className={styles.guideIndex}>{resources.map(resource => <button type="button" key={resource.id} onClick={() => setActiveGuide(resource.id)}><span>{resource.title}</span><ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button>)}</div>}
    </dialog>
  </div>;
}
