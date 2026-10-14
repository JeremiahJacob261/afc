import PaginationButton from '@/components/PaginationButton'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from '@/components/PerformanceLink'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { ArrowLeft, ChevronRight, Trophy } from 'lucide-react'
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { useClientMatchDisplay } from '@/lib/matchDisplay'
import { betMoney, betNumber, getBetOutcome, getBetReturn } from '@/lib/betDisplay'
import { BulletinTeam, BetBadge, BulletinLoading, BulletinState } from '@/components/user/BulletinUI'
import styles from '@/styles/MatchdayBulletin.module.css'

function BetRow({ bet }) {
  const { t, i18n } = useTranslation('common')
  const display = useClientMatchDisplay(bet)
  return <Link href={`/user/viewbet/${bet.betid}`} className={styles.ledgerRow}>
    <div className={styles.ledgerFixture}><div className={styles.teams}><BulletinTeam name={bet.home} image={bet.ihome} /><BulletinTeam name={bet.away} image={bet.iaway} /></div><div className={styles.meta}>{display.dateTime}</div></div>
    <div className={styles.cell}><small>{t('mobile.bets.pick')}</small><span>{bet.market || '—'}</span></div>
    <div className={styles.cell}><small>{t('mobile.bets.stake')}</small><span>{betMoney(bet.stake, i18n.language)}</span></div>
    <div className={`${styles.cell} ${styles.returnCell}`}><small>{t(getBetOutcome(bet) === 'refunded' ? 'bulletin.stakeReturned' : 'bulletin.potentialReturn')}</small><span>{betMoney(getBetReturn(bet), i18n.language)}</span></div>
    <BetBadge bet={bet} /><ChevronRight className={styles.arrow} size={18} aria-hidden="true" />
  </Link>
}

export default function Bets() {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [tab, setTab] = useState('unsettled')
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(false)
      try {
        const session = await requireSession(router)
        if (!session) return
        clearLegacyAuthStorage()
        const response = await authFetch('/api/my-bets?page=1', { fresh: retry > 0 })
        if (response.status === 401 || response.status === 404) { router.push('/login'); return }
        const result = await response.json()
        if (!response.ok || result.status !== 'success') throw new Error('Unable to load bets')
        if (active) { setData({ unsettled: result.unsettled || [], settled: result.settled || [] }); setNextCursor(result.nextCursor) }
      } catch { if (active) setError(true) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [router, retry])
  const unsettled = data?.unsettled || [], settled = data?.settled || []
  const summary = [
    [t('status.unsettled'), unsettled.length],
    [t('status.won'), settled.filter((bet) => getBetOutcome(bet) === 'won').length],
    [t('status.refunded'), settled.filter((bet) => getBetOutcome(bet) === 'refunded').length],
    [t('mobile.bets.stake'), betMoney([...unsettled, ...settled].reduce((sum, bet) => sum + betNumber(bet.stake), 0), i18n.language)],
  ]
  const rows = data?.[tab] || []
  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const response = await authFetch(`/api/my-bets?page=1&cursor=${encodeURIComponent(nextCursor)}`)
      const result = await response.json()
      if (!response.ok) throw new Error('Unable to load bets')
      setData(current => ({ unsettled: [...current.unsettled, ...(result.unsettled || [])], settled: [...current.settled, ...(result.settled || [])] }))
      setNextCursor(result.nextCursor)
    } catch { setError(true) }
    finally { setLoadingMore(false) }
  }
  function handleTabKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'unsettled' : event.key === 'End' ? 'settled' : tab === 'unsettled' ? 'settled' : 'unsettled'
    setTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }
  return <Cover><Head><title>{`UCL — ${t('common.myBets')}`}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <Link className={styles.back} href="/user"><ArrowLeft size={18} aria-hidden="true" />{t('website.backToDashboard')}</Link>
      <div className={styles.heading}><div><h1>{t('common.myBets')}</h1><p>{t('bulletin.betsIntro')}</p></div><Trophy size={24} className={styles.arrow} aria-hidden="true" /></div>
      {data && <p>{t('common.showingRecords', { count: unsettled.length + settled.length })}</p>}
      {data && <dl className={styles.summary}>{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      <div className={styles.tabs} role="tablist" aria-label={t('common.myBets')}>{['unsettled', 'settled'].map((value) => <button key={value} type="button" id={`tab-${value}`} role="tab" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls="bet-ledger" onKeyDown={handleTabKey} onClick={() => setTab(value)}>{t(`status.${value}`)}{data && <span className={styles.tabCount}>{data[value].length}</span>}</button>)}</div>
      {error && data && <div className={styles.notice} role="status">{t('bulletin.refreshFailed')}<button type="button" onClick={() => setRetry((value) => value + 1)}>{t('bulletin.retry')}</button></div>}
      <div id="bet-ledger" role="tabpanel" tabIndex={0} aria-labelledby={`tab-${tab}`}>
        {loading && !data ? <BulletinLoading label={t('mobile.bets.loading')} /> : error && !data ? <BulletinState title={t('bulletin.betsUnavailable')} description={t('bulletin.tryAgain')} onRetry={() => setRetry((value) => value + 1)} /> : rows.length ? <div className={styles.ledger}>
          <div className={styles.ledgerHeader} aria-hidden="true"><span>{t('common.matches')}</span><span>{t('mobile.bets.pick')}</span><span>{t('mobile.bets.stake')}</span><span>{t('bulletin.return')}</span><span>{t('mobile.bets.result')}</span><span /></div>
          {rows.map((bet) => <BetRow key={bet.betid} bet={bet} />)}
        </div> : <BulletinState title={t('emptyStates.noBets')} description={t('emptyStates.betsComing')}><Link className={styles.action} href="/user/matches">{t('website.browseAllMatches')}</Link></BulletinState>}
      </div>
      <PaginationButton cursor={nextCursor} loading={loadingMore} onClick={loadMore} />
    </main></Cover>
}
export async function getStaticProps(context) { return { props: await getI18nServerSideProps(context.locale, ['website', 'mobile', 'bulletin', 'status', 'messages', 'emptyStates']) } }
