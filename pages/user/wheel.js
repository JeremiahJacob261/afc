import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import Cover from './cover'
import { authFetch, requireSession } from '@/lib/clientAuth'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import styles from '@/styles/UserWheel.module.css'

const prizes = ['iPhone 17', 'K5,000', 'K20,000', 'K100,000', 'K10', 'K500', 'K1,000', 'K30,000']

function remainingTime(nextSpinAt, now) {
  const remaining = Math.max(0, Date.parse(nextSpinAt) - now)
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.ceil((remaining % 3_600_000) / 60_000)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

export default function Wheel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [nextSpinAt, setNextSpinAt] = useState(null)
  const [wonPrize, setWonPrize] = useState(null)
  const [lastPrize, setLastPrize] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [now, setNow] = useState(Date.now())
  const spinTimer = useRef(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => { window.clearInterval(timer); window.clearTimeout(spinTimer.current) }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const session = await requireSession(router)
      if (!session || !active) return
      try {
        const response = await authFetch('/api/wheel-spin')
        if (!response.ok) throw new Error('Unable to load the wheel. Please try again.')
        const result = await response.json()
        if (active) { setNextSpinAt(result.nextSpinAt); setLastPrize(result.lastPrize) }
      } catch (caught) {
        if (active) setError(caught.message)
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [router])

  const coolingDown = nextSpinAt && now < Date.parse(nextSpinAt)

  async function spin() {
    if (loading || spinning || coolingDown) return
    setError('')
    setWonPrize(null)
    setSpinning(true)
    try {
      const response = await authFetch('/api/wheel-spin', { method: 'POST' })
      const result = await response.json()
      if (response.status === 409) {
        setNextSpinAt(result.nextSpinAt)
        setNow(Date.now())
        setError(result.message)
        setSpinning(false)
        return
      }
      if (!response.ok || !Number.isInteger(result.prizeIndex) || !prizes[result.prizeIndex]) throw new Error('The spin could not be completed. Please try again.')
      setNextSpinAt(result.nextSpinAt)
      setLastPrize(result.prize)
      setNow(Date.now())
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const currentMod = ((rotation % 360) + 360) % 360
      const targetMod = (360 - result.prizeIndex * 45) % 360
      const alignment = (targetMod - currentMod + 360) % 360
      setRotation(rotation + (reducedMotion ? 0 : 360 * 6) + alignment)
      spinTimer.current = window.setTimeout(() => { setWonPrize(result.prize); setSpinning(false) }, reducedMotion ? 0 : 5200)
    } catch (caught) { setError(caught.message); setSpinning(false) }
  }

  return <Cover>
    <Head><title>Wheel Spin — UCL</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <div className={styles.heading}><Link href="/user" className={styles.back} aria-label="Back to dashboard"><ArrowLeft size={22} aria-hidden="true" /></Link><h1>Wheel Spin</h1></div>
      <div className={styles.stage}>
        <div className={styles.wheelFrame}>
          <div className={styles.lights} aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => {
              const angle = index * Math.PI / 12
              return <span key={index} className={index % 2 ? styles.orangeLight : styles.whiteLight} style={{ left: `${50 + 46 * Math.sin(angle)}%`, top: `${50 - 46 * Math.cos(angle)}%` }} />
            })}
          </div>
          <div className={styles.wheel} style={{ transform: `rotate(${rotation}deg)` }}>
            <div className={styles.sectors} />
            {prizes.map((label, index) => {
              const angle = index * Math.PI / 4
              return <div key={label} className={styles.prize} style={{ left: `${50 + 34 * Math.sin(angle)}%`, top: `${50 - 34 * Math.cos(angle)}%` }}>
                <span>{label}</span>
                <img src={index === 0 ? '/assets/wheel/phone.png' : '/assets/wheel/gift.png'} className={`${styles.prizeImage} ${index === 5 || index === 6 ? styles.purpleGift : ''}`} alt="" draggable="false" />
              </div>
            })}
          </div>
          <span className={styles.pointer} aria-hidden="true" />
          <button className={styles.hub} type="button" onClick={spin} disabled={loading || spinning || Boolean(coolingDown)} aria-label="Spin the wheel">GO</button>
        </div>
        <div className={styles.status} aria-live="polite">
          {wonPrize ? <><strong>You won {wonPrize}!</strong><span>Your result has been recorded. You can spin again in 24 hours.</span></>
            : spinning ? <strong>Spinning…</strong>
              : loading ? <span>Checking your spin…</span>
                : coolingDown ? <><strong>{lastPrize ? `Last spin: ${lastPrize}` : 'Spin complete'}</strong><span>Next spin in {remainingTime(nextSpinAt, now)}.</span></>
                  : <><strong>Ready to spin?</strong><span>Tap GO for your daily spin.</span></>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
