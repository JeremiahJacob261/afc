import { translateApiMessage } from '@/lib/translateApiMessage'
import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from '@/components/PerformanceLink'
import { useRouter } from 'next/router'
import { ArrowRight, ArrowUpRight, Check, Copy, Download, Plus, ChevronLeft, ChevronRight, Clock3, MessageCircle, Send, Trophy } from 'lucide-react'
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
import { CompanyGameBadge } from '@/components/user/BulletinUI'
import { cachedPublicFetch } from '@/lib/requestCache'

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

const dashboardSlides = [
  { src: '/promotions/ucl-welcome.jpg', altKey: 'website.carouselWelcomeBanner' },
  { src: '/promotions/ucl-commissions.jpg', altKey: 'website.carouselCommissionBanner' },
  { src: '/promotions/ucl-referral-rewards.jpg', altKey: 'website.carouselReferralBanner' },
  { src: '/promotions/ucl-agent-salary.jpg', altKey: 'website.carouselAgentSalaryBanner' },
]

function DashboardCarousel() {
  const { t } = useTranslation('common');
  const slides = dashboardSlides;
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
    <div className={styles.carouselImage} aria-live="polite">
      <Image src={slide.src} width={1280} height={720} alt={t(slide.altKey)} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1472px) calc(100vw - 64px), 1408px" priority={active === 0} />
    </div>
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
    <span className={styles.crest}><Image src={image || ball} width={28} height={28} sizes="28px" alt="" /></span>
    <strong>{name || t('website.team')}</strong>
  </span>
}

function Fixture({ match }) {
  const { t, i18n } = useTranslation('common');
  const display = useClientMatchDisplay(match, { locale: i18n.language })
  const league = (match.league === 'others' ? match.otherl : match.league) || t('website.football')
  const prices = [['1–0', match.onenil, 'onenil'], ['1–1', match.oneone, 'oneone'], ['1–2', match.onetwo, 'onetwo']]
  return <Link href={`/user/match/${match.match_id}`} className={styles.fixture} aria-label={(match.company === true ? `${t('mobile.match.companyGame')}, ` : '') + t('website.openMatchMarkets', { home: match.home || t('common.homeTeam'), away: match.away || t('website.away') })}>
    <div className={styles.fixtureMeta}><span>{league}</span><span><Clock3 size={14} aria-hidden="true" /> {display.dateTime} {t('website.localTime')}</span></div>
    {match.company === true && <div className={styles.companyMarker}><CompanyGameBadge /></div>}
    <div className={styles.fixtureBody}>
      <div className={styles.teams}><Team name={match.home} image={match.ihome} /><Team name={match.away} image={match.iaway} /></div>
      <div className={styles.fixtureRight}>
        <div className={styles.prices} aria-label={t('website.featuredCorrectScoreOdds')}>
          {prices.map(([score, price, key]) => <span className={`${styles.price} ${match.company === true && match.comarket === key ? styles.companyPrice : ''}`} key={score}><span>{score}</span><strong>{price || '—'}</strong>{match.company === true && match.comarket === key && <CompanyGameBadge />}</span>)}
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
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const [nativeApp, setNativeApp] = useState(true)
  const [appRelease, setAppRelease] = useState(null)
  const [releaseLoaded, setReleaseLoaded] = useState(false)
  const referralLink = referralCode ? `https://ucl01.com/register/${encodeURIComponent(referralCode)}` : ''

  useEffect(() => {
    const native = Boolean(window.Capacitor?.isNativePlatform?.())
    setNativeApp(native)
    if (native) return
    let active = true
    fetch('/api/mobile/release').then(response => response.ok ? response.json() : null)
      .then(release => { if (active) setAppRelease(release?.versionCode > 0 ? release : null) })
      .catch(() => {}).finally(() => { if (active) setReleaseLoaded(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  async function copyReferral() {
    if (!referralLink || copying) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success(t('messages.inviteLinkCopied'))
    } catch (_) { toast.error(t('messages.unableCopy')) }
    finally { setCopying(false) }
  }
  const [matches, setMatches] = useState([])
  const [openBets, setOpenBets] = useState([])
  const [totalOpenBets, setTotalOpenBets] = useState(0)
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
      const profileTask = async () => {
        try {
          const response = await authFetch('/api/me', {}, session.access_token)
          if (!active) return
          if (response.status === 401 || response.status === 404) { router.push('/login'); return }
          const result = await response.json()
          if (!active) return
          if (result.status === 'success') {
            setUsername(result.profile?.username || '')
            setReferralCode(result.profile?.newrefer || '')
          }
          else toast.error(translateApiMessage(result, t, 'messages.unableRefreshAccount'))
        } catch (error) {
          if (active) toast.error(t('messages.unableRefreshAccount'))
        }
      }
      const matchTask = async () => {
        try {
          const { data, error } = await supabase.from('bets')
            .select('match_id,tsgmt,timest,date,time,home,away,ihome,iaway,league,otherl,company,comarket,onenil,oneone,onetwo')
            .eq('verified', false).gt('tsgmt', Date.now()).order('tsgmt', { ascending: true }).limit(50)
          if (!active) return
          if (error) throw error
          setMatches(data || [])
          markAuthLogin('dashboard-matches-ready')
          measureAuthLogin('submit-to-matches-ready', 'submit', 'dashboard-matches-ready')
        } catch { if (active) setMatchError(true) }
        finally { if (active) setLoadingMatches(false) }
      }
      const betsTask = async () => {
        try {
          const response = await authFetch('/api/my-bets?summary=1', {}, session.access_token)
          if (!response.ok) throw new Error('Unable to load open bets')
          const result = await response.json()
          if (active && result.status === 'success') { setOpenBets(result.unsettled || []); setTotalOpenBets(result.totalUnsettled || 0); setBetsStatus('ready') }
          else if (active) setBetsStatus('error')
        } catch (error) { if (active) setBetsStatus('error') }
      }
      profileTask(); matchTask(); betsTask()
    }
    load()
    cachedPublicFetch('/api/platform-settings').then((response) => response.ok ? response.json() : null).then((result) => {
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

  return <Cover dashboard ready={!loadingMatches}>
    <Head><title>{t('website.uclMatchday')}</title><link rel="icon" href="/european.ico" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <Toaster position="bottom-center" />
    <main className={styles.dashboard}>
      <DashboardCarousel />
      <section className={styles.quickActions} aria-label={t('website.yourAccountAlt')}>
        <Link href="/user/fund" className={styles.depositAction}><Plus size={20} aria-hidden="true" />{t('common.deposit')}</Link>
        <div className={styles.referralAction}>
          <label htmlFor="dashboard-referral">{t('dashboard.referralLink')}</label>
          <div className={styles.referralControl}>
            <input id="dashboard-referral" className="notranslate" readOnly value={referralLink} placeholder={t('dashboard.referralUnavailable')} onFocus={event => event.target.select()} />
            <button type="button" onClick={copyReferral} disabled={!referralLink || copying} aria-label={t('dashboard.copyReferralLink')}>
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}<span>{t(copied ? 'messages.copiedToClipboard' : 'common.copy')}</span>
            </button>
          </div>
        </div>
        {!nativeApp && <div className={styles.downloadAction}>
          {appRelease ? <a href={appRelease.downloadUrl} className={styles.downloadButton}><Download size={18} aria-hidden="true" />{t('dashboard.downloadApp')}</a>
            : <button type="button" className={styles.downloadButton} disabled>
              <Download size={18} aria-hidden="true" />{t('dashboard.downloadApp')}</button>}
          {/* <span>{t(appRelease ? 'dashboard.androidApp' : releaseLoaded ? 'dashboard.downloadUnavailable' : 'dashboard.checkingDownload')}</span>
        */}
        </div>}
      </section>
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
          <section className={styles.bets} aria-labelledby="bets-heading"><div className={styles.betsHead}><h2 id="bets-heading">{t('website.openBets')} <span>{betsStatus === 'ready' ? totalOpenBets : '—'}</span></h2><Link href="/user/bets" aria-label={t('website.viewAllBets')}><ArrowRight size={19} /></Link></div>{latestBet ? <Link href={`/user/viewbet/${latestBet.betid}`} className={styles.betLink}><strong>{latestBet.home} — {latestBet.away}</strong><span>{latestBet.market || t('website.matchSelection')} · {Number(latestBet.stake || 0).toLocaleString(i18n.language, { maximumFractionDigits: 3 })} {t('website.mmkStake')}</span><span>{t('website.viewBet')} <ArrowUpRight size={16} aria-hidden="true" /></span></Link> : <p className={styles.noBets}>{betsStatus === 'loading' ? t('website.loadingOpenBets') : betsStatus === 'error' ? t('website.unableToLoadOpenBetsOpenYourBetsToTryAgain') : t('website.noOpenBetsRightNowYourNextSelectionWillAppearHere')}</p>}</section>
          <section className={styles.community} aria-label={t('website.community')}><h2>{t('website.community')}</h2><div><a href={links.telegram} target="_blank" rel="noopener noreferrer"><Send size={18} aria-hidden="true" /> Telegram <ArrowUpRight size={16} aria-hidden="true" /></a><a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
        </aside>
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale, ['website', 'mobile', 'dashboard', 'status', 'messages', 'emptyStates', 'landing'])
  return { props: { ...i18nProps } }
}
