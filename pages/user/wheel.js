import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import Cover from './cover'
import { authFetch, requireSession } from '@/lib/clientAuth'
import { formatCurrency } from '@/lib/currency'
import { WHEEL_MINIMUM_BALANCE, wheelRotation } from '@/lib/wheel'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import styles from '@/styles/UserWheel.module.css'

function sectorGradient(items) {
  if (!items.length) return '#f8c522'
  const sector = 360 / items.length
  return `conic-gradient(from -${sector / 2}deg, ${items.map((item, index) => `${item.color} ${index * sector}deg ${(index + 1) * sector}deg`).join(', ')})`
}

function remainingTime(nextSpinAt, now, t, locale) {
  const minutesLeft = Math.ceil(Math.max(0, Date.parse(nextSpinAt) - now) / 60_000)
  return t('website.wheelDuration', {
    hours: Math.floor(minutesLeft / 60).toLocaleString(locale),
    minutes: (minutesLeft % 60).toLocaleString(locale, { minimumIntegerDigits: 2 }),
  })
}

export default function Wheel() {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stateReady, setStateReady] = useState(false)
  const [error, setError] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [nextSpinAt, setNextSpinAt] = useState(null)
  const [wonPrize, setWonPrize] = useState(null)
  const [lastPrize, setLastPrize] = useState(null)
  const [items, setItems] = useState([])
  const [revision, setRevision] = useState(null)
  const [balance, setBalance] = useState(null)
  const [minimumBalance, setMinimumBalance] = useState(WHEEL_MINIMUM_BALANCE)
  const [rotation, setRotation] = useState(0)
  const [now, setNow] = useState(Date.now())
  const spinTimer = useRef(null)
  const spinLock = useRef(false)
  const revisionRef = useRef(null)
  const loadWheel = useRef(null)
  const mounted = useRef(false)
  const money = value => formatCurrency(value, null, i18n.language)

  const applyState = useCallback(result => {
    setNextSpinAt(result.nextSpinAt)
    setLastPrize(result.lastAmount != null ? { amount: result.lastAmount } : result.lastPrize)
    setBalance(result.balance)
    setMinimumBalance(result.minimumBalance)
    setItems(result.items)
    if (revisionRef.current !== null && revisionRef.current !== result.revision) setRotation(0)
    revisionRef.current = result.revision
    setRevision(result.revision)
    setStateReady(true)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    mounted.current = true
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
      window.clearTimeout(spinTimer.current)
    }
  }, [])

  useEffect(() => {
    let active = true
    let refreshing = false
    async function refresh(force = false) {
      if (!active || refreshing || (spinLock.current && !force)) return null
      refreshing = true
      setLoading(true)
      try {
        const session = await requireSession(router)
        if (!session || !active) return null
        const response = await authFetch('/api/wheel-spin')
        const result = await response.json()
        if (!response.ok || !Array.isArray(result.items) || !Number.isFinite(result.balance)
          || !Number.isFinite(result.minimumBalance)) throw new Error('Invalid wheel state')
        if (active) {
          applyState(result)
          setError('')
          if (!force) setWonPrize(null)
        }
        return active ? result : null
      } catch (_) {
        if (active) {
          setStateReady(false)
          setError(t('website.unableToLoadTheWheelPleaseTryAgain'))
        }
        return null
      } finally {
        refreshing = false
        if (active) setLoading(false)
      }
    }
    loadWheel.current = refresh
    refresh()
    const onFocus = () => { if (!document.hidden) refresh() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [router, t, applyState])

  const coolingDown = nextSpinAt && now < Date.parse(nextSpinAt)
  const eligible = balance !== null && balance >= minimumBalance
  const disabled = loading || !stateReady || spinning || !eligible || !items.length || Boolean(coolingDown)

  async function spin() {
    if (disabled || spinLock.current) return
    spinLock.current = true
    setError('')
    setWonPrize(null)
    setSpinning(true)
    try {
      const response = await authFetch('/api/wheel-spin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision }),
      })
      const result = await response.json()
      if (!mounted.current) return
      if (result.status === 'insufficient_balance' || result.status === 'cooldown' || result.status === 'wheel_updated') {
        if (Number.isFinite(result.balance)) setBalance(result.balance)
        if (Number.isFinite(result.minimumBalance)) setMinimumBalance(result.minimumBalance)
        setNextSpinAt(result.nextSpinAt)
        if (result.status === 'wheel_updated') {
          setItems(result.items)
          revisionRef.current = result.revision
          setRevision(result.revision)
          setRotation(0)
        }
        setNow(Date.now())
        setError(t(result.status === 'wheel_updated' ? 'website.wheelChanged'
          : result.status === 'cooldown' ? 'website.wheelCooldown' : 'website.wheelBalanceRequired', { amount: money(result.minimumBalance) }))
        setSpinning(false)
        spinLock.current = false
        return
      }
      if (!response.ok || result.status !== 'success' || !Number.isInteger(result.prizeIndex)
        || !items[result.prizeIndex] || result.amount !== items[result.prizeIndex].amount
        || !Number.isFinite(result.balance)) throw new Error('Invalid spin result')
      setNextSpinAt(result.nextSpinAt)
      setLastPrize({ amount: result.amount })
      setNow(Date.now())
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setRotation(current => wheelRotation(current, result.prizeIndex, items.length, reducedMotion))
      spinTimer.current = window.setTimeout(() => {
        setWonPrize(result.amount)
        setBalance(result.balance)
        setSpinning(false)
        spinLock.current = false
      }, reducedMotion ? 0 : 5200)
    } catch (_) {
      if (!mounted.current) return
      // A lost response can follow a committed award. Read state before enabling another POST.
      setStateReady(false)
      const recovered = await loadWheel.current?.(true)
      if (!mounted.current) return
      if (recovered?.lastAmount != null && recovered.nextSpinAt !== nextSpinAt) {
        setWonPrize(recovered.lastAmount)
      } else {
        setError(t(recovered ? 'website.theSpinCouldNotBeCompletedPleaseTryAgain' : 'website.wheelVerificationFailed'))
      }
      setSpinning(false)
      spinLock.current = false
    }
  }

  const lastPrizeText = typeof lastPrize === 'object' && lastPrize ? money(lastPrize.amount) : lastPrize
  return <Cover>
    <Head><title>{t('website.wheelSpinUcl')}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <div className={styles.heading}><Link href="/user" className={styles.back} aria-label={t('website.backToDashboard')}><ArrowLeft size={22} aria-hidden="true" /></Link><h1>{t('website.wheelSpin')}</h1></div>
      <div className={styles.stage}>
        <div className={styles.wheelFrame}>
          <div className={styles.lights} aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => {
              const angle = index * Math.PI / 12
              return <span key={index} className={index % 2 ? styles.orangeLight : styles.whiteLight} style={{ left: `${50 + 46 * Math.sin(angle)}%`, top: `${50 - 46 * Math.cos(angle)}%` }} />
            })}
          </div>
          <div className={styles.wheel} style={{ transform: `rotate(${rotation}deg)` }}>
            <div className={styles.sectors} style={{ background: sectorGradient(items) }} />
            {items.map((item, index) => {
              const angle = index * Math.PI * 2 / items.length
              return <div key={item.id} className={styles.prize} style={{ left: `${50 + 34 * Math.sin(angle)}%`, top: `${50 - 34 * Math.cos(angle)}%`, width: `${Math.min(26, Math.max(15, 185 / items.length))}%`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)` }}>
                <span>{money(item.amount)}</span>
                {item.imageUrl && <img src={item.imageUrl} className={styles.prizeImage} alt="" draggable="false" />}
              </div>
            })}
          </div>
          <span className={styles.pointer} aria-hidden="true" />
          <button className={styles.hub} type="button" onClick={spin} disabled={disabled} aria-label={t('website.spinTheWheel')} aria-describedby="wheel-status">{t('website.go')}</button>
        </div>
        <div id="wheel-status" className={styles.status} aria-live="polite" aria-atomic="true">
          {spinning ? <strong>{t('website.spinning')}</strong>
            : loading ? <span>{t('website.checkingYourSpin')}</span>
              : !stateReady ? <span>{t('website.wheelVerificationFailed')}</span>
                : wonPrize !== null ? <><strong>{t('website.wheelCashWon', { amount: money(wonPrize) })}</strong><span>{t('website.wheelNextSpin', { time: remainingTime(nextSpinAt, now, t, i18n.language) })}</span></>
                  : !eligible ? <><strong>{t('website.wheelBalanceRequired', { amount: money(minimumBalance) })}</strong><Link href="/user/deposit" className={styles.depositLink}>{t('website.wheelDeposit')}</Link>{coolingDown && <span>{t('website.wheelNextSpin', { time: remainingTime(nextSpinAt, now, t, i18n.language) })}</span>}</>
                    : coolingDown ? <><strong>{lastPrizeText ? t('website.wheelLastSpin', { prize: lastPrizeText }) : t('website.spinComplete')}</strong><span>{t('website.wheelNextSpin', { time: remainingTime(nextSpinAt, now, t, i18n.language) })}</span></>
                      : <><strong>{t('website.readyToSpin')}</strong><span>{t('website.wheelFreeDailySpin')}</span></>}
          {balance !== null && <span className={styles.balance}>{t('website.wheelCurrentBalance', { amount: money(balance) })}</span>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!loading && !stateReady && <button type="button" className={styles.retry} onClick={() => loadWheel.current?.()}>{t('website.wheelReload')}</button>}
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
