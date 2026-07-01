import React, { useEffect, useMemo, useState } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  History,
  Home,
  Lock,
  LogOut,
  Mail,
  Medal,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Trophy,
  User,
  Users,
  Wallet,
  WalletCards,
  WifiOff,
} from 'lucide-react'
import { apiFetch } from './lib/api.js'
import { hasSupabaseConfig, mobileConfig } from './lib/config.js'
import { getStoredSession, supabase } from './lib/supabase.js'
import { checkForBundleUpdate, markBundleReady } from './lib/updater.js'

const referralCode = '000208'
const bfcImages = ['/bfc1.jpg', '/bfc2.jpg', '/bfc3.jpg', '/bfc4.jpg', '/bfc5.jpg']
const ballImage = '/simps/ball.png'

const onboardingSlides = [
  {
    title: 'Football Betting Made Simple',
    text: 'Pick matches, compare odds, place secure bets, and follow results from one clear EFC mobile experience.',
    image: '/bfc1.jpg',
  },
  {
    title: 'Secure wallet access',
    text: 'Manage deposits, withdrawals, referrals, VIP progress, and account updates from the app.',
    image: '/bfc2.jpg',
  },
  {
    title: 'Built for match day',
    text: 'Open your account to see live football markets, exact score odds, and your active bet history.',
    image: '/bfc4.jpg',
  },
]

const countryCodes = [
  { code: '+234', name: 'Nigeria' },
  { code: '+91', name: 'India' },
  { code: '+92', name: 'Pakistan' },
  { code: '+62', name: 'Indonesia' },
  { code: '+1', name: 'United States' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+27', name: 'South Africa' },
]

const matchFilters = [
  { key: 'today', label: 'Today' },
  { key: 'next3h', label: 'Next 3 hrs' },
  { key: 'next12h', label: 'Next 12 hrs' },
  { key: 'tomorrow', label: 'Tomorrow' },
]

const markets = [
  ['nilnil', '0 - 0'],
  ['onenil', '1 - 0'],
  ['nilone', '0 - 1'],
  ['oneone', '1 - 1'],
  ['twonil', '2 - 0'],
  ['niltwo', '0 - 2'],
  ['twoone', '2 - 1'],
  ['onetwo', '1 - 2'],
  ['twotwo', '2 - 2'],
  ['threenil', '3 - 0'],
  ['nilthree', '0 - 3'],
  ['threeone', '3 - 1'],
  ['onethree', '1 - 3'],
  ['twothree', '2 - 3'],
  ['threetwo', '3 - 2'],
  ['threethree', '3 - 3'],
  ['otherscores', 'Other'],
]

const vipBonus = {
  1: 0,
  2: 0.015,
  3: 0.03,
  4: 0.05,
  5: 0.07,
  6: 0.095,
  7: 0.125,
}

const faqItems = [
  {
    q: 'How do I deposit?',
    a: 'Open Deposit, choose an available method, enter the amount, pay to the shown destination, then upload your receipt.',
  },
  {
    q: 'How do I withdraw?',
    a: 'Bind a wallet or bank account first, then open Withdraw, choose the account, enter your amount and transaction PIN.',
  },
  {
    q: 'Where can I see my bets?',
    a: 'Use My Bets from the bottom navigation to switch between unsettled and settled bet records.',
  },
]

function makeRoute(name, params = {}) {
  return { name, params }
}

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [route, setRoute] = useState(makeRoute('home'))
  const [booted, setBooted] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [successAmount, setSuccessAmount] = useState('')

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function boot() {
      await markBundleReady()
      checkForBundleUpdate()
      await SplashScreen.hide().catch(() => null)
      await new Promise((resolve) => setTimeout(resolve, 700))

      const session = await getStoredSession()
      if (!active) return

      setScreen(session ? 'app' : 'onboarding')
      setRoute(makeRoute('home'))
      setBooted(true)
    }

    boot()

    return () => {
      active = false
    }
  }, [])

  function openApp(nextRoute = makeRoute('home')) {
    setRoute(nextRoute)
    setScreen('app')
    setBooted(true)
  }

  function logoutToOnboarding() {
    setRoute(makeRoute('home'))
    setScreen('onboarding')
    setBooted(true)
  }

  return (
    <div className="app-shell">
      {!online ? (
        <div className="offline-pill">
          <WifiOff size={14} />
          Offline mode
        </div>
      ) : null}

      {screen === 'splash' ? <InAppSplash /> : null}
      {screen === 'onboarding' ? (
        <Onboarding onLogin={() => setScreen('login')} onRegister={() => setScreen('register')} />
      ) : null}
      {screen === 'login' ? (
        <LoginScreen
          onBack={() => setScreen('onboarding')}
          onReset={() => setScreen('reset')}
          onRegister={() => setScreen('register')}
          onSignedIn={() => openApp(makeRoute('home'))}
        />
      ) : null}
      {screen === 'register' ? (
        <RegisterScreen
          onBack={() => setScreen('onboarding')}
          onLogin={() => setScreen('login')}
          onSignedIn={() => openApp(makeRoute('home'))}
        />
      ) : null}
      {screen === 'reset' ? <ResetScreen onBack={() => setScreen('login')} /> : null}
      {screen === 'app' ? (
        <UserApp
          online={online}
          route={route}
          setRoute={setRoute}
          onLogout={logoutToOnboarding}
          successAmount={successAmount}
          setSuccessAmount={setSuccessAmount}
        />
      ) : null}

      {!booted && screen !== 'splash' ? <InAppSplash /> : null}
    </div>
  )
}

function InAppSplash() {
  return (
    <main className="splash-screen">
      <div className="splash-image">
        <img src="/bfc4.jpg" alt="" />
      </div>
      <div className="splash-copy">
        <p className="eyebrow">EFC Football</p>
        <h1>Built for match day</h1>
      </div>
    </main>
  )
}

function Onboarding({ onLogin, onRegister }) {
  const [index, setIndex] = useState(0)
  const current = onboardingSlides[index]

  return (
    <main className="screen onboarding-screen">
      <header className="brand-row">
        <span className="brand-lockup">
          <img src="/european.ico" alt="EFC" />
          <strong>EFC</strong>
        </span>
        <button className="text-action" type="button" onClick={onLogin}>
          Sign in
        </button>
      </header>

      <section className="hero-slide">
        <div className="slide-media">
          <img src={current.image} alt="" />
        </div>
        <div className="slide-copy">
          <p className="eyebrow">Mobile app</p>
          <h1>{current.title}</h1>
          <p>{current.text}</p>
        </div>
      </section>

      <Dots length={onboardingSlides.length} index={index} onChange={setIndex} label="Onboarding slides" />

      <div className="action-stack">
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (index < onboardingSlides.length - 1) setIndex(index + 1)
            else onRegister()
          }}
        >
          {index < onboardingSlides.length - 1 ? 'Next' : 'Create account'}
          <ArrowRight size={18} />
        </button>
        <button className="secondary-button" type="button" onClick={onLogin}>
          I already have an account
        </button>
      </div>
    </main>
  )
}

function AuthFrame({ title, subtitle, children, onBack }) {
  return (
    <main className="screen auth-screen">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back
      </button>
      <section className="auth-card">
        <div className="auth-logo">
          <img src="/european.ico" alt="EFC" />
          <span>EFC</span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </section>
    </main>
  )
}

function Message({ value }) {
  if (!value) return null
  return <div className={`message ${value.type || 'info'}`}>{value.text}</div>
}

function LoginScreen({ onBack, onReset, onRegister, onSignedIn }) {
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    if (!hasSupabaseConfig() || !supabase) {
      setMessage({ type: 'error', text: 'Mobile auth is missing Supabase config.' })
      return
    }

    setLoading(true)

    try {
      let email = identity.trim()
      if (!email.includes('@')) {
        const result = await apiFetch('/api/login-email', {
          method: 'POST',
          body: { username: email },
        })
        email = result.email
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      onSignedIn()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to sign in. Check your connection and details.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to open your EFC account." onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<User size={18} />} label="Email or username">
          <input
            value={identity}
            onChange={(event) => setIdentity(event.target.value.replace(/\s/g, ''))}
            autoComplete="username"
            placeholder="username or email"
            required
          />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label="Password" action={
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            required
          />
        </InputShell>
        <button className="link-button right" type="button" onClick={onReset}>
          Forgot password?
        </button>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
          <ArrowRight size={18} />
        </button>
      </form>
      <button className="link-button centered" type="button" onClick={onRegister}>
        Create a new account
      </button>
    </AuthFrame>
  )
}

function RegisterScreen({ onBack, onLogin, onSignedIn }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    countrycode: '+234',
    phone: '',
    referral: referralCode,
    password: '',
    confirmPassword: '',
    accepted: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    if (!hasSupabaseConfig() || !supabase) {
      setMessage({ type: 'error', text: 'Mobile auth is missing Supabase config.' })
      return
    }

    if (form.phone.length < 9) {
      setMessage({ type: 'error', text: 'Please enter a complete phone number.' })
      return
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords must match.' })
      return
    }

    if (!form.accepted) {
      setMessage({ type: 'error', text: 'Please accept the terms before continuing.' })
      return
    }

    setLoading(true)

    try {
      const usernameResult = await apiFetch('/api/check-username', {
        method: 'POST',
        body: { username: form.username.trim() },
      })

      if (!usernameResult.available) throw new Error('Username already exists.')

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            displayName: form.username.trim(),
            phoneNumber: form.phone.trim(),
          },
        },
      })

      if (error) throw error

      await apiFetch('/api/signup-profile', {
        method: 'POST',
        body: {
          userid: data.user.id,
          username: form.username.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          countrycode: form.countrycode,
          refer: form.referral.trim(),
        },
      })

      onSignedIn()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to create account. Check your connection.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Create account" subtitle="Join with the EFC mobile flow." onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<User size={18} />} label="Username">
          <input
            value={form.username}
            onChange={(event) => updateField('username', event.target.value.replace(/\s/g, ''))}
            autoComplete="username"
            placeholder="johndoe"
            required
          />
        </InputShell>
        <InputShell icon={<Mail size={18} />} label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </InputShell>
        <div className="two-column">
          <label className="mini-field">
            <span>Code</span>
            <select value={form.countrycode} onChange={(event) => updateField('countrycode', event.target.value)}>
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.code} {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mini-field">
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value.replace(/[^\d]/g, ''))}
              autoComplete="tel"
              placeholder="8000000000"
              required
            />
          </label>
        </div>
        <InputShell icon={<ShieldCheck size={18} />} label="Referral code">
          <input value={form.referral} onChange={(event) => updateField('referral', event.target.value)} />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label="Password" action={
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="new-password"
            placeholder="Password"
            required
          />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label="Confirm password">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
            required
          />
        </InputShell>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.accepted}
            onChange={(event) => updateField('accepted', event.target.checked)}
          />
          <span>I am at least 18 and accept the EFC terms.</span>
        </label>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
          <ArrowRight size={18} />
        </button>
      </form>
      <button className="link-button centered" type="button" onClick={onLogin}>
        I already have an account
      </button>
    </AuthFrame>
  )
}

function ResetScreen({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    if (!hasSupabaseConfig() || !supabase) {
      setMessage({ type: 'error', text: 'Mobile auth is missing Supabase config.' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${mobileConfig.apiBaseUrl}/login`,
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Reset email sent. Check your inbox.' })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to send reset email.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Reset password" subtitle="Send a reset link to your email." onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<Mail size={18} />} label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </InputShell>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset email'}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthFrame>
  )
}

function InputShell({ icon, label, action, children }) {
  return (
    <label className="input-shell">
      <span>{label}</span>
      <div>
        <i>{icon}</i>
        {children}
        {action ? <b>{action}</b> : null}
      </div>
    </label>
  )
}

function UserApp({ route, setRoute, onLogout, online, successAmount, setSuccessAmount }) {
  const navigate = (name, params = {}) => setRoute(makeRoute(name, params))
  const backHome = () => navigate('home')

  async function logout() {
    await supabase?.auth.signOut()
    onLogout()
  }

  const screen = (() => {
    if (route.name === 'matches') return <MatchesScreen navigate={navigate} />
    if (route.name === 'match') return <MatchDetailScreen matchId={route.params.id} navigate={navigate} />
    if (route.name === 'bets') return <BetsScreen navigate={navigate} />
    if (route.name === 'bet') return <BetDetailScreen betId={route.params.id} navigate={navigate} />
    if (route.name === 'profile') return <ProfileScreen navigate={navigate} onLogout={logout} />
    if (route.name === 'deposit') return <DepositScreen navigate={navigate} setSuccessAmount={setSuccessAmount} />
    if (route.name === 'withdraw') return <WithdrawScreen navigate={navigate} />
    if (route.name === 'bind-wallet') return <BindWalletScreen navigate={navigate} />
    if (route.name === 'transactions') return <TransactionsScreen navigate={navigate} />
    if (route.name === 'referrals') return <ReferralsScreen navigate={navigate} />
    if (route.name === 'vip') return <VipScreen navigate={navigate} />
    if (route.name === 'pin') return <PinScreen navigate={navigate} />
    if (route.name === 'notifications') return <NotificationsScreen navigate={navigate} />
    if (route.name === 'faq') return <FaqScreen navigate={navigate} />
    if (route.name === 'deposit-success') return <SuccessScreen navigate={navigate} title="Deposit Submitted" text={`Your receipt${successAmount ? ` for ${successAmount} USDT` : ''} has been submitted and is awaiting admin confirmation.`} />
    if (route.name === 'withdraw-success') return <SuccessScreen navigate={navigate} title="Withdrawal Success" text="Your withdrawal request has been sent." />
    return <HomeScreen online={online} navigate={navigate} onLogout={logout} />
  })()

  return (
    <main className="app-view">
      <TopBar navigate={navigate} onHome={backHome} />
      <div className="view-body">{screen}</div>
      <BottomNav active={route.name} navigate={navigate} />
    </main>
  )
}

function TopBar({ navigate, onHome }) {
  return (
    <header className="app-topbar">
      <button className="top-icon" type="button" onClick={() => navigate('profile')} aria-label="Open profile">
        <User size={20} />
      </button>
      <button className="top-brand" type="button" onClick={onHome}>
        EUROPEAN FOOTBALL
      </button>
      <button className="top-icon" type="button" onClick={() => navigate('notifications')} aria-label="Notifications">
        <Bell size={20} />
      </button>
    </header>
  )
}

function BottomNav({ active, navigate }) {
  const items = [
    { key: 'home', label: 'Top', icon: Home },
    { key: 'matches', label: 'Matches', icon: Trophy },
    { key: 'bets', label: 'My Bets', icon: Ticket },
    { key: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon
        const selected = active === item.key || (item.key === 'home' && active === 'match')
        return (
          <button key={item.key} className={selected ? 'active' : ''} type="button" onClick={() => navigate(item.key)}>
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeScreen({ navigate, onLogout, online }) {
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [activeFilter, setActiveFilter] = useState('today')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function loadHome() {
    setLoading(true)
    setMessage(null)

    try {
      const [me, matchPayload] = await Promise.all([
        apiFetch('/api/me', { auth: true }),
        apiFetch('/api/mobile/matches?limit=50'),
      ])
      setProfile(me.profile)
      setMatches(matchPayload.matches || [])
    } catch (error) {
      if (error?.status === 401) {
        setMessage({ type: 'error', text: 'Your session expired. Please sign in again.' })
      } else {
        setMessage({ type: 'info', text: 'Unable to refresh account data right now.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

  const visibleMatches = useMemo(() => filterMatches(matches, activeFilter), [matches, activeFilter])
  const balance = Number(profile?.balance || 0).toFixed(3)

  return (
    <section className="page-stack">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Hello</p>
          <h1>{profile?.username || 'Player'}</h1>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} aria-label="Sign out">
          <LogOut size={19} />
        </button>
      </header>

      <section className="balance-panel">
        <div>
          <span>Current Balance</span>
          <strong>{profile ? `${balance} USDT` : '-- USDT'}</strong>
        </div>
        <button className="mini-cta" type="button" onClick={() => navigate('deposit')}>
          Deposit
          <ChevronRight size={16} />
        </button>
      </section>

      <a className="telegram-link" href="https://t.me/+wJBTaIqLztoyYzE0" target="_blank" rel="noreferrer">
        <span>
          <b>Telegram Channel</b>
          <small>Join our telegram group to earn more</small>
        </span>
        <ChevronRight size={18} />
      </a>

      <ImageCarousel images={bfcImages} />

      <div className="section-title-row">
        <h2>Top Football Matches</h2>
        <button className="refresh-button" type="button" onClick={loadHome} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <Segmented options={matchFilters} value={activeFilter} onChange={setActiveFilter} />
      <Message value={message} />

      <section className="match-list">
        {visibleMatches.length ? (
          visibleMatches.slice(0, 8).map((match) => (
            <MatchCard key={match.match_id || match.id} match={match} onClick={() => navigate('match', { id: match.match_id })} />
          ))
        ) : (
          <EmptyState
            icon={online ? <CheckCircle2 size={24} /> : <WifiOff size={24} />}
            title={online ? 'No upcoming matches loaded yet.' : 'Offline shell ready.'}
            text="Live account and match data refresh when the app is online."
          />
        )}
      </section>
    </section>
  )
}

function MatchesScreen({ navigate }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  async function loadMatches() {
    setLoading(true)
    setMessage(null)
    try {
      const payload = await apiFetch('/api/mobile/matches?limit=50')
      setMatches(payload.matches || [])
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to load matches.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  return (
    <section className="page-stack">
      <PageHeader title="Matches" onBack={() => navigate('home')} />
      <Message value={message} />
      {loading ? <LoadingState text="Loading matches..." /> : null}
      <section className="match-list">
        {matches.map((match) => (
          <MatchCard key={match.match_id || match.id} match={match} onClick={() => navigate('match', { id: match.match_id })} />
        ))}
        {!loading && !matches.length ? <EmptyState title="No matches" text="Upcoming matches will appear here." /> : null}
      </section>
    </section>
  )
}

function MatchDetailScreen({ matchId, navigate }) {
  const [match, setMatch] = useState(null)
  const [profile, setProfile] = useState(null)
  const [picked, setPicked] = useState('')
  const [stake, setStake] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true

    async function loadMatch() {
      setLoading(true)
      setMessage(null)
      try {
        const [matchPayload, me] = await Promise.all([
          apiFetch(`/api/mobile/match?id=${encodeURIComponent(matchId)}`),
          apiFetch('/api/me', { auth: true }),
        ])
        if (!active) return
        setMatch(matchPayload.match)
        setProfile(me.profile)
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load match.' })
      } finally {
        if (active) setLoading(false)
      }
    }

    if (matchId) loadMatch()
    return () => {
      active = false
    }
  }, [matchId])

  async function placeBet() {
    if (!picked) {
      setMessage({ type: 'error', text: 'Choose a score market first.' })
      return
    }

    const amount = Number(stake)
    if (!Number.isFinite(amount) || amount < 1) {
      setMessage({ type: 'error', text: 'Stake must be at least 1 USDT.' })
      return
    }

    setPlacing(true)
    setMessage(null)
    try {
      await apiFetch('/api/place-bet', {
        auth: true,
        method: 'POST',
        body: {
          match_id: match.match_id,
          picked,
          stake: amount,
          client_bet_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        },
      })
      setMessage({ type: 'success', text: 'Bet placed successfully.' })
      setStake('')
      setPicked('')
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to place bet.' })
    } finally {
      setPlacing(false)
    }
  }

  const display = formatMatchStart(match)
  const level = Number(profile?.viplevel || profile?.vip?.viplevel || 1)

  return (
    <section className="page-stack">
      <PageHeader title="Match Details" onBack={() => navigate('matches')} />
      {loading ? <LoadingState text="Loading match..." /> : null}
      <Message value={message} />
      {match ? (
        <>
          <article className="detail-card match-detail-card">
            <p className="match-league-name">{leagueName(match)}</p>
            <div className="match-teams large">
              <Team name={match.home} image={match.ihome} />
              <time>
                <strong>{display.time}</strong>
                <span>{display.date}</span>
              </time>
              <Team name={match.away} image={match.iaway} />
            </div>
            <div className="balance-inline">
              <span>Balance</span>
              <b>{Number(profile?.balance || 0).toFixed(3)} USDT</b>
            </div>
          </article>

          <section className="market-grid">
            {markets.map(([key, label]) => {
              const baseOdd = Number(match[key] || 0)
              const odd = baseOdd ? baseOdd + Number(vipBonus[level] || 0) : 0
              return (
                <button
                  key={key}
                  type="button"
                  className={picked === key ? 'market-pill active' : 'market-pill'}
                  onClick={() => setPicked(key)}
                  disabled={!odd}
                >
                  <span>{label}</span>
                  <b>{odd ? odd.toFixed(3) : 'N/A'}</b>
                </button>
              )
            })}
          </section>

          <section className="detail-card">
            <InputShell icon={<Ticket size={18} />} label="Stake amount">
              <input
                inputMode="decimal"
                value={stake}
                onChange={(event) => setStake(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder="1.000"
              />
            </InputShell>
            <button className="primary-button full" type="button" onClick={placeBet} disabled={placing}>
              {placing ? 'Placing bet...' : 'Place bet'}
              <ArrowRight size={18} />
            </button>
          </section>
        </>
      ) : null}
    </section>
  )
}

function BetsScreen({ navigate }) {
  const [tab, setTab] = useState('unsettled')
  const [bets, setBets] = useState({ unsettled: [], settled: [] })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true

    async function loadBets() {
      setLoading(true)
      setMessage(null)
      try {
        const payload = await apiFetch('/api/my-bets', { auth: true })
        if (!active) return
        setBets({
          unsettled: payload.unsettled || [],
          settled: payload.settled || [],
        })
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load bets.' })
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBets()
    return () => {
      active = false
    }
  }, [])

  const list = bets[tab] || []

  return (
    <section className="page-stack">
      <PageHeader title="My Bets" onBack={() => navigate('home')} />
      <Segmented
        options={[
          { key: 'unsettled', label: `Unsettled (${bets.unsettled.length})` },
          { key: 'settled', label: `Settled (${bets.settled.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Message value={message} />
      {loading ? <LoadingState text="Loading bets..." /> : null}
      <section className="card-list">
        {list.map((bet) => (
          <button key={bet.betid || bet.id} className="list-card" type="button" onClick={() => navigate('bet', { id: bet.betid })}>
            <span>
              <b>{bet.home || 'Home'} vs {bet.away || 'Away'}</b>
              <small>{bet.picked || bet.pick || 'Score'} · {formatUsdt(bet.stake)}</small>
            </span>
            <StatusPill status={betStatus(bet)} />
          </button>
        ))}
        {!loading && !list.length ? <EmptyState title="No bets" text="Your bet history will appear here." /> : null}
      </section>
    </section>
  )
}

function BetDetailScreen({ betId, navigate }) {
  const [bet, setBet] = useState(null)
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true

    async function loadBet() {
      setLoading(true)
      setMessage(null)
      try {
        const payload = await apiFetch(`/api/my-bet?id=${encodeURIComponent(betId)}`, { auth: true })
        if (!active) return
        setBet(payload.bet || {})
        setMatch(payload.match || {})
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load bet.' })
      } finally {
        if (active) setLoading(false)
      }
    }

    if (betId) loadBet()
    return () => {
      active = false
    }
  }, [betId])

  const display = formatMatchStart({ ...match, ...bet })

  return (
    <section className="page-stack">
      <PageHeader title="Bet Details" onBack={() => navigate('bets')} />
      {loading ? <LoadingState text="Loading bet..." /> : null}
      <Message value={message} />
      {bet ? (
        <section className="detail-card">
          <InfoRow label="Match" value={`${bet.home || match?.home || 'Home'} vs ${bet.away || match?.away || 'Away'}`} />
          <InfoRow label="Stake" value={formatUsdt(bet.stake)} />
          <InfoRow label="Pick" value={bet.picked || bet.pick || 'Score'} />
          <InfoRow label="Kickoff" value={`${display.date} ${display.time}`} />
          <InfoRow label="Status" value={betStatus(bet).label} />
        </section>
      ) : null}
    </section>
  )
}

function ProfileScreen({ navigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [vip, setVip] = useState(null)
  const [referralCount, setReferralCount] = useState(0)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const payload = await apiFetch('/api/me', { auth: true })
        if (!active) return
        setProfile(payload.profile)
        setVip(payload.vip)
        setReferralCount(payload.referralCount || 0)
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load profile.' })
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  const actions = [
    { label: 'Deposit', route: 'deposit', icon: Wallet },
    { label: 'Withdraw', route: 'withdraw', icon: WalletCards },
    { label: 'Bind Wallet', route: 'bind-wallet', icon: ShieldCheck },
    { label: 'Transactions', route: 'transactions', icon: History },
    { label: 'Referrals', route: 'referrals', icon: Users },
    { label: 'VIP', route: 'vip', icon: Medal },
    { label: 'Transaction PIN', route: 'pin', icon: Lock },
    { label: 'FAQ', route: 'faq', icon: HelpCircle },
  ]

  return (
    <section className="page-stack">
      <PageHeader title="Profile" onBack={() => navigate('home')} />
      <Message value={message} />
      <section className="profile-card">
        <div className="avatar-circle">
          <User size={28} />
        </div>
        <div>
          <h2>{profile?.username || 'Account'}</h2>
          <p>VIP {vip?.viplevel || 1} · {referralCount} referrals</p>
          <strong>{Number(profile?.balance || 0).toFixed(3)} USDT</strong>
        </div>
      </section>

      <section className="action-grid">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.route} type="button" onClick={() => navigate(action.route)}>
              <Icon size={20} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </section>

      <button className="secondary-button danger full" type="button" onClick={onLogout}>
        Sign out
        <LogOut size={18} />
      </button>
    </section>
  )
}

function DepositScreen({ navigate, setSuccessAmount }) {
  const [data, setData] = useState({ methods: [], destinations: [] })
  const [methodId, setMethodId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage)
  }, [])

  const method = data.methods.find((item) => String(item.id ?? item.name) === String(methodId))
  const destinations = method ? data.destinations.filter((item) => destinationMatchesMethod(item, method)) : []
  const destination = data.destinations.find((item) => String(item.id) === String(destinationId)) || destinations[0]
  const rate = getRate(method)
  const minimum = method ? rate * 5 : 0

  async function submitDeposit() {
    if (!method) {
      setMessage({ type: 'error', text: 'Choose a deposit method.' })
      return
    }
    if (!destination) {
      setMessage({ type: 'error', text: 'No payment destination is available for this method.' })
      return
    }
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < minimum) {
      setMessage({ type: 'error', text: `Minimum deposit is ${formatNumber(minimum)} ${method.currency_code || method.name}.` })
      return
    }
    if (!file) {
      setMessage({ type: 'error', text: 'Upload your payment receipt.' })
      return
    }
    if (!supabase) {
      setMessage({ type: 'error', text: 'Mobile storage is missing Supabase config.' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const fileName = `${crypto.randomUUID?.() || Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const receiptPath = `public/${fileName}`
      const { error: uploadError } = await supabase.storage.from('trcreceipt').upload(receiptPath, file)
      if (uploadError) throw uploadError

      const { data: publicFile } = supabase.storage.from('trcreceipt').getPublicUrl(receiptPath)
      await apiFetch('/api/create-deposit', {
        auth: true,
        method: 'POST',
        body: {
          amount: numericAmount,
          method: method.currency_code || method.name,
          methodName: method.name,
          address: publicFile?.publicUrl,
          adminaddress: destination.address,
        },
      })

      setSuccessAmount(formatNumber(numericAmount))
      navigate('deposit-success')
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Deposit submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader title="Deposit" onBack={() => navigate('profile')} />
      {loading ? <LoadingState text="Loading payment methods..." /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <SelectField label="Method" value={methodId} onChange={setMethodId}>
          <option value="">Choose method</option>
          {data.methods.map((item) => (
            <option key={item.id || item.name} value={item.id ?? item.name}>
              {item.name} ({item.currency_code || item.name})
            </option>
          ))}
        </SelectField>
        {destinations.length > 1 ? (
          <SelectField label="Destination" value={destinationId} onChange={setDestinationId}>
            <option value="">Auto select</option>
            {destinations.map((item) => (
              <option key={item.id || item.address} value={item.id}>
                {item.bank || item.name || item.address}
              </option>
            ))}
          </SelectField>
        ) : null}
        {destination ? (
          <div className="copy-box">
            <span>Payment destination</span>
            <b>{destination.address}</b>
            <button type="button" onClick={() => copyText(destination.address)}>Copy</button>
          </div>
        ) : null}
        <InputShell icon={<Wallet size={18} />} label={`Amount${minimum ? ` · min ${formatNumber(minimum)}` : ''}`}>
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder="Amount" />
        </InputShell>
        <label className="file-field">
          <span>{file?.name || 'Upload receipt'}</span>
          <input type="file" accept="image/*,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <button className="primary-button full" type="button" onClick={submitDeposit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit deposit'}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function WithdrawScreen({ navigate }) {
  const [data, setData] = useState({ wallets: [], settings: {} })
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage)
  }, [])

  const wallet = data.wallets.find((item) => String(item.id ?? item.wallid) === String(walletId))
  const settings = data.settings || {}
  const feePercent = Number(settings.withdrawalFeePercent ?? 7)
  const requested = Number(amount) || 0
  const total = requested + (requested * feePercent / 100)

  async function submitWithdraw() {
    if (!wallet) {
      setMessage({ type: 'error', text: 'Choose a wallet first.' })
      return
    }
    if (!pin) {
      setMessage({ type: 'error', text: 'Enter your transaction PIN.' })
      return
    }
    if (requested < Number(settings.minWithdrawalAmount || 10)) {
      setMessage({ type: 'error', text: `Minimum withdrawal is ${settings.minWithdrawalAmount || 10} USDT.` })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const result = await apiFetch('/api/withdraw', {
        auth: true,
        method: 'POST',
        body: {
          pass: pin,
          wallet: wallet.wallet,
          amount: requested.toFixed(3),
          method: wallet.walletnames || wallet.method,
          bank: wallet.bank || '',
          accountname: wallet.names || '',
        },
      })

      const row = Array.isArray(result) ? result[0] : result
      if (String(row?.status).toLowerCase() === 'failed') throw new Error(row.message)
      navigate('withdraw-success')
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to submit withdrawal.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader title="Withdraw" onBack={() => navigate('profile')} />
      {loading ? <LoadingState text="Loading wallets..." /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <SelectField label="Wallet" value={walletId} onChange={setWalletId}>
          <option value="">Choose wallet</option>
          {data.wallets.map((item) => (
            <option key={item.id ?? item.wallid ?? item.wallet} value={item.id ?? item.wallid}>
              {item.walletnames || item.bank || item.method} · {item.wallet}
            </option>
          ))}
        </SelectField>
        {!data.wallets.length && !loading ? (
          <button className="secondary-button full" type="button" onClick={() => navigate('bind-wallet')}>
            Bind a wallet first
          </button>
        ) : null}
        <InputShell icon={<Wallet size={18} />} label="Amount">
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder="Amount" />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label="Transaction PIN">
          <input inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} placeholder="4-digit PIN" />
        </InputShell>
        <div className="fee-note">
          <span>Fee {feePercent}%</span>
          <b>Total debit: {formatNumber(total)} USDT</b>
        </div>
        <button className="primary-button full" type="button" onClick={submitWithdraw} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit withdrawal'}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function BindWalletScreen({ navigate }) {
  const [data, setData] = useState({ methods: [] })
  const [methodId, setMethodId] = useState('')
  const [wallet, setWallet] = useState('')
  const [bank, setBank] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage)
  }, [])

  const method = data.methods.find((item) => String(item.id ?? item.name) === String(methodId))
  const isLocal = ['local', 'local-transfer', 'bank', 'mobile-money'].includes(String(method?.type || '').toLowerCase())

  async function submitWallet() {
    if (!method || wallet.trim().length < 3 || (isLocal && (bank.trim().length < 2 || name.trim().length < 3))) {
      setMessage({ type: 'error', text: 'Please fill all wallet details correctly.' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const payload = await apiFetch('/api/bindwallet', {
        auth: true,
        method: 'POST',
        body: {
          methodId: method.id || '',
          walletname: method.id ? '' : method.name,
          wallet: wallet.trim(),
          bank: isLocal ? bank.trim() : '',
          name: isLocal ? name.trim() : '',
        },
      })
      if (payload.status !== 'success') throw new Error(payload.message || 'Unable to bind wallet.')
      setMessage({ type: 'success', text: 'Wallet binding successful.' })
      setTimeout(() => navigate('profile'), 500)
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to bind wallet.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader title="Bind Wallet" onBack={() => navigate('profile')} />
      {loading ? <LoadingState text="Loading methods..." /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <SelectField label="Method" value={methodId} onChange={setMethodId}>
          <option value="">Choose method</option>
          {data.methods.map((item) => (
            <option key={item.id || item.name} value={item.id ?? item.name}>
              {item.name}
            </option>
          ))}
        </SelectField>
        {isLocal ? (
          <>
            <InputShell icon={<Wallet size={18} />} label="Bank">
              <input value={bank} onChange={(event) => setBank(event.target.value)} placeholder="Bank name" />
            </InputShell>
            <InputShell icon={<User size={18} />} label="Account name">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Account holder" />
            </InputShell>
          </>
        ) : null}
        <InputShell icon={<WalletCards size={18} />} label={isLocal ? 'Account number' : 'Wallet address'}>
          <input value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder={isLocal ? 'Account number' : 'Wallet address'} />
        </InputShell>
        <button className="primary-button full" type="button" onClick={submitWallet} disabled={submitting}>
          {submitting ? 'Saving...' : 'Bind wallet'}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function TransactionsScreen({ navigate }) {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    async function loadTransactions() {
      setLoading(true)
      try {
        const payload = await apiFetch(`/api/my-transactions?type=${filter}`, { auth: true })
        if (active) setTransactions(payload.transactions || payload.data || [])
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load transactions.' })
      } finally {
        if (active) setLoading(false)
      }
    }
    loadTransactions()
    return () => {
      active = false
    }
  }, [filter])

  return (
    <section className="page-stack">
      <PageHeader title="Transactions" onBack={() => navigate('profile')} />
      <Segmented
        options={[
          { key: 'all', label: 'All' },
          { key: 'deposit', label: 'Deposits' },
          { key: 'withdraw', label: 'Withdrawals' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Message value={message} />
      {loading ? <LoadingState text="Loading transactions..." /> : null}
      <section className="card-list">
        {transactions.map((item) => (
          <article key={item.id} className="list-card static">
            <span>
              <b>{item.title || item.type}</b>
              <small>{item.detail || item.methodLabel || 'Transaction'} · {formatDate(item.timestamp)}</small>
            </span>
            <StatusPill status={{ label: item.statusLabel || item.status, tone: item.status }} />
          </article>
        ))}
        {!loading && !transactions.length ? <EmptyState title="No transactions" text="Deposits and withdrawals will appear here." /> : null}
      </section>
    </section>
  )
}

function ReferralsScreen({ navigate }) {
  const [payload, setPayload] = useState({ refer: '', referrals: [] })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/my-referrals', { auth: true })
      .then((result) => {
        if (active) setPayload(result)
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load referrals.' })
      })
    return () => {
      active = false
    }
  }, [])

  const inviteLink = `${mobileConfig.apiBaseUrl}/register/${payload.refer || referralCode}`

  return (
    <section className="page-stack">
      <PageHeader title="Referrals" onBack={() => navigate('profile')} />
      <Message value={message} />
      <section className="detail-card">
        <InfoRow label="Invite code" value={payload.refer || referralCode} />
        <button className="secondary-button full" type="button" onClick={() => copyText(inviteLink)}>
          Copy invite link
          <Copy size={17} />
        </button>
      </section>
      <section className="card-list">
        {(payload.referrals || []).map((item) => (
          <article key={item.id || item.username} className="list-card static">
            <span>
              <b>{item.username}</b>
              <small>{item.levelLabel || `Level ${item.level}`} · Total deposit {formatUsdt(item.totald)}</small>
            </span>
            <StatusPill status={{ label: item.firstd ? 'Active' : 'Pending', tone: item.firstd ? 'success' : 'pending' }} />
          </article>
        ))}
        {!(payload.referrals || []).length ? <EmptyState title="No referrals yet" text="Share your invite link to build your team." /> : null}
      </section>
    </section>
  )
}

function VipScreen({ navigate }) {
  const [vip, setVip] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/me', { auth: true })
      .then((payload) => {
        if (active) setVip(payload.vip)
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load VIP progress.' })
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="page-stack">
      <PageHeader title="VIP" onBack={() => navigate('profile')} />
      <Message value={message} />
      <section className="vip-card">
        <Medal size={72} />
        <h2>VIP {vip?.viplevel || 1}</h2>
        <ProgressBar label="Total Deposit" value={vip?.depositProgress || 0} />
        <ProgressBar label="Referrals" value={vip?.referralProgress || 0} />
        <ProgressBar label="Total" value={((vip?.depositProgress || 0) + (vip?.referralProgress || 0)) / 2} />
      </section>
    </section>
  )
}

function PinScreen({ navigate }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/me', { auth: true })
      .then((payload) => {
        if (!active) return
        const hasPin = Boolean(payload.profile?.codeset)
        setLocked(hasPin)
        if (hasPin) setMessage({ type: 'info', text: 'You already have a transaction PIN. Contact admin to reset it.' })
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load PIN status.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function submitPin() {
    if (!/^\d{4}$/.test(pin)) {
      setMessage({ type: 'error', text: 'PIN must be 4 digits.' })
      return
    }
    if (pin !== confirm) {
      setMessage({ type: 'error', text: 'Both PIN entries must match.' })
      return
    }
    try {
      const payload = await apiFetch('/api/set-pin', { auth: true, method: 'POST', body: { pin } })
      setLocked(true)
      setMessage({ type: 'success', text: payload.message || 'PIN set successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to set PIN.' })
    }
  }

  return (
    <section className="page-stack">
      <PageHeader title="Transaction PIN" onBack={() => navigate('profile')} />
      {loading ? <LoadingState text="Checking PIN status..." /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <p className="warning-copy">Your transaction PIN cannot be changed in the app after it is set.</p>
        <InputShell icon={<Lock size={18} />} label="Enter PIN">
          <input disabled={locked} inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label="Confirm PIN">
          <input disabled={locked} inputMode="numeric" value={confirm} onChange={(event) => setConfirm(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
        </InputShell>
        <button className="primary-button full" type="button" onClick={submitPin} disabled={locked || loading}>
          Set PIN
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function NotificationsScreen({ navigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/notify', { auth: true })
      .then((payload) => {
        if (active) setItems(Array.isArray(payload) ? payload : [])
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || 'Unable to load notifications.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="page-stack">
      <PageHeader title="Notifications" onBack={() => navigate('home')} />
      <Message value={message} />
      {loading ? <LoadingState text="Loading notifications..." /> : null}
      <section className="card-list">
        {items.map((item) => (
          <article key={item.id} className="list-card static notification-card">
            <Bell size={19} />
            <span>
              <b>{item.title || 'Notification'}</b>
              <small>{item.message || ''}</small>
            </span>
          </article>
        ))}
        {!loading && !items.length ? <EmptyState title="No notifications" text="New account updates will appear here." /> : null}
      </section>
    </section>
  )
}

function FaqScreen({ navigate }) {
  const [open, setOpen] = useState('0')
  return (
    <section className="page-stack">
      <PageHeader title="FAQ" onBack={() => navigate('profile')} />
      <section className="card-list">
        {faqItems.map((item, index) => (
          <button key={item.q} className="faq-card" type="button" onClick={() => setOpen(open === String(index) ? '' : String(index))}>
            <b>{item.q}</b>
            {open === String(index) ? <span>{item.a}</span> : null}
          </button>
        ))}
      </section>
    </section>
  )
}

function SuccessScreen({ navigate, title, text }) {
  return (
    <section className="success-screen-view">
      <CheckCircle2 size={84} />
      <h1>{title}</h1>
      <p>{text}</p>
      <button className="primary-button full" type="button" onClick={() => navigate('home')}>
        Continue
        <ArrowRight size={18} />
      </button>
    </section>
  )
}

function ImageCarousel({ images }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [images.length])

  return (
    <div className="promo-frame">
      <img src={images[index]} alt="" />
      <Dots className="compact" length={images.length} index={index} onChange={setIndex} label="Promo images" />
    </div>
  )
}

function Dots({ length, index, onChange, label, className = '' }) {
  return (
    <div className={`slide-dots ${className}`} aria-label={label}>
      {Array.from({ length }).map((_, dotIndex) => (
        <button
          key={dotIndex}
          className={dotIndex === index ? 'active' : ''}
          type="button"
          aria-label={`Open slide ${dotIndex + 1}`}
          onClick={() => onChange(dotIndex)}
        />
      ))}
    </div>
  )
}

function MatchCard({ match, onClick }) {
  const start = formatMatchStart(match)

  return (
    <button className="match-card" type="button" onClick={onClick}>
      <div className="match-league">
        <span>{leagueName(match)}</span>
        {match.company ? <b>Verified</b> : null}
      </div>
      <div className="match-teams">
        <Team name={match.home} image={match.ihome} />
        <time>
          <strong>{start.time}</strong>
          <span>{start.date}</span>
        </time>
        <Team name={match.away} image={match.iaway} />
      </div>
      <div className="odds-row">
        <Odd label="1-0" value={match.onenil} />
        <Odd label="1-1" value={match.oneone} />
        <Odd label="1-2" value={match.onetwo} />
      </div>
    </button>
  )
}

function Team({ name, image }) {
  return (
    <div className="team-block">
      <img src={image || ballImage} alt="" />
      <span>{name || 'Team'}</span>
    </div>
  )
}

function Odd({ label, value }) {
  return (
    <span className="odd-pill">
      <b>{label}</b>
      <strong>{value || '-'}</strong>
    </span>
  )
}

function PageHeader({ title, onBack }) {
  return (
    <header className="page-header">
      <button className="back-button compact-back" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
      </button>
      <h1>{title}</h1>
    </header>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button key={option.key} className={value === option.key ? 'active' : ''} type="button" onClick={() => onChange(option.key)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="mini-field full-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <b>{value || '-'}</b>
    </div>
  )
}

function StatusPill({ status }) {
  return <em className={`status-pill tone-${status.tone || 'pending'}`}>{status.label}</em>
}

function ProgressBar({ label, value }) {
  const nextValue = Math.max(0, Math.min(Number(value) || 0, 100))
  return (
    <div className="progress-row">
      <span>{label}</span>
      <div>
        <i style={{ width: `${nextValue}%` }} />
      </div>
      <b>{nextValue.toFixed(1)}%</b>
    </div>
  )
}

function LoadingState({ text }) {
  return (
    <div className="loading-state">
      <RefreshCw size={18} className="spin" />
      {text}
    </div>
  )
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      {icon || <CheckCircle2 size={24} />}
      <p>{title}</p>
      <span>{text}</span>
    </div>
  )
}

async function loadPaymentData(setData, setLoading, setMessage) {
  setLoading(true)
  setMessage(null)
  try {
    const payload = await apiFetch('/api/mobile/payment-data', { auth: true })
    setData(payload)
  } catch (error) {
    setMessage({ type: 'error', text: error?.message || 'Unable to load payment data.' })
  } finally {
    setLoading(false)
  }
}

async function copyText(value) {
  if (!value) return
  await navigator.clipboard?.writeText(value).catch(() => null)
}

function filterMatches(matches, activeFilter, nowMs = Date.now()) {
  const todayKey = localDateKey(new Date(nowMs))
  const tomorrow = new Date(nowMs)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = localDateKey(tomorrow)
  const hourMs = 60 * 60 * 1000

  return (Array.isArray(matches) ? matches : [])
    .map((match) => ({ match, startMs: getMatchStartMs(match) }))
    .filter(({ startMs }) => Number.isFinite(startMs) && startMs > nowMs)
    .sort((a, b) => a.startMs - b.startMs)
    .filter(({ startMs }) => {
      if (activeFilter === 'next3h') return startMs <= nowMs + (3 * hourMs)
      if (activeFilter === 'next12h') return startMs <= nowMs + (12 * hourMs)
      if (activeFilter === 'tomorrow') return localDateKey(new Date(startMs)) === tomorrowKey
      return localDateKey(new Date(startMs)) === todayKey
    })
    .map(({ match }) => match)
}

function getMatchStartMs(match) {
  const timestamp = Number(match?.tsgmt)
  if (Number.isFinite(timestamp) && timestamp > 0) return timestamp
  const fallback = new Date(`${match?.date || ''} ${match?.time || ''}`).getTime()
  return Number.isFinite(fallback) ? fallback : 0
}

function formatMatchStart(match) {
  const startMs = getMatchStartMs(match)
  if (startMs) {
    const date = new Date(startMs)
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    }
  }

  return {
    time: match?.time || '--:--',
    date: match?.date || 'Upcoming',
  }
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function leagueName(match) {
  return (match?.league === 'others' ? match?.otherl : match?.league) || 'League'
}

function betStatus(bet) {
  const startMs = getMatchStartMs(bet)
  if (startMs && startMs > Date.now()) return { label: 'Not Started', tone: 'pending' }
  if (bet.won === 'true') return { label: 'Won', tone: 'success' }
  if (bet.won === 'false') return { label: 'Lost', tone: 'failed' }
  return { label: 'Ongoing', tone: 'processing' }
}

function destinationMatchesMethod(destination, method) {
  const code = String(method?.currency_code || method?.name || '').toLowerCase()
  const methodName = String(method?.name || '').toLowerCase()
  return [destination?.currency_code, destination?.name].some((value) => {
    const normalized = String(value || '').toLowerCase()
    return normalized === code || normalized === methodName
  })
}

function getRate(method) {
  const rate = Number(method?.rates)
  return Number.isFinite(rate) && rate > 0 ? rate : 1
}

function formatUsdt(value) {
  return `${formatNumber(value)} USDT`
}

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(3) : '0.000'
}

function formatDate(value) {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
