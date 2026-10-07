import { useState } from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, CreditCard, Gift, History, Home,
  Menu, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trophy, UserRound,
  Wallet, Zap,
} from 'lucide-react';
import './UCLMatchdayBoardMobile.css';

type Fixture = {
  league: string;
  time: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeColor: string;
  awayColor: string;
  odds: [string, string, string];
  live?: boolean;
};

const fixtures: Fixture[] = [
  { league: 'EUROPE · GROUP STAGE', time: '20:00', home: 'Real Madrid', away: 'Barcelona', homeCode: 'RM', awayCode: 'FCB', homeColor: 'gold', awayColor: 'claret', odds: ['7.20', '8.40', '11.00'] },
  { league: 'EUROPE · GROUP STAGE', time: '20:00', home: 'Manchester City', away: 'Inter Milan', homeCode: 'MC', awayCode: 'IM', homeColor: 'sky', awayColor: 'blue', odds: ['8.10', '9.60', '12.50'] },
  { league: 'EUROPE · GROUP STAGE', time: '21:00', home: 'Bayern Munich', away: 'Liverpool', homeCode: 'BM', awayCode: 'LFC', homeColor: 'red', awayColor: 'deepred', odds: ['7.80', '9.20', '13.00'] },
];

const slides = [
  { eyebrow: 'MATCHDAY INSIGHT', title: 'Stay close to every moment.', body: 'Follow fixtures, odds and results from one clear view.', icon: Zap },
  { eyebrow: 'FOOTBALL MARKETS', title: 'Find your next market.', body: 'Explore match result, goals and correct score selections.', icon: Trophy },
  { eyebrow: 'YOUR ACCOUNT', title: 'Keep your play in view.', body: 'Check your bets, wallet activity and match updates.', icon: ShieldCheck },
];

const dates = ['Today', 'Next 3h', 'Next 12h', 'Tomorrow'];

function Crest({ code, color }: { code: string; color: string }) {
  return <span className={`ucl-crest ucl-crest--${color}`} aria-hidden="true">{code}</span>;
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  return (
    <article className="ucl-fixture">
      <div className="ucl-fixture__meta">
        <span className="ucl-fixture__league"><span className="ucl-league-mark" />{fixture.league}</span>
        <span className="ucl-fixture__time"><Clock3 size={13} strokeWidth={1.8} />{fixture.time}</span>
      </div>
      <div className="ucl-fixture__body">
        <div className="ucl-fixture__teams">
          <div className="ucl-team"><Crest code={fixture.homeCode} color={fixture.homeColor} /><span>{fixture.home}</span></div>
          <div className="ucl-team"><Crest code={fixture.awayCode} color={fixture.awayColor} /><span>{fixture.away}</span></div>
        </div>
        <div className="ucl-fixture__market" aria-label="Correct score odds">
          <span className="ucl-fixture__market-label">CORRECT SCORE</span>
          <div className="ucl-odds-row">
            {fixture.odds.map((odd, index) => <div className="ucl-odd" key={odd}><span>{['1–0', '1–1', '2–1'][index]}</span><strong>{odd}</strong></div>)}
          </div>
        </div>
        <button className="ucl-fixture__open" type="button" aria-label={`View ${fixture.home} against ${fixture.away}`}><ArrowRight size={19} strokeWidth={1.9} /></button>
      </div>
    </article>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: typeof Home; label: string; active?: boolean }) {
  return <button className={`ucl-nav-item${active ? ' is-active' : ''}`} type="button"><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{active && <span className="ucl-nav-item__indicator" />}</button>;
}

export const UCLMatchdayBoardMobile = () => {
  const [activeDate, setActiveDate] = useState('Today');
  const [slide, setSlide] = useState(0);
  const slideData = slides[slide];
  const SlideIcon = slideData.icon;

  return <div className="ucl-app ucl-app--mobile">
    <aside className="ucl-sidebar" aria-label="Primary navigation">
      <div className="ucl-sidebar__brand"><div className="ucl-wordmark">UCL<span className="ucl-wordmark__star">✳</span></div><span>FOOTBALL BETTING</span></div>
      <div className="ucl-sidebar__section-label">MATCHDAY</div>
      <nav className="ucl-sidebar__nav" aria-label="Main"><NavItem icon={Home} label="Overview" active /><NavItem icon={Trophy} label="Matches" /><NavItem icon={History} label="My bets" /></nav>
      <div className="ucl-sidebar__section-label ucl-sidebar__section-label--account">ACCOUNT</div>
      <nav className="ucl-sidebar__nav" aria-label="Account"><NavItem icon={Wallet} label="Wallet" /><NavItem icon={Gift} label="Rewards & VIP" /><NavItem icon={UserRound} label="Profile" /></nav>
      <div className="ucl-sidebar__bottom"><button type="button"><CircleHelp size={18} strokeWidth={1.8} /> Help & support</button><div className="ucl-sidebar__rule" /><span>UCL · YOUR MATCHDAY</span></div>
    </aside>

    <div className="ucl-main">
      <header className="ucl-topbar">
        <div className="ucl-mobile-logo"><span>UCL</span><small>FOOTBALL BETTING</small></div>
        <div className="ucl-topbar__title"><span>Dashboard</span><ChevronRight size={15} /><strong>Overview</strong></div>
        <div className="ucl-topbar__actions"><button className="ucl-search" type="button"><Search size={17} strokeWidth={1.8} /><span>Search matches</span><kbd>⌘ K</kbd></button><button className="ucl-icon-button" type="button" aria-label="Notifications"><Bell size={19} strokeWidth={1.8} /><i /></button><button className="ucl-profile" type="button"><span>UJ</span><strong>My account</strong><ChevronDown size={15} /></button></div>
        <button className="ucl-mobile-bell" type="button" aria-label="Notifications"><Bell size={21} strokeWidth={1.8} /><i /></button>
      </header>

      <main className="ucl-content">
        <div className="ucl-page-heading"><div><p className="ucl-eyebrow"><span className="ucl-eyebrow__diamond">✦</span> THE UCL MATCHDAY</p><h1>The match starts here<span>.</span></h1><p>Fixtures, selections and your account in one clear view.</p></div><div className="ucl-heading-date"><span>TUESDAY</span><strong>06 OCT</strong><span>ILLUSTRATIVE CONCEPT</span></div></div>

        <div className="ucl-workspace">
          <section className="ucl-board" aria-labelledby="fixtures-heading">
            <div className="ucl-section-heading"><div><div className="ucl-section-kicker"><span className="ucl-status-dot" /> THE FIXTURE BOARD</div><h2 id="fixtures-heading">Upcoming matches</h2></div><button className="ucl-text-link" type="button">All matches <ArrowUpRight size={17} /></button></div>
            <div className="ucl-board__filters"><div className="ucl-date-tabs" role="tablist" aria-label="Fixture date">{dates.map((date) => <button key={date} type="button" role="tab" aria-selected={activeDate === date} className={activeDate === date ? 'is-selected' : ''} onClick={() => setActiveDate(date)}>{date}</button>)}</div><button className="ucl-filter-button" type="button"><SlidersHorizontal size={16} strokeWidth={1.8} /> Filters</button></div>
            <div className="ucl-fixtures">{activeDate === 'Today' ? fixtures.map((fixture) => <FixtureCard key={fixture.home} fixture={fixture} />) : <div className="ucl-empty"><Trophy size={28} strokeWidth={1.5} /><strong>No fixtures in this concept view</strong><span>Select Today to preview the matchday board.</span></div>}</div>
            <div className="ucl-board__foot"><span><span className="ucl-small-star">✦</span> Correct-score odds shown for illustration</span><button type="button">Explore all markets <ArrowRight size={16} /></button></div>
          </section>

          <aside className="ucl-account-rail" aria-label="Your activity and wallet">
            <section className="ucl-wallet"><div className="ucl-wallet__top"><span><Wallet size={17} strokeWidth={1.8} /> YOUR WALLET</span><button type="button" aria-label="More wallet options"><ChevronRight size={18} /></button></div><p>Available balance</p><div className="ucl-wallet__amount">248.60 <span>USDT</span></div><div className="ucl-wallet__line"><span className="ucl-wallet__pulse" /> Ready for matchday</div><div className="ucl-wallet__actions"><button type="button"><ArrowDownLeft size={17} /> Deposit</button><button type="button"><ArrowUpRight size={17} /> Withdraw</button></div></section>
            <section className="ucl-open-bets"><div className="ucl-rail-heading"><span><CreditCard size={16} strokeWidth={1.8} /> OPEN BETS</span><button type="button">View all <ArrowRight size={15} /></button></div><div className="ucl-bet-card"><div className="ucl-bet-card__top"><span className="ucl-bet-card__status">● ACTIVE</span><span>Single · 06 Oct</span></div><strong>Real Madrid vs Barcelona</strong><p>Correct score · 1–0</p><div><span>Stake <b>10 USDT</b></span><span>Odds <b>7.20</b></span></div></div><div className="ucl-open-bets__foot">Your active selections, at a glance.</div></section>
            <button className="ucl-reward" type="button"><span><Sparkles size={19} strokeWidth={1.7} /></span><div><strong>Rewards & VIP</strong><small>Explore your UCL benefits</small></div><ArrowRight size={17} /></button>
          </aside>
        </div>

        <section className="ucl-spotlight" aria-label="UCL highlights"><div className="ucl-spotlight__header"><span>THE SPOTLIGHT</span><div><button type="button" onClick={() => setSlide((slide + slides.length - 1) % slides.length)} aria-label="Previous highlight"><ChevronLeft size={19} /></button><button type="button" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Next highlight"><ChevronRight size={19} /></button></div></div><div className="ucl-spotlight__body"><div className="ucl-spotlight__copy"><span>{slideData.eyebrow}</span><h2>{slideData.title}</h2><p>{slideData.body}</p><button type="button">Explore UCL <ArrowRight size={17} /></button></div><div className="ucl-spotlight__art" aria-hidden="true"><div className="ucl-spotlight__orbit"><SlideIcon size={63} strokeWidth={1.1} /></div><i className="ucl-spotlight__arc one" /><i className="ucl-spotlight__arc two" /><i className="ucl-spotlight__arc three" /></div></div><div className="ucl-spotlight__dots">{slides.map((item, index) => <button type="button" key={item.eyebrow} onClick={() => setSlide(index)} aria-label={`Show highlight ${index + 1}`} aria-current={slide === index ? 'true' : undefined} />)}</div></section>
        <div className="ucl-disclaimer">Concept design · Illustrative fixtures and account values · Existing betting flow retained</div>
      </main>
    </div>

    <nav className="ucl-mobile-nav" aria-label="Mobile navigation"><button type="button" className="is-active"><Home size={21} strokeWidth={1.8} /><span>Home</span></button><button type="button"><Trophy size={21} strokeWidth={1.8} /><span>Matches</span></button><button type="button"><History size={21} strokeWidth={1.8} /><span>My bets</span></button><button type="button"><Wallet size={21} strokeWidth={1.8} /><span>Wallet</span></button><button type="button"><Menu size={21} strokeWidth={1.8} /><span>More</span></button></nav>
  </div>;
};


