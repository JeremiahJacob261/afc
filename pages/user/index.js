import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock3, MessageCircle, Send, Trophy } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { Toaster, toast } from 'react-hot-toast'
import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import ball from '@/public/simps/ball.png'
import styles from '@/styles/UserDashboard.module.css'

const HOUR_MS = 60 * 60 * 1000
const fallbackTelegram = 'https://t.me/+Giav1o1JVGNkYzNk'
const fallbackWhatsapp = 'https://chat.whatsapp.com/I1D6NNWndu6HDrbzB5BkPX?s=hd&p=i&mlu=0&ilr=0'

function localDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function filteredMatches(matches, filter, now) {
  const today = localDateKey(new Date(now))
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = localDateKey(tomorrowDate)
  return matches
    .map((match) => ({ match, start: getMatchStartMs(match) }))
    .filter(({ start }) => Number.isFinite(start) && start > now)
    .filter(({ start }) => {
      if (filter === 'next3h') return start <= now + 3 * HOUR_MS
      if (filter === 'next12h') return start <= now + 12 * HOUR_MS
      if (filter === 'tomorrow') return localDateKey(new Date(start)) === tomorrow
      return localDateKey(new Date(start)) === today
    })
    .sort((a, b) => a.start - b.start)
    .map(({ match }) => match)
}

const slides = [
  { label: 'MATCHDAY', title: 'Follow the match.', detail: 'Fixtures and live movement, all in one place.', action: 'View matches', href: '/user/matches' },
  { label: 'MARKETS', title: 'Find your market.', detail: 'Explore football prices before you place a bet.', action: 'Explore markets', href: '/user/matches' },
  { label: 'YOUR ACCOUNT', title: 'Your funds, in view.', detail: 'Manage deposits and withdrawals from your wallet.', action: 'Open wallet', href: '/user/fund' },
]

function DashboardCarousel() {
  const [active, setActive] = useState(0)
  const startX = useRef(null)
  const slide = slides[active]
  const previous = () => setActive((current) => (current + slides.length - 1) % slides.length)
  const next = () => setActive((current) => (current + 1) % slides.length)
  return <section className={styles.carousel} aria-label="UCL highlights" aria-roledescription="carousel"
    onTouchStart={(event) => { startX.current = event.changedTouches[0]?.screenX ?? null }}
    onTouchEnd={(event) => {
      if (startX.current === null) return
      const delta = event.changedTouches[0].screenX - startX.current
      if (Math.abs(delta) > 50) delta > 0 ? previous() : next()
      startX.current = null
    }}>
    <div className={styles.carouselCopy} aria-live="polite">
      <span className={styles.carouselLabel}>{slide.label}</span>
      <h2>{slide.title}</h2>
      <p>{slide.detail}</p>
      <Link href={slide.href} className={styles.carouselLink}>{slide.action}<ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className={styles.pitch} aria-hidden="true"><span /></div>
    <div className={styles.carouselControls}>
      <button type="button" onClick={previous} aria-label="Previous highlight"><ChevronLeft size={20} /></button>
      <span aria-label={`Slide ${active + 1} of ${slides.length}`}>{active + 1} / {slides.length}</span>
      <button type="button" onClick={next} aria-label="Next highlight"><ChevronRight size={20} /></button>
    </div>
  </section>
}

function Team({ name, image }) {
  return <span className={styles.team}>
    <span className={styles.crest}><Image src={image || ball} width={28} height={28} alt="" unoptimized /></span>
    <strong>{name || 'Team'}</strong>
  </span>
}

function Fixture({ match }) {
  const display = useClientMatchDisplay(match)
  const league = (match.league === 'others' ? match.otherl : match.league) || 'Football'
  const prices = [['1–0', match.onenil], ['1–1', match.oneone], ['1–2', match.onetwo]]
  return <Link href={`/user/match/${match.match_id}`} className={styles.fixture} aria-label={`${match.home || 'Home'} vs ${match.away || 'Away'} — open match markets`}>
    <div className={styles.fixtureMeta}><span>{league}</span><span><Clock3 size={14} aria-hidden="true" /> {display.dateTime} local time</span></div>
    <div className={styles.fixtureBody}>
      <div className={styles.teams}><Team name={match.home} image={match.ihome} /><Team name={match.away} image={match.iaway} /></div>
      <div className={styles.fixtureRight}>
        <div className={styles.prices} aria-label="Featured correct score odds">
          {prices.map(([score, price]) => <span className={styles.price} key={score}><span>{score}</span><strong>{price || '—'}</strong></span>)}
        </div>
        <span className={styles.matchLink} aria-hidden="true"><ArrowUpRight size={18} /></span>
      </div>
    </div>
  </Link>
}

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [username, setUsername] = useState('')
  const [matches, setMatches] = useState([])
  const [openBets, setOpenBets] = useState([])
  const [betsStatus, setBetsStatus] = useState('loading')
  const [filter, setFilter] = useState('today')
  const [now, setNow] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [matchError, setMatchError] = useState(false)
  const [links, setLinks] = useState({ telegram: fallbackTelegram, whatsapp: fallbackWhatsapp })

  useEffect(() => {
    setNow(Date.now())
    const clock = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const session = await requireSession(router)
      if (!session || !active) return
      clearLegacyAuthStorage()
      try {
        const response = await authFetch('/api/me')
        if (response.status === 401 || response.status === 404) { router.push('/login'); return }
        const result = await response.json()
        if (active && result.status === 'success') {
          setUsername(result.profile?.username || '')
        } else if (active) toast.error(result.message || t('messages.unableRefreshAccount'))
      } catch (error) { if (active) toast.error(t('messages.unableRefreshAccount')) }

      const [matchResult, betsResult] = await Promise.allSettled([
        supabase.from('bets').select('*').eq('verified', false).gt('tsgmt', Date.now()).order('tsgmt', { ascending: true }).limit(50),
        authFetch('/api/my-bets'),
      ])
      if (!active) return
      if (matchResult.status === 'fulfilled' && !matchResult.value.error) setMatches(matchResult.value.data || [])
      else setMatchError(true)
      setLoadingMatches(false)
      if (betsResult.status === 'fulfilled' && betsResult.value.ok) {
        try {
          const result = await betsResult.value.json()
          if (active && result.status === 'success') { setOpenBets(result.unsettled || []); setBetsStatus('ready') }
          else if (active) setBetsStatus('error')
        } catch (error) { if (active) setBetsStatus('error') }
      } else setBetsStatus('error')
    }
    load()
    fetch('/api/platform-settings').then((response) => response.ok ? response.json() : null).then((result) => {
      if (!active || !result?.links) return
      setLinks({ telegram: result.links.telegramGroupUrl || fallbackTelegram, whatsapp: result.links.whatsappGroupUrl || fallbackWhatsapp })
    }).catch(() => {})
    return () => { active = false }
  }, [router, t])

  const shownMatches = useMemo(() => now ? filteredMatches(matches, filter, now) : [], [matches, filter, now])
  const date = now ? new Date(now) : null
  const filters = [
    ['today', t('mobile.filters.today')],
    ['next3h', t('mobile.filters.next3h')],
    ['next12h', t('mobile.filters.next12h')],
    ['tomorrow', t('mobile.filters.tomorrow')],
  ]
  const latestBet = openBets[0]

  return <Cover dashboard>
    <Head><title>UCL — Matchday</title><link rel="icon" href="/european.ico" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <Toaster position="bottom-center" />
    <main className={styles.dashboard}>
      <DashboardCarousel />
      <section className={styles.spinInvite} aria-labelledby="spin-invite-heading">
        <span className={styles.spinInviteWheel} aria-hidden="true"><span>GO</span></span>
        <div className={styles.spinInviteCopy}>
          <h2 id="spin-invite-heading">Wheel Spin</h2>
          <p>Take your daily spin. One spin every 24 hours.</p>
        </div>
        <Link href="/user/wheel" className={styles.spinInviteButton}>Spin wheel <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
      <div className={styles.masthead}>
        <div><p className={styles.greeting}>{username ? `Hello, ${username}` : 'Your matchday'}</p><h1>Matchday<span>.</span></h1></div>
        <div className={styles.date} aria-label={date?.toLocaleDateString(undefined, { dateStyle: 'full' }) || 'Loading date'}><strong>{date ? String(date.getDate()).padStart(2, '0') : '—'}</strong><span>{date ? date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : ''}</span></div>
      </div>
      <div className={styles.contentGrid}>
        <section className={styles.fixtures} aria-labelledby="fixtures-heading">
          <div className={styles.sectionHead}><div><h2 id="fixtures-heading">Fixtures</h2><p>Kickoff times shown in your local time.</p></div><Link href="/user/matches">View all <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
          <div className={styles.tabs} aria-label="Fixture time window">
            {filters.map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} className={filter === key ? styles.tabActive : ''} onClick={() => setFilter(key)}>{label}</button>)}
          </div>
          <div className={styles.marketHeading}><span>FOOTBALL FIXTURES</span><span>FEATURED CORRECT SCORE</span></div>
          {shownMatches.length ? shownMatches.map((match) => <Fixture match={match} key={match.match_id} />) : <div className={styles.empty}><Trophy size={28} aria-hidden="true" /><strong>{loadingMatches ? 'Loading fixtures…' : matchError ? 'Fixtures unavailable' : 'No matches in this window'}</strong><p>{loadingMatches ? 'Checking the latest schedule.' : matchError ? 'Please try the full matches page.' : 'Try another time window or see every match.'}</p>{!loadingMatches && <Link href="/user/matches">Browse all matches <ArrowRight size={16} /></Link>}</div>}
        </section>
        <aside className={styles.account} aria-label="Your account">
          <section className={styles.bets} aria-labelledby="bets-heading"><div className={styles.betsHead}><h2 id="bets-heading">Open bets <span>{betsStatus === 'ready' ? openBets.length : '—'}</span></h2><Link href="/user/bets" aria-label="View all bets"><ArrowRight size={19} /></Link></div>{latestBet ? <Link href={`/user/viewbet/${latestBet.betid}`} className={styles.betLink}><strong>{latestBet.home} — {latestBet.away}</strong><span>{latestBet.market || 'Match selection'} · {Number(latestBet.stake || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} USDT stake</span><span>View bet <ArrowUpRight size={16} aria-hidden="true" /></span></Link> : <p className={styles.noBets}>{betsStatus === 'loading' ? 'Loading open bets…' : betsStatus === 'error' ? 'Unable to load open bets. Open your bets to try again.' : 'No open bets right now. Your next selection will appear here.'}</p>}</section>
          <section className={styles.community} aria-label="Community"><h2>Community</h2><div><a href={links.telegram} target="_blank" rel="noopener noreferrer"><Send size={18} aria-hidden="true" /> Telegram <ArrowUpRight size={16} aria-hidden="true" /></a><a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
        </aside>
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
