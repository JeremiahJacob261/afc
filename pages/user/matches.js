import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, Clock3, Trophy } from 'lucide-react'
import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { useClientMatchDisplay } from '@/lib/matchDisplay'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import ball from '@/public/simps/ball.png'
import styles from '@/styles/UserSubpage.module.css'

function Team({ name, image }) {
  return <span className={styles.matchTeam}><span><Image src={image || ball} width={32} height={32} alt="" unoptimized /></span><strong>{name || 'Team'}</strong></span>
}

function MatchCard({ match }) {
  const display = useClientMatchDisplay(match)
  const league = (match.league === 'others' ? match.otherl : match.league) || 'Football'
  const outcomes = [['1–0', match.onenil], ['1–1', match.oneone], ['1–2', match.onetwo]]
  return <article>
    <Link href={`/user/match/${match.match_id}`} className={styles.matchCard} aria-label={`${match.home || 'Home'} vs ${match.away || 'Away'} — open match markets`}>
      <div className={styles.matchMeta}><span>{league}</span><span><Clock3 size={15} aria-hidden="true" />{display.dateTime} local time</span></div>
      <div className={styles.matchBody}>
        <div className={styles.matchTeams}><Team name={match.home} image={match.ihome} /><Team name={match.away} image={match.iaway} /></div>
        <div className={styles.matchMarket}><span>Featured correct score</span><div>{outcomes.map(([score, odd]) => <span key={score}><small>{score}</small><strong>{Number(odd) > 0 ? `${odd}%` : '—'}</strong></span>)}</div></div>
      </div>
      <ArrowUpRight className={styles.matchArrow} size={20} aria-hidden="true" />
    </Link>
  </article>
}

export default function Matches({ footDat = [] }) {
  const matches = Array.isArray(footDat) ? footDat : []
  return <Cover>
    <Head><title>UCL — Matches</title><meta name="description" content="Browse upcoming football matches and markets." /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.matchesPage}>
      <Link href="/user" className={styles.back}><ArrowLeft size={18} aria-hidden="true" /> Matchday</Link>
      <div className={styles.heading}><h1>Football matches</h1><p>Upcoming fixtures and featured correct-score prices. Open a match to see every market.</p></div>
      {matches.length ? <div className={styles.matchList}>{matches.map((match) => <MatchCard match={match} key={match.match_id} />)}</div> : <div className={styles.emptyState}><Trophy size={28} aria-hidden="true" /><strong>No upcoming matches</strong><p>Check back when new fixtures are available.</p></div>}
    </main>
  </Cover>
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  const { data } = await supabase.from('bets').select('*').eq('verified', false).gt('tsgmt', Date.now()).limit(50).order('tsgmt', { ascending: true })
  return { props: { ...i18nProps, footDat: data || [] } }
}
