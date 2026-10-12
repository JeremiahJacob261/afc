import { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { useClientMatchDisplay } from '@/lib/matchDisplay'
import { upcomingFixtures, groupFixturesByDay } from '@/lib/fixtureDisplay'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { BulletinTeam, BulletinLoading, BulletinState, CompanyGameBadge } from '@/components/user/BulletinUI'
import styles from '@/styles/MatchdayBulletin.module.css'

function MatchRow({ match }) {
  const { t } = useTranslation('common')
  const display = useClientMatchDisplay(match)
  const league = (match.league === 'others' ? match.otherl : match.league) || t('website.football')
  return <Link href={`/user/match/${match.match_id}`} className={styles.fixture} aria-label={(match.company === true ? `${t('mobile.match.companyGame')}, ` : '') + t('website.openMatchMarkets', { home: match.home || t('common.homeTeam'), away: match.away || t('common.away') })}>
    <div className={styles.meta}><strong>{league}</strong><span>{display.time} · {t('website.localTime')}</span>{match.company === true && <CompanyGameBadge />}</div>
    <div className={styles.teams}><BulletinTeam name={match.home} image={match.ihome} /><BulletinTeam name={match.away} image={match.iaway} /></div>
    <div className={styles.marketPreview} aria-label={t('website.featuredCorrectScore')}>{[['1–0', match.onenil, 'onenil'], ['1–1', match.oneone, 'oneone'], ['1–2', match.onetwo, 'onetwo']].map(([score, odd, key]) => <span key={score} className={match.company === true && match.comarket === key ? styles.companyPreview : ''}><small>{score}</small><strong>{Number(odd) > 0 ? `${odd}%` : '—'}</strong>{match.company === true && match.comarket === key && <CompanyGameBadge />}</span>)}</div>
    <ArrowUpRight className={styles.arrow} size={18} aria-hidden="true" />
  </Link>
}
export default function Matches({ footDat = [], loadError = false }) {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [now, setNow] = useState(null)
  const [retrying, setRetrying] = useState(false)
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer) }, [])
  const matches = now ? upcomingFixtures(footDat, now) : []
  const groups = groupFixturesByDay(matches, i18n.language)
  async function retry() { setRetrying(true); try { await router.replace(router.asPath, undefined, { scroll: false }) } finally { setRetrying(false) } }
  return <Cover><Head><title>{`UCL — ${t('common.matches')}`}</title><meta name="description" content={t('website.matchesDescription')} /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <Link href="/user" className={styles.back}><ArrowLeft size={18} aria-hidden="true" />{t('website.matchdayAlt')}</Link>
      <div className={styles.heading}><div><h1>{t('website.footballMatches')}</h1><p>{t('website.matchesIntro')}</p></div>{now && <span className={styles.count}>{t('bulletin.fixtureCount', { count: matches.length })}</span>}</div>
      {!now || retrying ? <BulletinLoading label={t('mobile.matches.loading')} /> : loadError ? <BulletinState title={t('website.fixturesUnavailable')} description={t('bulletin.tryAgain')} onRetry={retry} /> : matches.length ? groups.map(([day, fixtures]) => <section key={day}><h2 className={styles.dateHeading}>{day}</h2><div className={styles.fixtureList}>{fixtures.map((match) => <MatchRow match={match} key={match.match_id} />)}</div></section>) : <BulletinState title={t('website.noUpcomingMatches')} description={t('website.checkBackForFixtures')} onRetry={retry} />}
    </main></Cover>
}
export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  const { data, error } = await supabase.from('bets').select('*').eq('verified', false).gt('tsgmt', Date.now()).limit(50).order('tsgmt', { ascending: true })
  return { props: { ...i18nProps, footDat: data || [], loadError: Boolean(error) } }
}
