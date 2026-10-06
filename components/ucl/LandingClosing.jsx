import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import LandingImage from './LandingImage';
import styles from '@/styles/LandingSystem.module.css';

const resources = [
  { id: 'markets', category: 'FOOTBALL MARKETS', title: 'A simple guide to football markets', description: 'Explore match results, goals, and both teams to score.', image: 'resource-markets', paragraphs: [
    ['1X2 Match Result', 'Choose the home team (1), a draw (X), or the away team (2). Check the market rules to see which period of the match counts.'],
    ['Over / Under Goals', 'Choose whether the total number of goals will finish above or below the line shown on the market.'],
    ['Both Teams To Score', 'Choose whether both teams will score during the period covered by the market. Review the selection and the current odds before confirming your slip.'],
  ] },
  { id: 'odds', category: 'BETTING BASICS', title: 'Understanding football odds', description: 'Learn how prices and potential returns work.', image: 'resource-odds', paragraphs: [
    ['Reading decimal odds', 'Decimal odds express the total potential return per unit staked, including the original stake, if the selection wins.'],
    ['A simple example', 'A 1,000 FCFA stake at decimal odds of 2.10 has a potential total return of 2,100 FCFA, including the original 1,000 FCFA stake. A losing selection loses the stake.'],
    ['Before you confirm', 'Odds can change, especially during live matches. Review the odds, stake, potential return, and market rules shown on your slip before confirming.'],
  ] },
  { id: 'wallet', category: 'ACCOUNT & WALLET', title: 'Manage your wallet with confidence', description: 'A guide to deposits, withdrawals, and bet history.', image: 'resource-wallet', paragraphs: [
    ['Deposits', 'Log in and open your wallet to see the available payment methods. Follow the instructions shown for your selected method and review the amount before confirming.'],
    ['Withdrawals', 'Use the withdrawal section of your account to review the available options and requirements. Check the details carefully before submitting your request.'],
    ['Keep track', 'Review your transaction and bet history from your account. For questions about a transaction, contact support with its reference. Never share your password or verification codes.'],
  ] },
];

export default function LandingClosing({ children }) {
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
  const dialogTitle = article?.title || (activeGuide === 'responsible' ? 'Responsible gaming' : 'Resources');

  return <div className={styles.closing}>
    <main id="landing-main">
    {children}
    <section className={`${styles.container} ${styles.resources} ${styles.section}`} id="resources" aria-labelledby="resources-heading">
      <header><h2 id="resources-heading">Resources</h2><p>Know the game. Understand your options.</p></header>
      <div className={styles.resourceList}>
        {resources.map(resource => <article key={resource.id} className={styles.resourceArticle}>
          <button type="button" className={styles.resourceLink} onClick={() => setActiveGuide(resource.id)} aria-haspopup="dialog">
            <LandingImage name={resource.image} sizes="(min-width: 1280px) 192px, (min-width: 768px) 16vw, calc(100vw - 48px)" />
            <span className={styles.resourceText}><span className={styles.category}>{resource.category}</span><span className={styles.resourceTitle}>{resource.title}</span><span className={styles.description}>{resource.description}</span></span>
            <ArrowRight className={styles.arrow} size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </article>)}
        <button type="button" className={styles.viewAll} onClick={() => setActiveGuide('all')} aria-haspopup="dialog">View all resources <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button>
      </div>
    </section>

    <section className={`${styles.container} ${styles.cta} ${styles.section}`} aria-labelledby="closing-heading">
      <h2 id="closing-heading">Follow football.<br />Find your market.<br />Stay in control.</h2>
      <p>Compare odds, follow live matches, and manage your bets with UCL.</p>
      <div className={styles.ctaActions}><Link href="/register/000208" className={styles.createAccount}>Create Account</Link><Link href="/login" className={styles.login}>Log in <ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></Link></div>
      <small>18+ · Play responsibly.</small>
    </section>

    </main>
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <div className={styles.footerTop}>
          <div className={styles.brandBlock}><a href="#home" className={styles.wordmark} aria-label="UCL home">UCL</a><p className={styles.tagline}>Football betting made simple.</p><p className={styles.brandDescription}>Clear markets. Live updates. Secure wallet controls.</p></div>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <div><h3>Platform</h3><a href="#find-market">Football Markets</a><a href="#football-moments">Live Betting</a><a href="#how-it-works">How It Works</a><Link href="/register/000208">Bonuses</Link></div>
            <div><h3>Support</h3><Link href="/user/faq">Help Center</Link><button type="button" onClick={() => setActiveGuide('wallet')} aria-haspopup="dialog">Wallet Guide</button><a href={supportUrl} target="_blank" rel="noopener noreferrer">Contact Us</a></div>
            <div><h3>Legal</h3><Link href="/terms">Terms of Service</Link><Link href="/privacy">Privacy Policy</Link><button type="button" onClick={() => setActiveGuide('responsible')} aria-haspopup="dialog">Responsible Gaming</button></div>
          </nav>
        </div>
        <div className={styles.footerBottom}><p>© 2026 UCL. All rights reserved.</p><button type="button" onClick={() => setActiveGuide('responsible')} aria-label="18 and over. Read about responsible gaming" aria-haspopup="dialog"><span className={styles.ageBadge}>18+</span>Play responsibly.</button></div>
      </div>
    </footer>

    <dialog ref={dialog} className={styles.guideDialog} aria-labelledby="guide-title" onClose={() => { setActiveGuide(null); returnFocus.current?.focus(); }} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current.close(); } }}>
      <button type="button" className={styles.closeDialog} aria-label="Close guide" onClick={() => dialog.current.close()}><X size={24} strokeWidth={2} aria-hidden="true" /></button>
      {article && <p className={styles.category}>{article.category}</p>}
      <h2 ref={dialogHeading} tabIndex={-1} id="guide-title">{dialogTitle}</h2>
      {article ? <><p className={styles.guideIntro}>{article.description}</p>{article.paragraphs.map(([heading, text]) => <section className={styles.guideSection} key={heading}><h3>{heading}</h3><p>{text}</p></section>)}</> : activeGuide === 'responsible' ? <div className={styles.guideSection}><p>Betting is for adults aged 18 and over. Only bet with money you can afford to lose, set a budget, and take regular breaks.</p><p>Never chase losses or treat betting as a way to earn income. If betting is affecting your finances or wellbeing, stop and seek support.</p><p><a href={supportUrl} target="_blank" rel="noopener noreferrer">Contact support</a> for questions about your account.</p></div> : <div className={styles.guideIndex}>{resources.map(resource => <button type="button" key={resource.id} onClick={() => setActiveGuide(resource.id)}><span>{resource.title}</span><ArrowRight size={24} strokeWidth={2} aria-hidden="true" /></button>)}</div>}
    </dialog>
  </div>;
}
