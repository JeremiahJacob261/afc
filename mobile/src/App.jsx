import React, { useEffect, useMemo, useState } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  WalletCards,
  WifiOff,
} from 'lucide-react'
import { apiFetch } from './lib/api.js'
import { mobileConfig, hasSupabaseConfig } from './lib/config.js'
import { getStoredSession, supabase } from './lib/supabase.js'
import { checkForBundleUpdate, markBundleReady } from './lib/updater.js'

const referralCode = '000208'

const onboardingSlides = [
  {
    title: 'Start with 1 USDT bonus',
    text: 'See the current EFC deposit bonus, minimum deposit, daily percentage, and withdrawal details before signing in.',
    image: '/bfc1.jpg',
    accent: 'cyan',
  },
  {
    title: 'Earn from football activity',
    text: 'Track agent levels, team volume, and weekly salary opportunities from the EFC mobile app.',
    image: '/bfc2.jpg',
    accent: 'cyan',
  },
  {
    title: 'Bonuses, deposits, withdrawals',
    text: 'Keep the key EFC benefits visible before users sign in: deposit bonus, referral bonus, and account access.',
    image: '/bfc4.jpg',
    accent: 'rose',
  },
]

const promoImages = [
  '/simps/AFC.jpg',
  '/simps/AFC2.jpg',
  '/simps/AFC3.jpg',
  '/simps/Referral%20Bonus.jpg',
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

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [booted, setBooted] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)

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
      await new Promise((resolve) => setTimeout(resolve, 900))

      const session = await getStoredSession()
      if (!active) return

      setScreen(session ? 'dashboard' : 'onboarding')
      setBooted(true)
    }

    boot()

    return () => {
      active = false
    }
  }, [])

  const goDashboard = () => {
    setScreen('dashboard')
    setBooted(true)
  }

  const goOnboarding = () => {
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
          onBack={goOnboarding}
          onReset={() => setScreen('reset')}
          onRegister={() => setScreen('register')}
          onSignedIn={goDashboard}
        />
      ) : null}
      {screen === 'register' ? (
        <RegisterScreen
          onBack={goOnboarding}
          onLogin={() => setScreen('login')}
          onSignedIn={goDashboard}
        />
      ) : null}
      {screen === 'reset' ? <ResetScreen onBack={() => setScreen('login')} /> : null}
      {screen === 'dashboard' ? <Dashboard online={online} onLogout={goOnboarding} /> : null}

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

      <section className={`hero-slide accent-${current.accent}`}>
        <div className="slide-media">
          <img src={current.image} alt="" />
        </div>
        <div className="slide-copy">
          <p className="eyebrow">Mobile app</p>
          <h1>{current.title}</h1>
          <p>{current.text}</p>
        </div>
      </section>

      <div className="slide-dots" aria-label="Onboarding slides">
        {onboardingSlides.map((slide, dotIndex) => (
          <button
            key={slide.title}
            className={dotIndex === index ? 'active' : ''}
            type="button"
            aria-label={`Open slide ${dotIndex + 1}`}
            onClick={() => setIndex(dotIndex)}
          />
        ))}
      </div>

      <div className="action-stack">
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (index < onboardingSlides.length - 1) {
              setIndex(index + 1)
            } else {
              onRegister()
            }
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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

      if (!usernameResult.available) {
        throw new Error('Username already exists.')
      }

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
            <select
              value={form.countrycode}
              onChange={(event) => updateField('countrycode', event.target.value)}
            >
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
          <input
            value={form.referral}
            onChange={(event) => updateField('referral', event.target.value)}
            placeholder="Referral code"
          />
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

function Dashboard({ online, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [promoIndex, setPromoIndex] = useState(0)

  async function loadDashboard() {
    setLoading(true)
    setMessage(null)

    try {
      const [me, matchPayload] = await Promise.all([
        apiFetch('/api/me', { auth: true }),
        apiFetch('/api/mobile/matches?limit=6'),
      ])

      setProfile(me.profile)
      setMatches(matchPayload.matches || [])
    } catch (error) {
      setMessage({
        type: error?.status === 401 ? 'error' : 'info',
        text:
          error?.status === 401
            ? 'Your session expired. Please sign in again.'
            : 'Connect to the internet to load live balance and matches.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (online && !profile && !loading) loadDashboard()
  }, [online])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromoIndex((current) => (current + 1) % promoImages.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  async function logout() {
    await supabase?.auth.signOut()
    onLogout()
  }

  const balance = Number(profile?.balance || 0).toFixed(3)
  const firstName = profile?.username || 'Player'

  return (
    <main className="screen dashboard-screen">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Hello</p>
          <h1>{firstName}</h1>
        </div>
        <button className="icon-button" type="button" onClick={logout} aria-label="Sign out">
          <LogOut size={19} />
        </button>
      </header>

      <section className="balance-panel">
        <div>
          <span>Current balance</span>
          <strong>{profile ? `${balance} USDT` : '-- USDT'}</strong>
        </div>
        <WalletCards size={28} />
      </section>

      <div className="promo-frame">
        <img src={promoImages[promoIndex]} alt="" />
        <div className="slide-dots compact">
          {promoImages.map((image, index) => (
            <button
              key={image}
              type="button"
              className={index === promoIndex ? 'active' : ''}
              aria-label={`Open promo ${index + 1}`}
              onClick={() => setPromoIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="section-title-row">
        <h2>Top football matches</h2>
        <button className="refresh-button" type="button" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <Message value={message} />

      <section className="match-list">
        {matches.length ? (
          matches.map((match) => <MatchCard key={match.match_id || match.id} match={match} />)
        ) : (
          <div className="empty-state">
            {online ? <CheckCircle2 size={24} /> : <WifiOff size={24} />}
            <p>{online ? 'No upcoming matches loaded yet.' : 'Offline shell ready.'}</p>
            <span>Live account and match data refresh when the app is online.</span>
          </div>
        )}
      </section>
    </main>
  )
}

function MatchCard({ match }) {
  const league = match.league === 'others' ? match.otherl : match.league
  const start = useMemo(() => formatMatchStart(match), [match])

  return (
    <article className="match-card">
      <div className="match-league">
        <span>{league || 'Football'}</span>
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
    </article>
  )
}

function Team({ name, image }) {
  return (
    <div className="team-block">
      <img src={image || '/simps/ball.png'} alt="" />
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

function formatMatchStart(match) {
  if (match?.tsgmt) {
    const date = new Date(Number(match.tsgmt))
    if (!Number.isNaN(date.getTime())) {
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      }
    }
  }

  return {
    time: match?.time || '--:--',
    date: match?.date || 'Upcoming',
  }
}
