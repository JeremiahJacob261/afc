import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { ArrowLeft } from 'lucide-react'
import Cover from '../cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { useClientMatchDisplay } from '@/lib/matchDisplay'
import { betMoney, betNumber, getBetOutcome, getBetReturn } from '@/lib/betDisplay'
import { BulletinTeam, BetBadge, BulletinLoading, BulletinState } from '@/components/user/BulletinUI'
import styles from '@/styles/MatchdayBulletin.module.css'

export default function ViewBet() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const [loaded, setData] = useState(null)
  const requestedId = router.query.id
  const data = loaded?.requestedId === requestedId ? loaded : null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const bet = data?.bet || {}, match = data?.match || {}
  const display = useClientMatchDisplay(bet)
  useEffect(() => {
    if (!router.query.id) return
    let active = true
    async function load() {
      setLoading(true); setError(false)
      try {
        const session = await requireSession(router)
        if (!session) return
        clearLegacyAuthStorage()
        const response = await authFetch(`/api/my-bet?id=${encodeURIComponent(router.query.id)}`)
        if (response.status === 401 || response.status === 404) { router.push(response.status === 401 ? '/login' : '/user/bets'); return }
        const result = await response.json()
        if (!response.ok || result.status !== 'success' || !result.bet) throw new Error('Unable to load bet')
        if (active) setData({ ...result, requestedId })
      } catch { if (active) setError(true) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [router, requestedId, retry])
  const outcome = getBetOutcome(bet)
  const financial = [
    [t('mobile.bets.odds'), `${betNumber(bet.odd).toFixed(3)}%`],
    [t('mobile.bets.stake'), betMoney(bet.stake, i18n.language)],
    [t('mobile.match.profit'), betMoney(outcome === 'refunded' ? 0 : bet.profit, i18n.language)],
  ]
  return <Cover><Head><title>{`UCL — ${t('mobile.bets.details')}`}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <Link href="/user/bets" className={styles.back}><ArrowLeft size={18} aria-hidden="true" />{t('common.myBets')}</Link>
      <div className={styles.heading}><h1>{t('mobile.bets.details')}</h1></div>
      {error && data && <div className={styles.notice} role="status">{t('bulletin.refreshFailed')}<button type="button" onClick={() => setRetry((value) => value + 1)}>{t('bulletin.retry')}</button></div>}
      {loading && !data ? <BulletinLoading label={t('mobile.bets.loadingOne')} /> : error && !data ? <BulletinState title={t('bulletin.betsUnavailable')} description={t('bulletin.tryAgain')} onRetry={() => setRetry((value) => value + 1)} /> : data && <>
        <section className={styles.detailTop}><div><div className={styles.meta}>{(match.league === 'others' ? match.otherl : match.league) || '—'} · {display.dateTime}</div><div className={styles.teams}><BulletinTeam name={bet.home} image={bet.ihome} size={36} /><BulletinTeam name={bet.away} image={bet.iaway} size={36} /></div></div><BetBadge bet={bet} /></section>
        <div className={styles.detailGrid}>
          <section className={styles.section}><h2>{t('mobile.bets.pick')}</h2><p className={styles.pick}>{bet.market || '—'}</p><dl className={styles.facts}><div className={styles.fact}><dt>{t('mobile.bets.kickoff')}</dt><dd>{display.dateTime}</dd></div><div className={styles.fact}><dt>{t('mobile.bets.league')}</dt><dd>{(match.league === 'others' ? match.otherl : match.league) || '—'}</dd></div></dl><p className={styles.reference}>{t('mobile.bets.betId')}<br />{bet.betid || '—'}</p></section>
          <section className={styles.section}><h2>{t('bulletin.financialBreakdown')}</h2><dl className={styles.facts}>{financial.map(([label, value]) => <div className={styles.fact} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div className={`${styles.fact} ${styles.total}`}><dt>{t(outcome === 'refunded' ? 'bulletin.stakeReturned' : 'bulletin.potentialReturn')}</dt><dd>{betMoney(getBetReturn(bet), i18n.language)}</dd></div></dl>{outcome === 'refunded' && <p className={styles.reference}>{t('bulletin.refundExplanation')}</p>}</section>
        </div>
      </>}
    </main></Cover>
}
export async function getServerSideProps(context) { return { props: await getI18nServerSideProps(context.locale, ['website', 'mobile', 'bulletin', 'status', 'messages', 'emptyStates']) } }
