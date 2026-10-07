import { useState } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, ChevronLeft, ChevronRight, History, Home, Menu, Trophy, Wallet } from 'lucide-react';
import './UCLMatchdayBoardMobilePolished.css';
const matches = [{
  home: 'Real Madrid',
  away: 'Barcelona',
  homeCode: 'RM',
  awayCode: 'FCB',
  homeTone: 'cream',
  awayTone: 'claret',
  time: '20:00',
  odds: ['7.20', '8.40', '11.00']
}, {
  home: 'Manchester City',
  away: 'Inter Milan',
  homeCode: 'MC',
  awayCode: 'INT',
  homeTone: 'sky',
  awayTone: 'navy',
  time: '20:00',
  odds: ['8.10', '9.60', '12.50']
}, {
  home: 'Bayern Munich',
  away: 'Liverpool',
  homeCode: 'BM',
  awayCode: 'LFC',
  homeTone: 'red',
  awayTone: 'wine',
  time: '21:00',
  odds: ['7.80', '9.20', '13.00']
}];
const highlights = [{
  title: 'Live match updates',
  detail: 'Follow every change.',
  action: 'Explore live'
}, {
  title: 'Football markets',
  detail: 'Find your selection.',
  action: 'See markets'
}, {
  title: 'Wallet controls',
  detail: 'Manage your account.',
  action: 'Open wallet'
}];
function Crest({
  code,
  tone
}: {
  code: string;
  tone: string;
}) {
  return <span aria-hidden="true" className={`ucl-p-crest ucl-p-crest--${tone}`}>{code}</span>;
}
function MatchRow({
  match
}: {
  match: typeof matches[number];
}) {
  return <article className="ucl-p-match">
    <div className="ucl-p-match__top"><strong>{match.time}</strong></div>
    <div className="ucl-p-match__body">
      <div className="ucl-p-teams">
        <div><Crest code={match.homeCode} tone={match.homeTone} /><strong>{match.home}</strong></div>
        <div><Crest code={match.awayCode} tone={match.awayTone} /><strong>{match.away}</strong></div>
      </div>
      <div className="ucl-p-market" aria-label="Correct score odds">
        {match.odds.map((odd, index) => <div key={odd}><span>{['1–0', '1–1', '2–1'][index]}</span><strong>{odd}</strong></div>)}
      </div>
    </div>
  </article>;
}
export const UCLMatchdayBoardMobilePolished = () => {
  const [day, setDay] = useState('Today');
  const [highlight, setHighlight] = useState(0);
  const item = highlights[highlight];
  return <div className="ucl-p-screen">
    <header className="ucl-p-header">
      <div className="ucl-p-logo" aria-label="UCL">UCL</div>
      <button type="button" className="ucl-p-icon-button" aria-label="Notifications"><Bell size={21} strokeWidth={1.8} /><span /></button>
    </header>

    <main>
      <div className="ucl-p-title"><h1>Matchday<span>.</span></h1><div className="ucl-p-date" aria-label="Tuesday, 6 October"><b>06</b><span>OCT</span></div></div>

      <section className="ucl-p-fixtures" aria-labelledby="ucl-p-fixtures-title">
        <div className="ucl-p-section-head"><h2 id="ucl-p-fixtures-title">Fixtures</h2><button type="button">View all <ArrowUpRight size={17} strokeWidth={1.8} /></button></div>
        <div className="ucl-p-tabs" role="tablist" aria-label="Fixture date">
          {['Today', '3h', '12h', 'Tomorrow'].map(value => <button key={value} type="button" role="tab" aria-selected={day === value} className={day === value ? 'is-active' : ''} onClick={() => setDay(value)}>{value}</button>)}
        </div>
        <div className="ucl-p-market-heading"><span>CHAMPIONS LEAGUE</span><span>CORRECT SCORE</span></div>
        {day === 'Today' ? matches.map(match => <MatchRow key={match.home} match={match} />) : <div className="ucl-p-empty"><strong>No matches in this preview</strong><button type="button" onClick={() => setDay('Today')}>Show today</button></div>}
      </section>

      <section className="ucl-p-account" aria-label="Your wallet and bets">
        <div className="ucl-p-wallet"><div className="ucl-p-wallet__head"><span><Wallet size={17} strokeWidth={1.8} /> Wallet</span><ArrowUpRight size={18} strokeWidth={1.8} /></div><div className="ucl-p-wallet__balance">248.60 <span>USDT</span></div><div className="ucl-p-wallet__actions"><button type="button"><ArrowDownLeft size={17} strokeWidth={1.8} /> Deposit</button><button type="button"><ArrowUpRight size={17} strokeWidth={1.8} /> Withdraw</button></div></div>
        <div className="ucl-p-bet"><div className="ucl-p-bet__head"><span>Open bets</span><ArrowRight size={17} strokeWidth={1.8} /></div><div className="ucl-p-bet__selection"><span className="ucl-p-bet__dot" /> Real Madrid — Barcelona</div><div className="ucl-p-bet__detail">Correct score 1–0 <strong>7.20</strong></div></div>
      </section>

      <section className="ucl-p-highlight" aria-label="UCL highlights">
        <div className="ucl-p-highlight__copy"><span>UCL</span><h2>{item.title}</h2><p>{item.detail}</p><button type="button">{item.action} <ArrowRight size={17} strokeWidth={1.8} /></button></div>
        <div className="ucl-p-highlight__pitch" aria-hidden="true"><span /></div>
        <div className="ucl-p-highlight__controls"><button type="button" onClick={() => setHighlight((highlight + highlights.length - 1) % highlights.length)} aria-label="Previous highlight"><ChevronLeft size={19} /></button><span>{highlight + 1} / {highlights.length}</span><button type="button" onClick={() => setHighlight((highlight + 1) % highlights.length)} aria-label="Next highlight"><ChevronRight size={19} /></button></div>
      </section>
      <p className="ucl-p-note">Illustrative concept data</p>
    </main>

    <nav className="ucl-p-bottom" aria-label="Mobile navigation"><button className="is-active" type="button"><Home size={21} strokeWidth={1.8} /><span>Home</span></button><button type="button"><Trophy size={21} strokeWidth={1.8} /><span>Matches</span></button><button type="button"><History size={21} strokeWidth={1.8} /><span>Bets</span></button><button type="button"><Wallet size={21} strokeWidth={1.8} /><span>Wallet</span></button><button type="button"><Menu size={21} strokeWidth={1.8} /><span>More</span></button></nav>
  </div>;
};