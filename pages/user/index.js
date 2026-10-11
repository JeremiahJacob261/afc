import { translateApiMessage } from '@/lib/translateApiMessage'
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
import { markAuthLogin, measureAuthLogin } from '@/lib/authLoginTiming'
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

function getSlides(t) { return [
  { label: t('website.matchday'), title: t('website.followTheMatchAlt'), detail: t('website.fixturesAndLiveMovementAllInOnePlace'), action: t('website.viewMatches'), href: '/user/matches' },
  { label: t('website.marketsAlt'), title: t('website.findYourMarket'), detail: t('website.exploreFootballPricesBeforeYouPlaceABet'), action: t('website.exploreMarkets'), href: '/user/matches' },
  { label: t('website.yourAccount'), title: t('website.yourFundsInView'), detail: t('website.manageDepositsAndWithdrawalsFromYourWallet'), action: t('website.openWallet'), href: '/user/fund' },
] }

function DashboardCarousel() {
  const { t } = useTranslation('common');
  const slides = getSlides(t);
  const [active, setActive] = useState(0)
  const startX = useRef(null)
  const slide = slides[active]
  const previous = () => setActive((current) => (current + slides.length - 1) % slides.length)
  const next = () => setActive((current) => (current + 1) % slides.length)
  return <section className={styles.carousel} aria-label={t('website.uclHighlights')} aria-roledescription={t('website.carouselDescription')}
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
      <button type="button" onClick={previous} aria-label={t('website.previousHighlight')}><ChevronLeft size={20} /></button>
      <span aria-label={t('website.slidePosition', { current: active + 1, total: slides.length })}>{active + 1} / {slides.length}</span>
      <button type="button" onClick={next} aria-label={t('website.nextHighlight')}><ChevronRight size={20} /></button>
    </div>
  </section>
}

function Team({ name, image }) {
  const { t } = useTranslation('common');
  return <span className={styles.team}>
    <span className={styles.crest}><Image src={image || ball} width={28} height={28} alt="" unoptimized /></span>
    <strong>{name || t('website.team')}</strong>
  </span>
}

function Fixture({ match }) {
  const { t, i18n } = useTranslation('common');
  const display = useClientMatchDisplay(match, { locale: i18n.language })
  const league = (match.league === 'others' ? match.otherl : match.league) || t('website.football')
  const prices = [['1–0', match.onenil], ['1–1', match.oneone], ['1–2', match.onetwo]]
  return <Link href={`/user/match/${match.match_id}`} className={styles.fixture} aria-label={t('website.openMatchMarkets', { home: match.home || t('common.homeTeam'), away: match.away || t('website.away') })}>
    <div className={styles.fixtureMeta}><span>{league}</span><span><Clock3 size={14} aria-hidden="true" /> {display.dateTime} {t('website.localTime')}</span></div>
    <div className={styles.fixtureBody}>
      <div className={styles.teams}><Team name={match.home} image={match.ihome} /><Team name={match.away} image={match.iaway} /></div>
      <div className={styles.fixtureRight}>
        <div className={styles.prices} aria-label={t('website.featuredCorrectScoreOdds')}>
          {prices.map(([score, price]) => <span className={styles.price} key={score}><span>{score}</span><strong>{price || '—'}</strong></span>)}
        </div>
        <span className={styles.matchLink} aria-hidden="true"><ArrowUpRight size={18} /></span>
      </div>
    </div>
  </Link>
}

export default function Home() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
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
    markAuthLogin('dashboard-first-paint')
    measureAuthLogin('submit-to-dashboard-paint', 'submit', 'dashboard-first-paint')
    measureAuthLogin('navigation-to-dashboard-paint', 'navigation-start', 'dashboard-first-paint')
  }, [])

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
      const [profileResult, matchResult, betsResult] = await Promise.allSettled([
        authFetch('/api/me', {}, session.access_token),
        supabase.from('bets').select('*').eq('verified', false).gt('tsgmt', Date.now()).order('tsgmt', { ascending: true }).limit(50),
        authFetch('/api/my-bets', {}, session.access_token),
      ])
      if (!active) return

      if (profileResult.status === 'fulfilled') {
        if (profileResult.value.status === 401 || profileResult.value.status === 404) {
          router.push('/login')
          return
        }
        try {
          const result = await profileResult.value.json()
          if (result.status === 'success') setUsername(result.profile?.username || '')
          else toast.error(translateApiMessage(result, t, 'messages.unableRefreshAccount'))
        } catch (error) {
          toast.error(t('messages.unableRefreshAccount'))
        }
      } else {
        toast.error(t('messages.unableRefreshAccount'))
      }

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
    <Head><title>{t('website.uclMatchday')}</title><link rel="icon" href="/european.ico" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <Toaster position="bottom-center" />
    <main className={styles.dashboard}>
      <DashboardCarousel />
      <section className={styles.spinInvite} aria-labelledby="spin-invite-heading">
        <span className={styles.spinInviteWheel} aria-hidden="true"><span>{t('website.go')}</span></span>
        <div className={styles.spinInviteCopy}>
          <h2 id="spin-invite-heading">{t('website.wheelSpin')}</h2>
          <p>{t('website.takeYourDailySpinOneSpinEvery24Hours')}</p>
        </div>
        <Link href="/user/wheel" className={styles.spinInviteButton}>{t('website.spinWheel')} <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
      <div className={styles.masthead}>
        <div><p className={styles.greeting}>{username ? t('website.helloUser', { username }) : t('website.yourMatchday')}</p><h1>{t('website.matchdayAlt')}<span>.</span></h1></div>
        <div className={styles.date} aria-label={date?.toLocaleDateString(i18n.language, { dateStyle: 'full' }) || t('website.loadingDate')}><strong>{date ? date.toLocaleDateString(i18n.language, { day: '2-digit' }) : '—'}</strong><span>{date ? date.toLocaleDateString(i18n.language, { month: 'short' }).toUpperCase() : ''}</span></div>
      </div>
      <div className={styles.contentGrid}>
        <section className={styles.fixtures} aria-labelledby="fixtures-heading">
          <div className={styles.sectionHead}><div><h2 id="fixtures-heading">{t('website.fixtures')}</h2><p>{t('website.kickoffTimesShownInYourLocalTime')}</p></div><Link href="/user/matches">{t('website.viewAll')} <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
          <div className={styles.tabs} aria-label={t('website.fixtureTimeWindow')}>
            {filters.map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} className={filter === key ? styles.tabActive : ''} onClick={() => setFilter(key)}>{label}</button>)}
          </div>
          <div className={styles.marketHeading}><span>{t('website.footballFixtures')}</span><span>{t('website.featuredCorrectScore')}</span></div>
          {shownMatches.length ? shownMatches.map((match) => <Fixture match={match} key={match.match_id} />) : <div className={styles.empty}><Trophy size={28} aria-hidden="true" /><strong>{loadingMatches ? t('website.loadingFixtures') : matchError ? t('website.fixturesUnavailable') : t('website.noMatchesInThisWindow')}</strong><p>{loadingMatches ? t('website.checkingTheLatestSchedule') : matchError ? t('website.pleaseTryTheFullMatchesPage') : t('website.tryAnotherTimeWindowOrSeeEveryMatch')}</p>{!loadingMatches && <Link href="/user/matches">{t('website.browseAllMatches')} <ArrowRight size={16} /></Link>}</div>}
        </section>
        <aside className={styles.account} aria-label={t('website.yourAccountAlt')}>
          <section className={styles.bets} aria-labelledby="bets-heading"><div className={styles.betsHead}><h2 id="bets-heading">{t('website.openBets')} <span>{betsStatus === 'ready' ? openBets.length : '—'}</span></h2><Link href="/user/bets" aria-label={t('website.viewAllBets')}><ArrowRight size={19} /></Link></div>{latestBet ? <Link href={`/user/viewbet/${latestBet.betid}`} className={styles.betLink}><strong>{latestBet.home} — {latestBet.away}</strong><span>{latestBet.market || t('website.matchSelection')} · {Number(latestBet.stake || 0).toLocaleString(i18n.language, { maximumFractionDigits: 3 })} {t('website.mmkStake')}</span><span>{t('website.viewBet')} <ArrowUpRight size={16} aria-hidden="true" /></span></Link> : <p className={styles.noBets}>{betsStatus === 'loading' ? t('website.loadingOpenBets') : betsStatus === 'error' ? t('website.unableToLoadOpenBetsOpenYourBetsToTryAgain') : t('website.noOpenBetsRightNowYourNextSelectionWillAppearHere')}</p>}</section>
          <section className={styles.community} aria-label={t('website.community')}><h2>{t('website.community')}</h2><div><a href={links.telegram} target="_blank" rel="noopener noreferrer"><Send size={18} aria-hidden="true" /> Telegram <ArrowUpRight size={16} aria-hidden="true" /></a><a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
        </aside>
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
