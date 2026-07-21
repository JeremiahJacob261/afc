import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
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
  Link2,
  Lock,
  LogOut,
  Mail,
  Medal,
  MessageCircle,
  RefreshCw,
  FileText,
  Languages,
  ShieldCheck,
  Ticket,
  Trash2,
  Trophy,
  Upload,
  User,
  Users,
  Wallet,
  WalletCards,
  WifiOff,
} from 'lucide-react'
import { apiFetch } from './lib/api.js'
import { hasSupabaseConfig, mobileConfig } from './lib/config.js'
import { setupPushNotifications, unregisterPushToken, updateStoredPushTokenLanguage } from './lib/push.js'
import { getStoredSession, supabase } from './lib/supabase.js'
import { getLocalStorageItem, setLocalStorageItem } from './lib/storage.js'
import { checkForBundleUpdate, markBundleReady } from './lib/updater.js'

const referralCode = '000208'
const appReadyWaitMs = 1500
const bootSplashDelayMs = 700
const sessionBootTimeoutMs = 5000
const referralFilters = ['all', 1, 2, 3]
const bfcImages = ['/bfc1.jpg', '/bfc2.jpg', '/bfc3.jpg', '/bfc4.jpg', '/bfc5.jpg']
const ballImage = '/simps/ball.png'
const languageStorageKey = 'efc-language'
const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'my', label: 'မြန်မာ' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
]

const transferOptions = {
  fcfa: [
    { key: 'wave', label: 'Wave', bank: 'Wave' },
    { key: 'mtn', label: 'MTN Money', bank: 'MTN Money' },
  ],
  mmk: [
    { key: 'wave', label: 'Wave', bank: 'Wave' },
    { key: 'kpay', label: 'KPay', bank: 'kpay' },
  ],
  idr: [
    { key: 'DANA', label: 'DANA', bank: 'DANA' },
  ],
}

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
  ['otherscores', 'mobile.markets.other'],
]

const vipBonus = {
  1: 0,
  2: 0.10,
  3: 0.20,
  4: 0.33,
  5: 0.47,
  6: 0.63,
  7: 0.83,
}

const motionEase = [0.22, 1, 0.36, 1]
const quickEase = [0.4, 0, 0.2, 1]
const pressSpring = { type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }
const navSpring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
const topScreenDepth = {
  splash: 0,
  onboarding: 1,
  login: 2,
  register: 2,
  reset: 3,
  app: 4,
}
const routeMotionMeta = {
  home: { depth: 0, tabIndex: 0 },
  matches: { depth: 0, tabIndex: 1 },
  bets: { depth: 0, tabIndex: 2 },
  profile: { depth: 0, tabIndex: 3 },
  match: { depth: 1, tabIndex: 1 },
  bet: { depth: 1, tabIndex: 2 },
  deposit: { depth: 1, tabIndex: 3 },
  withdraw: { depth: 1, tabIndex: 3 },
  'bind-wallet': { depth: 1, tabIndex: 3 },
  transactions: { depth: 1, tabIndex: 3 },
  referrals: { depth: 1, tabIndex: 3 },
  vip: { depth: 1, tabIndex: 3 },
  pin: { depth: 1, tabIndex: 3 },
  notifications: { depth: 1, tabIndex: 3 },
  faq: { depth: 1, tabIndex: 3 },
  'deposit-success': { depth: 2, tabIndex: 3 },
  'withdraw-success': { depth: 2, tabIndex: 3 },
}

function makeRoute(name, params = {}) {
  return { name, params }
}

function usePreviousValue(value) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

function getScreenMotionDirection(screen, previousScreen) {
  if (!previousScreen) return 'switch'
  const currentDepth = topScreenDepth[screen] ?? 1
  const previousDepth = topScreenDepth[previousScreen] ?? 1
  if (currentDepth > previousDepth) return 'forward'
  if (currentDepth < previousDepth) return 'back'
  return 'switch'
}

function getRouteKey(route) {
  const id = route.params?.id || route.params?.betId || route.params?.matchId || ''
  return `${route.name}:${id}`
}

function getRouteMotionMeta(routeName) {
  return routeMotionMeta[routeName] || { depth: 1, tabIndex: 3 }
}

function getRouteMotionDirection(routeName, previousRouteName) {
  if (!previousRouteName) return 'tab'
  const current = getRouteMotionMeta(routeName)
  const previous = getRouteMotionMeta(previousRouteName)

  if (current.depth > previous.depth) return 'forward'
  if (current.depth < previous.depth) return 'back'
  if (current.depth === 0 && previous.depth === 0) return 'tab'
  if (current.tabIndex > previous.tabIndex) return 'forward'
  if (current.tabIndex < previous.tabIndex) return 'back'
  return 'switch'
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForStartupTask(promise, timeoutMs, label) {
  let timeoutId
  const timeout = Symbol('startup-timeout')
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => resolve(timeout), timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    if (result === timeout) {
      console.warn(`${label} timed out during mobile boot.`)
    }
  } catch (error) {
    console.warn(`${label} failed during mobile boot.`, error)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function createScreenVariants(shouldReduceMotion) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.16, ease: motionEase } },
      exit: { opacity: 0, transition: { duration: 0.12, ease: quickEase } },
    }
  }

  return {
    initial: (direction) => ({
      opacity: 0,
      y: direction === 'back' ? -10 : 12,
      scale: 0.995,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.24, ease: motionEase },
    },
    exit: (direction) => ({
      opacity: 0,
      y: direction === 'back' ? 8 : -8,
      scale: 0.998,
      transition: { duration: 0.16, ease: quickEase },
    }),
  }
}

function createPageVariants(shouldReduceMotion) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.16, ease: motionEase } },
      exit: { opacity: 0, transition: { duration: 0.12, ease: quickEase } },
    }
  }

  return {
    initial: (direction) => {
      if (direction === 'forward') return { opacity: 0, x: 30, scale: 0.992 }
      if (direction === 'back') return { opacity: 0, x: -26, scale: 0.996 }
      return { opacity: 0, y: 10, scale: 0.996 }
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.24, ease: motionEase },
    },
    exit: (direction) => {
      if (direction === 'forward') {
        return { opacity: 0, x: -18, scale: 0.996, transition: { duration: 0.16, ease: quickEase } }
      }
      if (direction === 'back') {
        return { opacity: 0, x: 18, scale: 0.996, transition: { duration: 0.16, ease: quickEase } }
      }
      return { opacity: 0, y: -6, scale: 0.998, transition: { duration: 0.14, ease: quickEase } }
    },
  }
}

export default function App() {
  const { t, i18n } = useTranslation('common')
  const shouldReduceMotion = useReducedMotion()
  const [screen, setScreen] = useState('splash')
  const [route, setRoute] = useState(makeRoute('home'))
  const [booted, setBooted] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [successAmount, setSuccessAmount] = useState('')
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const previousScreen = usePreviousValue(screen)
  const screenDirection = getScreenMotionDirection(screen, previousScreen)
  const screenVariants = useMemo(() => createScreenVariants(shouldReduceMotion), [shouldReduceMotion])
  const fixedShellVariants = useMemo(() => createScreenVariants(true), [])

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
      let session = null
      let storedLanguage = ''
      let hasSeenLanguagePrompt = false

      try {
        await waitForStartupTask(markBundleReady(), appReadyWaitMs, 'Marking bundle ready')
        checkForBundleUpdate().catch((error) => {
          console.warn('Mobile update check failed:', error)
        })
        await waitForStartupTask(SplashScreen.hide(), appReadyWaitMs, 'Hiding splash screen')
        await delay(bootSplashDelayMs)

        session = await getStoredSession({ timeoutMs: sessionBootTimeoutMs })
        storedLanguage = getLocalStorageItem(languageStorageKey, '')
        hasSeenLanguagePrompt = getLocalStorageItem('efc-language-prompt-shown', '') === 'true'

        if (session) {
          updateStoredPushTokenLanguage(storedLanguage || 'en').catch((error) => {
            console.warn('Unable to sync push notification language:', error)
          })
        }
      } catch (error) {
        console.warn('Mobile boot failed; continuing without stored session.', error)
      } finally {
        if (!active) return

        setShowLanguageDialog(!storedLanguage && !hasSeenLanguagePrompt)
        setScreen(session ? 'app' : 'onboarding')
        setRoute(makeRoute('home'))
        setBooted(true)
      }
    }

    boot()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [screen, shouldReduceMotion])

  function openApp(nextRoute = makeRoute('home')) {
    setRoute(nextRoute)
    setScreen('app')
    setBooted(true)
  }

  function handleLanguageSelect(language) {
    i18n.changeLanguage(language)
    setLocalStorageItem(languageStorageKey, language)
    setLocalStorageItem('efc-language-prompt-shown', 'true')
    updateStoredPushTokenLanguage(language).catch((error) => {
      console.warn('Unable to update push notification language:', error)
    })
    setShowLanguageDialog(false)
  }

  function dismissLanguageDialog() {
    setLocalStorageItem('efc-language-prompt-shown', 'true')
    setShowLanguageDialog(false)
  }

  function logoutToOnboarding() {
    setRoute(makeRoute('home'))
    setScreen('onboarding')
    setBooted(true)
  }

  const activeScreen = (() => {
    if (!booted && screen !== 'splash') return <InAppSplash />
    if (screen === 'splash') return <InAppSplash />
    if (screen === 'onboarding') {
      return <Onboarding onLogin={() => setScreen('login')} onRegister={() => setScreen('register')} />
    }
    if (screen === 'login') {
      return (
        <LoginScreen
          onBack={() => setScreen('onboarding')}
          onReset={() => setScreen('reset')}
          onRegister={() => setScreen('register')}
          onSignedIn={() => openApp(makeRoute('home'))}
        />
      )
    }
    if (screen === 'register') {
      return (
        <RegisterScreen
          onBack={() => setScreen('onboarding')}
          onLogin={() => setScreen('login')}
          onSignedIn={() => openApp(makeRoute('home'))}
        />
      )
    }
    if (screen === 'reset') return <ResetScreen onBack={() => setScreen('login')} />
    if (screen === 'app') {
      return (
        <UserApp
          online={online}
          route={route}
          setRoute={setRoute}
          onLogout={logoutToOnboarding}
          successAmount={successAmount}
          setSuccessAmount={setSuccessAmount}
        />
      )
    }
    return <InAppSplash />
  })()
  const screenKey = !booted && screen !== 'splash' ? 'booting-splash' : screen
  const isAppScreen = screenKey === 'app'

  return (
    <div className="app-shell">
      {!online ? (
        <div className="offline-pill">
          <WifiOff size={14} />
          {t('status.offlineMode')}
        </div>
      ) : null}

      <AnimatePresence initial={false} mode="wait" custom={screenDirection}>
        <motion.div
          key={screenKey}
          className={`screen-motion-root${isAppScreen ? ' fixed-shell-root' : ''}`}
          custom={screenDirection}
          variants={isAppScreen ? fixedShellVariants : screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {activeScreen}
        </motion.div>
      </AnimatePresence>

      <FirstLaunchLanguageDialog open={showLanguageDialog} onSelect={handleLanguageSelect} onDismiss={dismissLanguageDialog} />
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{
          top: 'calc(env(safe-area-inset-top) + 14px)',
          left: 12,
          right: 12,
        }}
        toastOptions={{
          duration: 2200,
          style: {
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(5,13,25,0.94)',
            color: '#f7fbff',
            boxShadow: '0 18px 50px rgba(0,0,0,0.34)',
            backdropFilter: 'blur(16px)',
            fontSize: 13,
            fontWeight: 800,
          },
          success: {
            iconTheme: {
              primary: '#1BB6FF',
              secondary: '#06101F',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff6b7f',
              secondary: '#06101F',
            },
          },
        }}
      />
    </div>
  )
}

function InAppSplash() {
  const { t } = useTranslation('common')

  return (
    <main className="splash-screen">
      <div className="splash-image">
        <img src="/bfc4.jpg" alt="" />
      </div>
      <div className="splash-copy">
        <p className="eyebrow">{t('mobile.splash.eyebrow')}</p>
        <h1>{t('mobile.splash.title')}</h1>
      </div>
    </main>
  )
}

function FirstLaunchLanguageDialog({ open, onSelect, onDismiss }) {
  const { t, i18n } = useTranslation('common')
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return languageOptions.some((language) => language.code === i18n.language) ? i18n.language : 'en'
  })

  useEffect(() => {
    if (!open) return

    setSelectedLanguage(languageOptions.some((language) => language.code === i18n.language) ? i18n.language : 'en')
  }, [open, i18n.language])

  if (!open) return null

  return (
    <div className="language-dialog-backdrop">
      <motion.div
        className="language-dialog-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.2, ease: motionEase }}
      >
        <p className="eyebrow">{t('common.language')}</p>
        <h2>Choose your app language</h2>
        <p>This will set the language for your app experience and account.</p>

        <div className="language-option-grid">
          {languageOptions.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`language-option${selectedLanguage === language.code ? ' active' : ''}`}
              onClick={() => setSelectedLanguage(language.code)}
            >
              {language.label}
            </button>
          ))}
        </div>

        <div className="language-actions">
          <button className="secondary-button" type="button" onClick={onDismiss}>
            Skip
          </button>
          <button className="primary-button" type="button" onClick={() => onSelect(selectedLanguage)}>
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Onboarding({ onLogin, onRegister }) {
  const { t } = useTranslation('common')
  const [index, setIndex] = useState(0)
  const onboardingSlides = t('mobile.onboarding.slides', { returnObjects: true })
  const current = onboardingSlides[index]

  return (
    <main className="screen onboarding-screen">
      <header className="brand-row">
        <span className="brand-lockup">
          <img src="/european.ico" alt="EFC" />
          <strong>{t('common.appName')}</strong>
        </span>
        <button className="text-action" type="button" onClick={onLogin}>
          {t('common.signIn')}
        </button>
      </header>

      <section className="hero-slide">
        <div className="slide-media">
          <img src={current.image} alt="" />
        </div>
        <div className="slide-copy">
          <p className="eyebrow">{t('mobile.onboarding.eyebrow')}</p>
          <h1>{current.title}</h1>
          <p>{current.text}</p>
        </div>
      </section>

      <Dots length={onboardingSlides.length} index={index} onChange={setIndex} label={t('mobile.onboarding.slidesLabel')} />

      <div className="action-stack">
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (index < onboardingSlides.length - 1) setIndex(index + 1)
            else onRegister()
          }}
        >
          {index < onboardingSlides.length - 1 ? t('common.next') : t('common.createAccount')}
          <ArrowRight size={18} />
        </button>
        <button className="secondary-button" type="button" onClick={onLogin}>
          {t('mobile.onboarding.alreadyHaveAccount')}
        </button>
      </div>
    </main>
  )
}

function AuthFrame({ title, subtitle, children, onBack }) {
  const { t } = useTranslation('common')

  return (
    <main className="screen auth-screen">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        {t('common.back')}
      </button>
      <section className="auth-card">
        <div className="auth-logo">
          <img src="/european.ico" alt="EFC" />
          <span>{t('common.appName')}</span>
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

function notifyMessage(setMessage, type, text) {
  setMessage({ type, text })

  if (type === 'success') {
    toast.success(text)
  } else if (type === 'error') {
    toast.error(text)
  } else {
    toast(text)
  }
}

function LoginScreen({ onBack, onReset, onRegister, onSignedIn }) {
  const { t } = useTranslation('common')
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    if (!hasSupabaseConfig() || !supabase) {
      notifyMessage(setMessage, 'error', t('messages.mobileAuthMissing'))
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
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableSignIn'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<User size={18} />} label={t('auth.login.identityLabel')}>
          <input
            value={identity}
            onChange={(event) => setIdentity(event.target.value.replace(/\s/g, ''))}
            autoComplete="username"
            placeholder={t('auth.login.identityPlaceholder')}
            required
          />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label={t('auth.login.passwordLabel')} action={
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder={t('auth.login.passwordPlaceholder')}
            required
          />
        </InputShell>
        <button className="link-button right" type="button" onClick={onReset}>
          {t('auth.login.forgotPassword')}
        </button>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          <ArrowRight size={18} />
        </button>
      </form>
      <button className="link-button centered" type="button" onClick={onRegister}>
        {t('auth.login.newAccount')}
      </button>
    </AuthFrame>
  )
}

function RegisterScreen({ onBack, onLogin, onSignedIn }) {
  const { t } = useTranslation('common')
  const countryCodes = [
    { code: '+234', name: t('mobile.countryCodes.nigeria') },
    { code: '+91', name: t('mobile.countryCodes.india') },
    { code: '+92', name: t('mobile.countryCodes.pakistan') },
    { code: '+62', name: t('mobile.countryCodes.indonesia') },
    { code: '+1', name: t('mobile.countryCodes.unitedStates') },
    { code: '+44', name: t('mobile.countryCodes.unitedKingdom') },
    { code: '+27', name: t('mobile.countryCodes.southAfrica') },
  ]
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
      notifyMessage(setMessage, 'error', t('messages.mobileAuthMissing'))
      return
    }

    if (form.phone.length < 9) {
      notifyMessage(setMessage, 'error', t('messages.phoneIncomplete'))
      return
    }

    if (form.password !== form.confirmPassword) {
      notifyMessage(setMessage, 'error', t('messages.passwordsMustMatch'))
      return
    }

    if (!form.accepted) {
      notifyMessage(setMessage, 'error', t('messages.acceptTerms'))
      return
    }

    setLoading(true)

    try {
      const usernameResult = await apiFetch('/api/check-username', {
        method: 'POST',
        body: { username: form.username.trim() },
      })

      if (!usernameResult.available) throw new Error(t('messages.usernameExists'))

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
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableCreateAccount'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.register.title')} subtitle={t('auth.register.subtitle')} onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<User size={18} />} label={t('auth.register.username')}>
          <input
            value={form.username}
            onChange={(event) => updateField('username', event.target.value.replace(/\s/g, ''))}
            autoComplete="username"
            placeholder={t('auth.register.usernamePlaceholder')}
            required
          />
        </InputShell>
        <InputShell icon={<Mail size={18} />} label={t('auth.register.email')}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            placeholder={t('auth.register.emailPlaceholder')}
            required
          />
        </InputShell>
        <div className="two-column">
          <label className="mini-field">
            <span>{t('auth.register.code')}</span>
            <select value={form.countrycode} onChange={(event) => updateField('countrycode', event.target.value)}>
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.code} {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mini-field">
            <span>{t('auth.register.phone')}</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value.replace(/[^\d]/g, ''))}
              autoComplete="tel"
              placeholder={t('auth.register.phonePlaceholder')}
              required
            />
          </label>
        </div>
        <InputShell icon={<ShieldCheck size={18} />} label={t('auth.register.referralCode')}>
          <input value={form.referral} onChange={(event) => updateField('referral', event.target.value)} />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label={t('auth.register.password')} action={
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="new-password"
            placeholder={t('auth.register.password')}
            required
          />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label={t('auth.register.confirmPassword')}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            autoComplete="new-password"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            required
          />
        </InputShell>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.accepted}
            onChange={(event) => updateField('accepted', event.target.checked)}
          />
          <span>{t('auth.register.terms')}</span>
        </label>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          <ArrowRight size={18} />
        </button>
      </form>
      <button className="link-button centered" type="button" onClick={onLogin}>
        {t('auth.register.hasAccount')}
      </button>
    </AuthFrame>
  )
}

function ResetScreen({ onBack }) {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    if (!hasSupabaseConfig() || !supabase) {
      notifyMessage(setMessage, 'error', t('messages.mobileAuthMissing'))
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${mobileConfig.apiBaseUrl}/login`,
      })
      if (error) throw error
      notifyMessage(setMessage, 'success', t('messages.resetEmailSent'))
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableSendReset'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')} onBack={onBack}>
      <form className="form-stack" onSubmit={submit}>
        <InputShell icon={<Mail size={18} />} label={t('auth.register.email')}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={t('auth.register.emailPlaceholder')}
            required
          />
        </InputShell>
        <Message value={message} />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t('auth.reset.submitting') : t('auth.reset.submit')}
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
  const { t } = useTranslation('common')
  const shouldReduceMotion = useReducedMotion()
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useCallback((name, params = {}) => setRoute(makeRoute(name, params)), [setRoute])
  const backHome = useCallback(() => navigate('home'), [navigate])
  const routeKey = getRouteKey(route)
  const previousRouteName = usePreviousValue(route.name)
  const routeDirection = getRouteMotionDirection(route.name, previousRouteName)
  const routeVariants = useMemo(() => createPageVariants(shouldReduceMotion), [shouldReduceMotion])

  const refreshNotificationSummary = useCallback(async () => {
    try {
      const payload = await apiFetch('/api/notify?summary=1', { auth: true })
      setUnreadCount(Number(payload?.unreadCount || 0))
    } catch (error) {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    refreshNotificationSummary()
  }, [refreshNotificationSummary])

  useEffect(() => {
    let cleanup = () => {}
    let active = true

    setupPushNotifications({
      onNotification(notification) {
        const title = notification?.title || t('mobile.notifications.fallbackTitle')
        const body = notification?.body || ''
        toast(body ? `${title}: ${body}` : title)
        refreshNotificationSummary()
      },
      onAction(action) {
        const data = action?.notification?.data || {}
        const routeName = data.route || 'notifications'

        if (routeName === 'match' && data.matchId) {
          navigate('match', { id: data.matchId })
        } else if (routeName === 'bet' && data.betId) {
          navigate('bet', { id: data.betId })
        } else if (routeName === 'referrals') {
          navigate('referrals')
        } else {
          navigate('notifications')
        }
        refreshNotificationSummary()
      },
      onError(error) {
        console.warn('Push notification setup failed:', error)
      },
    }).then((dispose) => {
      if (active) cleanup = dispose
      else dispose?.()
    })

    return () => {
      active = false
      cleanup?.()
    }
  }, [navigate, refreshNotificationSummary, t])

  async function logout() {
    await unregisterPushToken().catch(() => null)
    await supabase?.auth.signOut()
    onLogout()
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [routeKey, shouldReduceMotion])

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
    if (route.name === 'notifications') return <NotificationsScreen navigate={navigate} onRead={refreshNotificationSummary} />
    if (route.name === 'faq') return <FaqScreen navigate={navigate} />
    if (route.name === 'deposit-success') {
      return (
        <SuccessScreen
          navigate={navigate}
          title={t('mobile.deposit.successTitle')}
          text={successAmount ? t('messages.depositSubmittedWithAmount', { amount: successAmount }) : t('messages.depositSubmitted', { amount: '' })}
        />
      )
    }
    if (route.name === 'withdraw-success') return <SuccessScreen navigate={navigate} title={t('mobile.withdraw.successTitle')} text={t('messages.withdrawalSent')} />
    return <HomeScreen online={online} navigate={navigate} onLogout={logout} />
  })()

  return (
    <main className="app-view">
      <TopBar navigate={navigate} onHome={backHome} unreadCount={unreadCount} />
      <div className="view-body">
        <AnimatePresence initial={false} mode="wait" custom={routeDirection}>
          <motion.div
            key={routeKey}
            className="route-transition"
            custom={routeDirection}
            variants={routeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav active={route.name} navigate={navigate} />
    </main>
  )
}

function TopBar({ navigate, onHome, unreadCount = 0 }) {
  const { t } = useTranslation('common')

  return (
    <header className="app-topbar">
      <motion.button
        className="top-icon"
        type="button"
        onClick={() => navigate('profile')}
        aria-label={t('mobile.topBar.profile')}
        whileTap={{ scale: 0.94 }}
        transition={pressSpring}
      >
        <User size={20} />
      </motion.button>
      <motion.button className="top-brand" type="button" onClick={onHome} whileTap={{ scale: 0.98 }} transition={pressSpring}>
        {t('common.brandFull').toUpperCase()}
      </motion.button>
      <motion.button
        className="top-icon"
        type="button"
        onClick={() => navigate('notifications')}
        aria-label={t('mobile.topBar.notifications')}
        whileTap={{ scale: 0.94 }}
        transition={pressSpring}
      >
        <Bell size={20} />
        <AnimatePresence initial={false}>
          {unreadCount > 0 ? (
            <motion.span
              key="notification-badge"
              className="notification-badge"
              initial={{ opacity: 0, scale: 0.7, y: 3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 2 }}
              transition={{ duration: 0.18, ease: motionEase }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>
    </header>
  )
}

function BottomNav({ active, navigate }) {
  const { t } = useTranslation('common')
  const items = [
    { key: 'home', label: t('mobile.nav.top'), icon: Home },
    { key: 'matches', label: t('mobile.nav.matches'), icon: Trophy },
    { key: 'bets', label: t('mobile.nav.bets'), icon: Ticket },
    { key: 'profile', label: t('mobile.nav.profile'), icon: User },
  ]

  return (
    <nav className="bottom-nav" aria-label={t('mobile.nav.label')}>
      {items.map((item) => {
        const Icon = item.icon
        const selected = active === item.key || (item.key === 'home' && active === 'match')
        return (
          <motion.button
            key={item.key}
            className={selected ? 'active' : ''}
            type="button"
            onClick={() => navigate(item.key)}
            aria-current={selected ? 'page' : undefined}
            whileTap={{ scale: 0.96 }}
            transition={pressSpring}
          >
            {selected ? <motion.span className="bottom-nav-active-bg" layoutId="bottom-nav-active-bg" transition={navSpring} /> : null}
            <Icon className="bottom-nav-icon" size={21} />
            <span className="bottom-nav-label">{item.label}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}

function HomeScreen({ navigate, onLogout, online }) {
  const { t } = useTranslation('common')
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
        setMessage({ type: 'error', text: t('messages.sessionExpired') })
      } else {
        setMessage({ type: 'info', text: t('messages.unableRefreshAccount') })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

  const visibleMatches = useMemo(() => filterMatches(matches, activeFilter), [matches, activeFilter])
  const matchFilters = [
    { key: 'today', label: t('mobile.filters.today') },
    { key: 'next3h', label: t('mobile.filters.next3h') },
    { key: 'next24h', label: t('mobile.filters.next24h') },
    { key: 'tomorrow', label: t('mobile.filters.tomorrow') },
  ]
  const balance = Number(profile?.balance || 0).toFixed(3)

  return (
    <section className="page-stack">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{t('mobile.home.hello')}</p>
          <h1>{profile?.username || t('common.player')}</h1>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} aria-label={t('common.signOut')}>
          <LogOut size={19} />
        </button>
      </header>

      <section className="balance-panel">
        <div>
          <span>{t('common.currentBalance')}</span>
          <strong>{profile ? `${balance} USDT` : '-- USDT'}</strong>
        </div>
        <button className="mini-cta" type="button" onClick={() => navigate('deposit')}>
          {t('common.deposit')}
          <ChevronRight size={16} />
        </button>
      </section>

      <a className="telegram-link" href="https://t.me/+e1nirNMro8A4NWVk" target="_blank" rel="noreferrer">
        <span>
          <b>{t('mobile.home.telegram')}</b>
          <small>{t('mobile.home.telegramCopy')}</small>
        </span>
        <ChevronRight size={18} />
      </a>

      <ImageCarousel images={bfcImages} />

      <div className="section-title-row">
        <h2>{t('mobile.home.topMatches')}</h2>
        <button className="refresh-button" type="button" onClick={loadHome} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {t('common.refresh')}
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
            title={online ? t('emptyStates.noUpcomingMatches') : t('emptyStates.offlineShellReady')}
            text={t('emptyStates.liveRefreshOnline')}
          />
        )}
      </section>
    </section>
  )
}

function MatchesScreen({ navigate }) {
  const { t } = useTranslation('common')
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
      setMessage({ type: 'error', text: error?.message || t('messages.unableLoadMatches') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  return (
    <section className="page-stack">
      <PageHeader title={t('common.matches')} onBack={() => navigate('home')} />
      <Message value={message} />
      {loading ? <LoadingState text={t('mobile.matches.loading')} /> : null}
      <section className="match-list">
        {matches.map((match) => (
          <MatchCard key={match.match_id || match.id} match={match} onClick={() => navigate('match', { id: match.match_id })} />
        ))}
        {!loading && !matches.length ? <EmptyState title={t('emptyStates.noMatches')} text={t('emptyStates.matchesComing')} /> : null}
      </section>
    </section>
  )
}

function MatchDetailScreen({ matchId, navigate }) {
  const { t } = useTranslation('common')
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
        const nextMatch = await hydrateCompanyMarket(matchPayload.match)
        if (!active) return
        setMatch(nextMatch)
        setProfile(me.profile)
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadMatch') })
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
      notifyMessage(setMessage, 'error', t('messages.chooseScoreMarket'))
      return
    }

    const amount = Number(stake)
    if (!Number.isFinite(amount) || amount < 1) {
      notifyMessage(setMessage, 'error', t('messages.stakeMinimum'))
      return
    }

    setPlacing(true)
    setMessage(null)
    try {
      const clientBetId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null
      const payload = await apiFetch('/api/place-bet', {
        auth: true,
        method: 'POST',
        body: {
          match_id: match.match_id,
          picked,
          stake: amount,
          client_bet_id: clientBetId,
        },
      })
      const nextBetId = payload?.betid || clientBetId
      if (!nextBetId) {
        throw new Error(t('messages.unableLoadBet'))
      }
      notifyMessage(setMessage, 'success', t('messages.betPlaced'))
      setStake('')
      setPicked('')
      navigate('bet', { id: nextBetId })
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.unablePlaceBet'))
    } finally {
      setPlacing(false)
    }
  }

  const display = formatMatchStart(match, t)
  const level = Number(profile?.viplevel || profile?.vip?.viplevel || 1)
  const companyMatch = isCompanyGame(match)
  const companyMarketKey = getCompanyMarketKey(match)
  const companyMarketLabel = companyMarketKey ? formatMarketName(companyMarketKey, t) : ''

  return (
    <section className="page-stack">
      <PageHeader title={t('mobile.match.details')} onBack={() => navigate('matches')} />
      {loading ? <LoadingState text={t('mobile.match.loading')} /> : null}
      <Message value={message} />
      {match ? (
        <>
          <article className={companyMatch ? 'detail-card match-detail-card company-match-detail-card' : 'detail-card match-detail-card'}>
            {companyMatch ? (
              <div className="company-detail-banner">
                <ShieldCheck size={13} />
                <span>{t('mobile.match.companyGame')}</span>
                {companyMarketLabel ? <b>{companyMarketLabel}</b> : null}
              </div>
            ) : null}
            <p className="match-league-name">{leagueName(match, t)}</p>
            <div className="match-teams large">
              <Team name={match.home} image={match.ihome} />
              <time>
                <strong>{display.time}</strong>
                <span>{display.date}</span>
              </time>
              <Team name={match.away} image={match.iaway} />
            </div>
            <div className="balance-inline">
              <span>{t('common.balance')}</span>
              <b>{Number(profile?.balance || 0).toFixed(3)} USDT</b>
            </div>
          </article>

          <section className="market-grid">
            {markets.map(([key, label]) => {
              const baseOdd = Number(match[key] || 0)
              const odd = baseOdd ? baseOdd * (1 + Number(vipBonus[level] || 0)) : 0
              const companyOdd = companyMarketKey === key
              const marketLabel = label.includes('.') ? t(label) : label
              const marketClassName = [
                'market-pill',
                picked === key ? 'active' : '',
                companyOdd ? 'company-odd-pill' : '',
              ].filter(Boolean).join(' ')
              return (
                <button
                  key={key}
                  type="button"
                  className={marketClassName}
                  onClick={() => setPicked(key)}
                  disabled={!odd}
                >
                  {companyOdd ? (
                    <em className="company-odd-marker">
                      <ShieldCheck size={12} />
                      {t('mobile.match.companyGame')}
                    </em>
                  ) : null}
                  <span>{marketLabel}</span>
                  <b className={companyOdd ? 'market-odd-value company-odd-value' : 'market-odd-value'}>
                    {odd ? odd.toFixed(3) : t('common.notAvailable')}
                  </b>
                </button>
              )
            })}
          </section>

          <section className="detail-card">
            <InputShell icon={<Ticket size={18} />} label={t('mobile.match.stakeAmount')}>
              <input
                inputMode="decimal"
                value={stake}
                onChange={(event) => setStake(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder="1.000"
              />
            </InputShell>
            <button className="primary-button full" type="button" onClick={placeBet} disabled={placing}>
              {placing ? t('mobile.match.placingBet') : t('mobile.match.placeBet')}
              <ArrowRight size={18} />
            </button>
          </section>
        </>
      ) : null}
    </section>
  )
}

function BetsScreen({ navigate }) {
  const { t } = useTranslation('common')
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
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadBets') })
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
    <section className="page-stack account-linked-page">
      <PageHeader title={t('common.myBets')} onBack={() => navigate('home')} />
      <Segmented
        options={[
          { key: 'unsettled', label: t('mobile.bets.unsettledWithCount', { count: bets.unsettled.length }) },
          { key: 'settled', label: t('mobile.bets.settledWithCount', { count: bets.settled.length }) },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Message value={message} />
      {loading ? <LoadingState text={t('mobile.bets.loading')} /> : null}
      <section className="card-list">
        {list.map((bet) => {
          const detailId = bet.betid || bet.id
          return (
            <button key={detailId} className="list-card" type="button" onClick={() => navigate('bet', { id: detailId })} disabled={!detailId}>
              <span>
                <b>{bet.home || t('common.home')} vs {bet.away || t('common.away')}</b>
                <small>{bet.picked || bet.pick || t('common.score')} · {formatUsdt(bet.stake)}</small>
              </span>
              <StatusPill status={betStatus(bet, t)} />
            </button>
          )
        })}
        {!loading && !list.length ? <EmptyState title={t('emptyStates.noBets')} text={t('emptyStates.betsComing')} /> : null}
      </section>
    </section>
  )
}

function BetDetailScreen({ betId, navigate }) {
  const { t } = useTranslation('common')
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
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadBet') })
      } finally {
        if (active) setLoading(false)
      }
    }

    if (betId) loadBet()
    return () => {
      active = false
    }
  }, [betId])

  const display = formatMatchStart({ ...match, ...bet }, t)
  const status = betStatus(bet, t)
  const selectedMarketValue = bet?.market || bet?.picked || bet?.pick
  const selectedMarket = formatMarketName(selectedMarketValue, t)
  const selectedMarketKey = getMarketKey(selectedMarketValue)
  const isCompanyScore = selectedMarketKey && isProtectedMarket(match, selectedMarketKey)
  const odd = Number(bet?.odd)
  const winnings = bet?.aim ?? bet?.profit
  const result = match?.results || status.label
  const matchName = `${bet?.home || match?.home || t('common.home')} vs ${bet?.away || match?.away || t('common.away')}`

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.bets.details')} onBack={() => navigate('bets')} />
      {loading ? <LoadingState text={t('mobile.bets.loadingOne')} /> : null}
      <Message value={message} />
      {bet ? (
        <section className="detail-card">
          <InfoRow label={t('mobile.bets.match')} value={matchName} />
          <InfoRow label={t('mobile.bets.league')} value={leagueName({ ...match, league: match?.league || bet.league, otherl: match?.otherl || bet.otherl }, t)} />
          <InfoRow
            label={t('mobile.bets.matchId')}
            value={bet.match_id || match?.match_id || t('common.placeholderDash')}
          />
          <InfoRow
            label={t('mobile.bets.score')}
            value={(
              <span className="bet-detail-score-value">
                {selectedMarket || t('common.score')}
                {isCompanyScore ? (
                  <em className="company-score-badge">
                    <ShieldCheck size={11} />
                    {t('common.verified')}
                  </em>
                ) : null}
              </span>
            )}
          />
          <InfoRow label={t('mobile.bets.odds')} value={Number.isFinite(odd) ? `${odd.toFixed(3)}%` : t('common.placeholderDash')} />
          <InfoRow label={t('mobile.bets.stake')} value={formatUsdt(bet.stake)} />
          <InfoRow label={t('mobile.bets.potentialWinnings')} value={formatUsdt(winnings)} />
          <InfoRow label={t('mobile.bets.kickoff')} value={`${display.date} ${display.time}`} />
          <InfoRow label={t('mobile.bets.result')} value={result} />
          <InfoRow label={t('mobile.bets.status')} value={status.label} />
          <InfoRow label={t('mobile.bets.betId')} value={bet.betid || betId} />
          {status.tone === 'pending' ? <p className="bet-cancel-note">{t('mobile.bets.cancelNote')}</p> : null}
        </section>
      ) : null}
    </section>
  )
}

function ProfileScreen({ navigate, onLogout }) {
  const { t, i18n } = useTranslation('common')
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
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadProfile') })
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  const inviteCode = profile?.newrefer || referralCode
  const inviteLink = `${mobileConfig.apiBaseUrl}/register/${inviteCode}`
  const currentLanguage = languageOptions.some((language) => language.code === i18n.language) ? i18n.language : 'en'

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
    setLocalStorageItem(languageStorageKey, language)
    updateStoredPushTokenLanguage(language).catch((error) => {
      console.warn('Unable to update push notification language:', error)
    })
  }

  return (
    <section className="page-stack mobile-account-wrap">
      <PageHeader title={t('common.profile')} onBack={() => navigate('home')} />
      <Message value={message} />
      <div className="mobile-dark-glass">
        <section className="account-profile-card">
          <div className="account-user-row">
            <img src="/european.ico" alt="" />
            <div>
              <p>
                {t('mobile.profile.hello')}{' '}
                <span>{profile?.username || t('common.account')}</span>
              </p>
              <small>VIP {vip?.viplevel || 1}</small>
            </div>
          </div>
          <div className="account-balance-row">
            <span>
              <small>{t('mobile.profile.currentBalance')}</small>
              <strong>{Number(profile?.balance || 0).toFixed(3)} USDT</strong>
            </span>
            <button className="account-deposit-button" type="button" onClick={() => navigate('deposit')}>
              {t('common.deposit')}
              <ChevronRight size={16} />
            </button>
          </div>
          <AccountDivider />
          <ExternalAccountRow label={t('mobile.profile.telegramChannel')} icon={MessageCircle} href="https://t.me/+e1nirNMro8A4NWVk" />
        </section>

        <AccountPanel title={t('mobile.profile.referralsTitle')}>
          <div className="account-copy-row">
            <span>
              <Link2 size={22} />
              <b>register/{inviteCode}</b>
            </span>
            <button type="button" onClick={() => copyText(inviteLink, t('messages.inviteLinkCopied'), t('messages.unableCopy'))} aria-label={t('common.copy')}>
              <Copy size={22} />
            </button>
          </div>
          <AccountDivider />
          <AccountRow
            label={t('mobile.profile.allReferral')}
            icon={Users}
            onClick={() => navigate('referrals')}
            tone={profile?.firstd ? 'success' : ''}
          />
        </AccountPanel>

        <AccountPanel title={t('common.deposit')}>
          <AccountRow label={t('mobile.profile.fundAccount')} icon={Wallet} onClick={() => navigate('deposit')} />
          <AccountDivider />
          <AccountRow label={t('mobile.profile.vipProgress')} icon={Medal} onClick={() => navigate('vip')} highlight />
        </AccountPanel>

        <AccountPanel title={t('mobile.profile.withdrawalTitle')}>
          <AccountRow label={t('common.withdraw')} icon={WalletCards} onClick={() => navigate('withdraw')} />
          <AccountDivider />
          <AccountRow label={t('mobile.profile.history')} icon={History} onClick={() => navigate('transactions')} />
          <AccountDivider />
          <AccountRow label={t('mobile.profile.codeSetting')} icon={Lock} onClick={() => navigate('pin')} />
          <AccountDivider />
          <AccountRow label={t('mobile.profile.linkWallets')} icon={ShieldCheck} onClick={() => navigate('bind-wallet')} />
        </AccountPanel>

        <AccountPanel title={t('mobile.profile.betsTitle')}>
          <AccountRow label={t('common.myBets')} icon={Ticket} onClick={() => navigate('bets')} />
        </AccountPanel>

        <AccountPanel title={t('mobile.profile.aboutTitle')}>
          <AccountRow label={t('common.faq')} icon={HelpCircle} onClick={() => navigate('faq')} />
          <AccountDivider />
          <LanguageAccountRow label={t('mobile.profile.language')} value={currentLanguage} onChange={changeLanguage} />
          <AccountDivider />
          <ExternalAccountRow label={t('mobile.profile.customerService')} icon={MessageCircle} href="https://t.me/EFC_Support" />
          <AccountDivider />
          <ExternalAccountRow label={t('mobile.profile.telegramGroup')} icon={MessageCircle} href="https://t.me/+e1nirNMro8A4NWVk" />
          <AccountDivider />
          <ExternalAccountRow label={t('mobile.profile.contact')} icon={Mail} href="https://t.me/EFC_Support" />
        </AccountPanel>

        <AccountPanel title={t('mobile.profile.closureTitle')}>
          <AccountRow label={t('common.signOut')} icon={LogOut} onClick={onLogout} danger />
        </AccountPanel>
      </div>
    </section>
  )
}

function LanguageAccountRow({ label, value, onChange }) {
  return (
    <motion.label className="account-row account-language-row" whileTap={{ scale: 0.985 }} transition={pressSpring}>
      <span>
        <Languages size={22} />
        <b>{label}</b>
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </motion.label>
  )
}

function AccountPanel({ title, children }) {
  return (
    <motion.section
      className="account-section"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: motionEase }}
    >
      <h2 className="account-section-title">{title}</h2>
      <div className="account-inner">{children}</div>
    </motion.section>
  )
}

function AccountRow({ label, icon: Icon, onClick, highlight = false, danger = false, tone = '' }) {
  const className = [
    'account-row',
    highlight ? 'highlight' : '',
    danger ? 'danger-row' : '',
    tone ? `tone-${tone}` : '',
  ].filter(Boolean).join(' ')

  return (
    <motion.button className={className} type="button" onClick={onClick} whileTap={{ scale: 0.985 }} transition={pressSpring}>
      <span>
        <Icon size={22} />
        <b>{label}</b>
      </span>
      <ChevronRight size={22} />
    </motion.button>
  )
}

function ExternalAccountRow({ label, icon: Icon, href }) {
  return (
    <motion.a className="account-row" href={href} target="_blank" rel="noreferrer" whileTap={{ scale: 0.985 }} transition={pressSpring}>
      <span>
        <Icon size={22} />
        <b>{label}</b>
      </span>
      <ChevronRight size={22} />
    </motion.a>
  )
}

function AccountDivider() {
  return <div className="account-divider" />
}

function DepositScreen({ navigate, setSuccessAmount }) {
  const { t } = useTranslation('common')
  const fileInputRef = useRef(null)
  const [data, setData] = useState({ methods: [], destinations: [] })
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [transferKey, setTransferKey] = useState('')
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage, t('messages.unableLoadPaymentData'))
  }, [])

  const code = normalizeCode(selectedMethod)
  const selectedMethodIdentity = paymentMethodIdentity(selectedMethod)
  const requiresTransfer = Boolean(transferOptions[code]) && !hasNamedDestination(data.destinations, selectedMethod)
  const rate = getRate(selectedMethod)
  const minimum = selectedMethod ? getMinimum(selectedMethod) : 0
  const numericAmount = Number(amount)
  const amountIsValid = Boolean(selectedMethod && Number.isFinite(numericAmount) && numericAmount >= minimum)
  const activeStep = !selectedMethod ? 0 : !amountIsValid ? 1 : 2
  const steps = [t('mobile.deposit.stepMethod'), t('mobile.deposit.stepAmount'), t('mobile.deposit.stepProof')]
  const destination = useMemo(
    () => findDestination(data.destinations, selectedMethod, transferKey),
    [data.destinations, selectedMethod, transferKey]
  )
  const canSubmit = Boolean(selectedMethod && amountIsValid && destination && file && !submitting)
  const progressValue = amountIsValid ? 100 : Math.min(((numericAmount || 0) / minimum) * 100, 100)

  function copyDepositText(value, label) {
    copyText(value, t('mobile.deposit.copiedLabel', { label }), t('messages.unableCopy'))
  }

  function selectMethod(method) {
    setSelectedMethod(method)
    setTransferKey('')
    setAmount('')
    setFile(null)
    setMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearReceipt() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submitDeposit() {
    if (!selectedMethod) {
      notifyMessage(setMessage, 'error', t('messages.chooseDepositMethod'))
      return
    }
    if (requiresTransfer && !transferKey) {
      notifyMessage(setMessage, 'error', t('mobile.deposit.chooseTransferOption'))
      return
    }
    if (!amountIsValid) {
      notifyMessage(setMessage, 'error', t('messages.minimumDeposit', { amount: formatMoney(minimum), currency: code.toUpperCase() }))
      return
    }
    if (!destination) {
      notifyMessage(setMessage, 'error', t('messages.noPaymentDestination'))
      return
    }
    if (!file) {
      notifyMessage(setMessage, 'error', t('messages.uploadPaymentReceipt'))
      return
    }
    if (!supabase) {
      notifyMessage(setMessage, 'error', t('messages.mobileStorageMissing'))
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
          method: selectedMethod.currency_code || selectedMethod.name,
          methodName: selectedMethod.name,
          address: publicFile?.publicUrl,
          adminaddress: destination.address,
        },
      })

      setSuccessAmount(formatNumber(numericAmount))
      toast.success(t('messages.depositSubmitted'))
      navigate('deposit-success')
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.depositFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack account-linked-page mobile-deposit-page">
      <header className="deposit-web-header">
        <button aria-label={t('common.back')} type="button" onClick={() => navigate('profile')}>
          <ArrowLeft size={22} />
        </button>
        <span>
          <h1>{t('mobile.deposit.title')}</h1>
          <p>{t('mobile.deposit.subtitle')}</p>
        </span>
      </header>

      {loading ? <LoadingState text={t('mobile.deposit.loading')} /> : null}
      <Message value={message} />

      <DepositStepBar activeStep={activeStep} steps={steps} />

      <section className="deposit-web-paper">
        <div className="deposit-web-title-row">
          <span>
            <h2>{t('mobile.deposit.paymentMethod')}</h2>
            <p>{t('mobile.deposit.availableOptions')}</p>
          </span>
          <WalletCards size={23} />
        </div>

        {!loading && data.methods.length === 0 ? (
          <DepositNotice tone="warning">{t('mobile.deposit.noMethods')}</DepositNotice>
        ) : null}

        <div className="deposit-web-method-grid">
          {data.methods.map((method) => {
            const methodCode = normalizeCode(method)
            const methodIdentity = paymentMethodIdentity(method)
            const selected = Boolean(selectedMethodIdentity && methodIdentity === selectedMethodIdentity)
            return (
              <button
                className={`deposit-web-method${selected ? ' active' : ''}`}
                key={methodIdentity}
                type="button"
                onClick={() => selectMethod(method)}
              >
                <span className="deposit-web-method-top">
                  {method.image ? (
                    <img src={method.image} alt={methodLabel(method, t)} />
                  ) : (
                    <i><WalletCards size={23} /></i>
                  )}
                  {selected ? <CheckCircle2 size={20} /> : null}
                </span>
                <span>
                  <b>{methodLabel(method, t)}</b>
                  <small>{t('mobile.deposit.minShort', { amount: formatMoney(getMinimum(method)), currency: methodCode.toUpperCase() })}</small>
                </span>
              </button>
            )
          })}
        </div>

        {requiresTransfer ? (
          <div className="deposit-web-transfer">
            <b>{t('mobile.deposit.transferOption')}</b>
            <span>
              {transferOptions[code].map((option) => (
                <button
                  className={transferKey === option.key ? 'active' : ''}
                  key={option.key}
                  type="button"
                  onClick={() => setTransferKey(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </span>
          </div>
        ) : null}
      </section>

      <section className="deposit-web-paper">
        <h2 className="deposit-web-section-heading">{t('common.amount')}</h2>
        <input
          className={amount && !amountIsValid ? 'deposit-web-amount invalid' : 'deposit-web-amount'}
          inputMode="decimal"
          type="number"
          disabled={!selectedMethod}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={selectedMethod ? t('mobile.deposit.minimumPlaceholder', { amount: formatMoney(minimum), currency: code.toUpperCase() }) : t('mobile.deposit.chooseMethodFirst')}
        />
        {selectedMethod ? (
          <div className="deposit-web-progress">
            <span>
              <small>{t('mobile.deposit.usdtEquivalent')}</small>
              <b>{formatMoney(numericAmount / rate)} USDT</b>
            </span>
            <i><em className={amountIsValid ? 'valid' : ''} style={{ width: `${progressValue}%` }} /></i>
          </div>
        ) : null}
      </section>

      <section className="deposit-web-paper">
        <div className="deposit-web-instruction">
          <i>!</i>
          <span>
            {amountIsValid
              ? t('mobile.deposit.sendExactly', { amount: `${formatMoney(numericAmount)} ${code.toUpperCase()}` })
              : t('mobile.deposit.sendEnteredAmount')}
          </span>
        </div>

        {!selectedMethod ? (
          <DepositNotice>{t('mobile.deposit.chooseMethodDetails')}</DepositNotice>
        ) : null}

        {selectedMethod && (!amountIsValid || (requiresTransfer && !transferKey)) ? (
          <DepositNotice tone="warning">
            {requiresTransfer ? t('mobile.deposit.enterValidAmountAndTransfer') : t('mobile.deposit.enterValidAmount')}
          </DepositNotice>
        ) : null}

        {selectedMethod && amountIsValid && !destination ? (
          <DepositNotice tone="error">{t('mobile.deposit.noPaymentAddress')}</DepositNotice>
        ) : null}

        {destination && amountIsValid ? (
          <div className="deposit-web-details">
            <DepositPaymentRow label={isLocalDestination(destination) ? t('forms.accountNumber') : t('forms.walletAddress')} copyLabel={t('common.copy')} value={destination.address} onCopy={copyDepositText} />
            {isLocalDestination(destination) ? (
              <>
                <DepositPaymentRow label={t('forms.accountName')} copyLabel={t('common.copy')} value={destination.accountname} onCopy={copyDepositText} />
                <DepositPaymentRow label={t('forms.bank')} copyLabel={t('common.copy')} value={destination.bank} onCopy={copyDepositText} />
              </>
            ) : null}
            {destination.image ? (
              <img className="deposit-web-details-image" src={destination.image} alt={t('mobile.deposit.paymentDetailsAlt')} />
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="deposit-web-paper">
        <h2 className="deposit-web-section-heading">{t('mobile.deposit.receiptUpload')}</h2>
        <button className="deposit-web-upload" type="button" onClick={() => fileInputRef.current?.click()}>
          <Upload size={23} />
          <b>{t('mobile.deposit.browseReceiptImage')}</b>
          <small>{t('mobile.deposit.receiptHint')}</small>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <div className="deposit-web-file">
          <FileText size={23} />
          <span>
            <b>{file?.name || t('mobile.deposit.noFileSelected')}</b>
            <small>{file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : t('mobile.deposit.uploadRequired')}</small>
          </span>
          {file ? (
            <button type="button" aria-label={t('mobile.deposit.removeReceipt')} onClick={clearReceipt}>
              <Trash2 size={19} />
            </button>
          ) : null}
        </div>
      </section>

      <div className="deposit-web-divider" />

      <button className="deposit-web-submit" type="button" disabled={!canSubmit} onClick={submitDeposit}>
        {submitting ? t('mobile.deposit.submitting') : t('mobile.deposit.submit')}
      </button>
    </section>
  )
}

function DepositStepBar({ activeStep, steps }) {
  return (
    <section className="deposit-web-stepper">
      {steps.map((step, index) => {
        const state = index < activeStep ? 'complete' : index === activeStep ? 'active' : ''
        return (
          <span className={state} key={step}>
            <i>{index + 1}</i>
            <b>{step}</b>
          </span>
        )
      })}
    </section>
  )
}

function DepositNotice({ children, tone = 'info' }) {
  return <div className={`deposit-web-notice ${tone}`}>{children}</div>
}

function DepositPaymentRow({ label, copyLabel, value, onCopy }) {
  if (!value) return null

  return (
    <div className="deposit-web-payment-row">
      <span>
        <small>{label}</small>
        <b>{value}</b>
      </span>
      <button type="button" aria-label={`${copyLabel} ${label}`} onClick={() => onCopy(value, label)}>
        <Copy size={17} />
      </button>
    </div>
  )
}

function WithdrawScreen({ navigate }) {
  const { t } = useTranslation('common')
  const [data, setData] = useState({ wallets: [], settings: {} })
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [withdrawalDisabledDialogOpen, setWithdrawalDisabledDialogOpen] = useState(false)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage, t('messages.unableLoadPaymentData'))
  }, [])

  const wallet = data.wallets.find((item) => String(item.id ?? item.wallid) === String(walletId))
  const settings = data.settings || {}
  const withdrawalsEnabled = settings.withdrawalsEnabled ?? true
  const withdrawalDisabledMessage = settings.withdrawalDisabledMessage || 'Withdrawals are temporarily unavailable. Please try again later.'
  const feePercent = Number(settings.withdrawalFeePercent ?? 7)
  const requested = Number(amount) || 0
  const total = requested + (requested * feePercent / 100)

  useEffect(() => {
    if (!loading && !withdrawalsEnabled) setWithdrawalDisabledDialogOpen(true)
  }, [loading, withdrawalsEnabled])

  async function submitWithdraw() {
    if (!withdrawalsEnabled) {
      setWithdrawalDisabledDialogOpen(true)
      return
    }
    if (!wallet) {
      notifyMessage(setMessage, 'error', t('messages.chooseWalletFirst'))
      return
    }
    if (!pin) {
      notifyMessage(setMessage, 'error', t('messages.enterTransactionPin'))
      return
    }
    if (requested < Number(settings.minWithdrawalAmount || 10)) {
      notifyMessage(setMessage, 'error', t('messages.minimumWithdrawal', { amount: settings.minWithdrawalAmount || 10 }))
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
      toast.success(t('messages.withdrawalSent'))
      navigate('withdraw-success')
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableSubmitWithdrawal'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.withdraw.title')} onBack={() => navigate('profile')} />
      {withdrawalDisabledDialogOpen ? (
        <div className="language-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="withdrawals-disabled-title">
          <div className="language-dialog-card">
            <p className="eyebrow">{t('mobile.withdraw.title')}</p>
            <h2 id="withdrawals-disabled-title">Withdrawals unavailable</h2>
            <p>{withdrawalDisabledMessage}</p>
            <button className="primary-button full" type="button" onClick={() => setWithdrawalDisabledDialogOpen(false)}>OK</button>
          </div>
        </div>
      ) : null}
      {loading ? <LoadingState text={t('mobile.withdraw.loading')} /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <SelectField label={t('common.wallet')} value={walletId} onChange={setWalletId} disabled={!withdrawalsEnabled}>
          <option value="">{t('forms.chooseWallet')}</option>
          {data.wallets.map((item) => (
            <option key={item.id ?? item.wallid ?? item.wallet} value={item.id ?? item.wallid}>
              {item.walletnames || item.bank || item.method} · {item.wallet}
            </option>
          ))}
        </SelectField>
        {!data.wallets.length && !loading ? (
          <button className="secondary-button full" type="button" onClick={() => navigate('bind-wallet')}>
            {t('mobile.withdraw.bindFirst')}
          </button>
        ) : null}
        <InputShell icon={<Wallet size={18} />} label={t('common.amount')}>
          <input disabled={!withdrawalsEnabled} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder={t('common.amount')} />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label={t('forms.transactionPin')}>
          <input disabled={!withdrawalsEnabled} inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} placeholder={t('forms.pinPlaceholder')} />
        </InputShell>
        <div className="fee-note">
          <span>{t('mobile.withdraw.fee', { percent: feePercent })}</span>
          <b>{t('mobile.withdraw.totalDebit', { amount: formatNumber(total) })}</b>
        </div>
        <button className="primary-button full" type="button" onClick={submitWithdraw} disabled={submitting || !withdrawalsEnabled}>
          {submitting ? t('mobile.deposit.submitting') : t('mobile.withdraw.submit')}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function BindWalletScreen({ navigate }) {
  const { t } = useTranslation('common')
  const [data, setData] = useState({ methods: [] })
  const [methodId, setMethodId] = useState('')
  const [wallet, setWallet] = useState('')
  const [bank, setBank] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadPaymentData(setData, setLoading, setMessage, t('messages.unableLoadPaymentData'))
  }, [])

  const method = data.methods.find((item) => String(item.id ?? item.name) === String(methodId))
  const isLocal = ['local', 'local-transfer', 'bank', 'mobile-money'].includes(String(method?.type || '').toLowerCase())

  async function submitWallet() {
    if (!method || wallet.trim().length < 3 || (isLocal && (bank.trim().length < 2 || name.trim().length < 3))) {
      notifyMessage(setMessage, 'error', t('messages.walletDetailsInvalid'))
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
      if (payload.status !== 'success') throw new Error(payload.message || t('messages.unableBindWallet'))
      notifyMessage(setMessage, 'success', t('messages.walletBindSuccess'))
      setTimeout(() => navigate('profile'), 500)
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableBindWallet'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.wallet.bind')} onBack={() => navigate('profile')} />
      {loading ? <LoadingState text={t('mobile.wallet.loading')} /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <SelectField label={t('common.method')} value={methodId} onChange={setMethodId}>
          <option value="">{t('forms.chooseMethod')}</option>
          {data.methods.map((item) => (
            <option key={item.id || item.name} value={item.id ?? item.name}>
              {item.name}
            </option>
          ))}
        </SelectField>
        {isLocal ? (
          <>
            <InputShell icon={<Wallet size={18} />} label={t('forms.bank')}>
              <input value={bank} onChange={(event) => setBank(event.target.value)} placeholder={t('forms.bankName')} />
            </InputShell>
            <InputShell icon={<User size={18} />} label={t('forms.accountName')}>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('forms.accountHolder')} />
            </InputShell>
          </>
        ) : null}
        <InputShell icon={<WalletCards size={18} />} label={isLocal ? t('forms.accountNumber') : t('forms.walletAddress')}>
          <input value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder={isLocal ? t('forms.accountNumber') : t('forms.walletAddress')} />
        </InputShell>
        <button className="primary-button full" type="button" onClick={submitWallet} disabled={submitting}>
          {submitting ? t('mobile.wallet.saving') : t('mobile.wallet.submit')}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function TransactionsScreen({ navigate }) {
  const { t } = useTranslation('common')
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
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadTransactions') })
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
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.transactions.title')} onBack={() => navigate('profile')} />
      <Segmented
        options={[
          { key: 'all', label: t('common.all') },
          { key: 'deposit', label: t('mobile.transactions.deposits') },
          { key: 'withdraw', label: t('mobile.transactions.withdrawals') },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Message value={message} />
      {loading ? <LoadingState text={t('mobile.transactions.loading')} /> : null}
      <section className="card-list">
        {transactions.map((item) => (
          <article key={item.id} className="list-card static">
            <span>
              <b>{item.title || item.type}</b>
              <small>{item.detail || item.methodLabel || t('common.transaction')} · {formatDate(item.timestamp, t)}</small>
            </span>
            <StatusPill status={{ label: item.statusLabel || item.status, tone: item.status }} />
          </article>
        ))}
        {!loading && !transactions.length ? <EmptyState title={t('emptyStates.noTransactions')} text={t('emptyStates.transactionsComing')} /> : null}
      </section>
    </section>
  )
}

function ReferralsScreen({ navigate }) {
  const { t } = useTranslation('common')
  const [payload, setPayload] = useState({ refer: '', referrals: [] })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadReferrals = useCallback(async (isActive = () => true) => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await apiFetch('/api/my-referrals', { auth: true })
      if (isActive()) setPayload(result)
    } catch (error) {
      if (isActive()) {
        setPayload({ refer: '', referrals: [] })
        setMessage({ type: 'error', text: error?.message || t('messages.unableLoadReferrals') })
      }
    } finally {
      if (isActive()) setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let active = true
    loadReferrals(() => active)
    return () => {
      active = false
    }
  }, [loadReferrals])

  const referrals = useMemo(
    () => (Array.isArray(payload.referrals) ? payload.referrals : []),
    [payload.referrals]
  )
  const visibleReferrals = useMemo(
    () => referrals.filter((item) => filter === 'all' || Number(item.level || 1) === filter),
    [filter, referrals]
  )
  const totalDeposit = useMemo(
    () => referrals.reduce((sum, item) => sum + Number(item.totald || 0), 0),
    [referrals]
  )
  const filteredDeposit = useMemo(
    () => visibleReferrals.reduce((sum, item) => sum + Number(item.totald || 0), 0),
    [visibleReferrals]
  )
  const activeCount = useMemo(
    () => referrals.filter((item) => Boolean(item.firstd)).length,
    [referrals]
  )

  const inviteLink = `${mobileConfig.apiBaseUrl}/register/${payload.refer || referralCode}`
  const hasError = message?.type === 'error'

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.referrals.title')} onBack={() => navigate('profile')} />
      <Message value={message} />
      <section className="detail-card">
        <InfoRow label={t('mobile.referrals.inviteCode')} value={payload.refer || referralCode} />
        <button className="secondary-button full" type="button" onClick={() => copyText(inviteLink, t('messages.inviteLinkCopied'), t('messages.unableCopy'))}>
          {t('mobile.referrals.copyInvite')}
          <Copy size={17} />
        </button>
      </section>

      <section className="referral-summary-grid">
        <ReferralStat label={t('mobile.vip.total')} value={referrals.length} />
        <ReferralStat label={t('mobile.referrals.activeReferrals')} value={activeCount} />
        <ReferralStat label={t('mobile.vip.totalDeposit')} value={formatUsdt(totalDeposit)} />
      </section>

      <section className="referral-filter-bar" aria-label={t('mobile.referrals.title')}>
        {referralFilters.map((item) => {
          const selected = filter === item
          const count = item === 'all'
            ? referrals.length
            : referrals.filter((referral) => Number(referral.level || 1) === item).length

          return (
            <button
              key={item}
              className={selected ? 'active' : ''}
              type="button"
              onClick={() => setFilter(item)}
            >
              <span>{item === 'all' ? t('common.all') : t('mobile.referrals.level', { level: item })}</span>
              <b>{count}</b>
            </button>
          )
        })}
      </section>

      <section className="referral-filter-total">
        <span>{t('mobile.referrals.filteredReferrals', { count: visibleReferrals.length })}</span>
        <b>{formatUsdt(filteredDeposit)}</b>
      </section>

      {loading ? <LoadingState text={t('mobile.referrals.loading')} /> : null}
      {!loading && hasError ? (
        <section className="referral-state-card">
          <HelpCircle size={24} />
          <p>{t('messages.unableLoadReferrals')}</p>
          <span>{message.text}</span>
          <button className="secondary-button" type="button" onClick={() => loadReferrals()}>
            {t('common.refresh')}
            <RefreshCw size={17} />
          </button>
        </section>
      ) : null}
      <section className="card-list">
        {!loading && !hasError && visibleReferrals.map((item) => (
          <article key={`${item.level || 1}-${item.key || item.id || item.username}`} className="referral-row list-card static">
            <span className="referral-avatar">
              <Users size={18} />
            </span>
            <span className="referral-row-main">
              <b>{item.username || 'Unknown user'}</b>
              <small>{t('mobile.referrals.joined', { date: formatDate(item.joinedAt || item.created_at || item.crdate, t) })}</small>
              <small className={item.firstd ? 'referral-active' : ''}>{item.firstd ? t('status.active') : t('status.pending')}</small>
            </span>
            <span className="referral-row-side">
              <em className={`referral-level level-${item.level || 1}`}>
                {item.levelLabel || t('mobile.referrals.level', { level: item.level || 1 })}
              </em>
              <b>{formatUsdt(item.totald)}</b>
            </span>
          </article>
        ))}
        {!loading && !hasError && !referrals.length ? <EmptyState title={t('emptyStates.noReferrals')} text={t('emptyStates.referralsComing')} /> : null}
        {!loading && !hasError && referrals.length > 0 && !visibleReferrals.length ? <EmptyState title={t('emptyStates.noReferrals')} text={t('emptyStates.referralsComing')} /> : null}
      </section>
    </section>
  )
}

function ReferralStat({ label, value }) {
  return (
    <article className="referral-stat">
      <span>{label}</span>
      <b>{value}</b>
    </article>
  )
}

function VipScreen({ navigate }) {
  const { t } = useTranslation('common')
  const [vip, setVip] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/me', { auth: true })
      .then((payload) => {
        if (active) setVip(payload.vip)
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadVip') })
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('common.vip')} onBack={() => navigate('profile')} />
      <Message value={message} />
      <section className="vip-card">
        <Medal size={72} />
        <h2>VIP {vip?.viplevel || 1}</h2>
        <ProgressBar label={t('mobile.vip.totalDeposit')} value={vip?.depositProgress || 0} />
        <ProgressBar label={t('mobile.vip.referrals')} value={vip?.referralProgress || 0} />
        <ProgressBar label={t('mobile.vip.total')} value={((vip?.depositProgress || 0) + (vip?.referralProgress || 0)) / 2} />
      </section>
    </section>
  )
}

function PinScreen({ navigate }) {
  const { t } = useTranslation('common')
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
        if (hasPin) notifyMessage(setMessage, 'info', t('messages.pinAlreadySet'))
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadPin') })
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
      notifyMessage(setMessage, 'error', t('messages.pinFourDigits'))
      return
    }
    if (pin !== confirm) {
      notifyMessage(setMessage, 'error', t('messages.pinEntriesMustMatch'))
      return
    }
    try {
      const payload = await apiFetch('/api/set-pin', { auth: true, method: 'POST', body: { pin } })
      setLocked(true)
      notifyMessage(setMessage, 'success', payload.message || t('messages.pinSet'))
    } catch (error) {
      notifyMessage(setMessage, 'error', error?.message || t('messages.unableSetPin'))
    }
  }

  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('mobile.profile.transactionPin')} onBack={() => navigate('profile')} />
      {loading ? <LoadingState text={t('mobile.pin.checking')} /> : null}
      <Message value={message} />
      <section className="detail-card form-stack">
        <p className="warning-copy">{t('mobile.pin.warning')}</p>
        <InputShell icon={<Lock size={18} />} label={t('forms.enterPin')}>
          <input disabled={locked} inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
        </InputShell>
        <InputShell icon={<Lock size={18} />} label={t('forms.confirmPin')}>
          <input disabled={locked} inputMode="numeric" value={confirm} onChange={(event) => setConfirm(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
        </InputShell>
        <button className="primary-button full" type="button" onClick={submitPin} disabled={locked || loading}>
          {t('mobile.pin.set')}
          <ArrowRight size={18} />
        </button>
      </section>
    </section>
  )
}

function formatNotificationValue(key, value) {
  if (['amount', 'payout', 'stake'].includes(key) && value !== '' && value !== null && value !== undefined) {
    const number = Number(value)
    if (Number.isFinite(number)) return number.toFixed(2)
  }
  return value
}

function resolveNotificationValues(values = {}, t) {
  return Object.entries(values || {}).reduce((acc, [key, value]) => {
    if (key === 'typeKey' && typeof value === 'string') {
      acc.typeLabel = t(value).toLowerCase()
      return acc
    }

    if (key === 'statusKey' && typeof value === 'string') {
      acc.status = t(value).toLowerCase()
      return acc
    }

    if (key === 'outcomeKey' && typeof value === 'string') {
      acc.outcome = t(value).toLowerCase()
      return acc
    }

    if (key.endsWith('Key') && typeof value === 'string') {
      acc[key.slice(0, -3)] = t(value)
      return acc
    }

    acc[key] = formatNotificationValue(key, value)
    return acc
  }, {})
}

function notificationTitle(item, t) {
  if (item.titleKey) {
    return t(item.titleKey, {
      defaultValue: item.title || t('mobile.notifications.fallbackTitle'),
      ...resolveNotificationValues(item.messageValues, t),
    })
  }
  return item.title || t('mobile.notifications.fallbackTitle')
}

function notificationBody(item, t) {
  if (item.messageKey) {
    return t(item.messageKey, {
      defaultValue: item.message || '',
      ...resolveNotificationValues(item.messageValues, t),
    })
  }
  return item.message || ''
}

function NotificationsScreen({ navigate, onRead }) {
  const { t } = useTranslation('common')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    apiFetch('/api/notify?summary=1', { auth: true })
      .then((payload) => {
        const nextItems = Array.isArray(payload) ? payload : payload?.notifications || []
        if (!active) return
        setItems(nextItems)

        const unreadIds = nextItems
          .filter((item) => item.appNotificationId && !item.readAt)
          .map((item) => item.appNotificationId)

        if (unreadIds.length) {
          apiFetch('/api/notify', {
            auth: true,
            method: 'POST',
            body: { action: 'mark-read', ids: unreadIds },
          }).then(() => onRead?.()).catch(() => null)
        } else {
          onRead?.()
        }
      })
      .catch((error) => {
        if (active) setMessage({ type: 'error', text: error?.message || t('messages.unableLoadNotifications') })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [onRead, t])

  return (
    <section className="page-stack">
      <PageHeader title={t('mobile.notifications.title')} onBack={() => navigate('home')} />
      <Message value={message} />
      {loading ? <LoadingState text={t('mobile.notifications.loading')} /> : null}
      <section className="card-list">
        {items.map((item) => (
          <article key={item.id} className="list-card static notification-card">
            <Bell size={19} />
            <span>
              <b>{notificationTitle(item, t)}</b>
              <small>{notificationBody(item, t)}</small>
            </span>
          </article>
        ))}
        {!loading && !items.length ? <EmptyState title={t('emptyStates.noNotifications')} text={t('emptyStates.notificationsComing')} /> : null}
      </section>
    </section>
  )
}

function FaqScreen({ navigate }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState('0')
  const faqItems = t('mobile.faq.items', { returnObjects: true })
  return (
    <section className="page-stack account-linked-page">
      <PageHeader title={t('common.faq')} onBack={() => navigate('profile')} />
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
  const { t } = useTranslation('common')
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="success-screen-view">
      <motion.div
        className="success-icon"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.78, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      >
        <CheckCircle2 size={84} />
      </motion.div>
      <h1>{title}</h1>
      <p>{text}</p>
      <motion.button className="primary-button full" type="button" onClick={() => navigate('home')} whileTap={{ scale: 0.98 }} transition={pressSpring}>
        {t('common.continue')}
        <ArrowRight size={18} />
      </motion.button>
    </section>
  )
}

function ImageCarousel({ images }) {
  const { t } = useTranslation('common')
  const shouldReduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const imageVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, scale: 1.025 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.985 },
      }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [images.length])

  return (
    <div className="promo-frame">
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt=""
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.32, ease: motionEase }}
        />
      </AnimatePresence>
      <Dots className="compact" length={images.length} index={index} onChange={setIndex} label={t('mobile.onboarding.promoLabel')} />
    </div>
  )
}

function Dots({ length, index, onChange, label, className = '' }) {
  const { t } = useTranslation('common')

  return (
    <div className={`slide-dots ${className}`} aria-label={label}>
      {Array.from({ length }).map((_, dotIndex) => (
        <motion.button
          key={dotIndex}
          className={dotIndex === index ? 'active' : ''}
          type="button"
          aria-label={t('mobile.onboarding.openSlide', { number: dotIndex + 1 })}
          onClick={() => onChange(dotIndex)}
          whileTap={{ scale: 0.82 }}
          transition={pressSpring}
        />
      ))}
    </div>
  )
}

function MatchCard({ match, onClick }) {
  const { t } = useTranslation('common')
  const start = formatMatchStart(match, t)
  const isCompanyMatch = Boolean(match.company)

  return (
    <motion.button className={isCompanyMatch ? 'match-card company-match-card' : 'match-card'} type="button" onClick={onClick} whileTap={{ scale: 0.985 }} transition={pressSpring}>
      {isCompanyMatch ? (
        <span className="company-match-sticker">
          <ShieldCheck size={12} />
          {t('mobile.match.companyGame')}
        </span>
      ) : null}
      <div className="match-league">
        <span>{leagueName(match, t)}</span>
        {match.company ? <b>{t('common.verified')}</b> : null}
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
        <Odd label="1-0" value={match.onenil} verified={isProtectedMarket(match, 'onenil')} />
        <Odd label="1-1" value={match.oneone} verified={isProtectedMarket(match, 'oneone')} />
        <Odd label="1-2" value={match.onetwo} verified={isProtectedMarket(match, 'onetwo')} />
      </div>
    </motion.button>
  )
}

function Team({ name, image }) {
  const { t } = useTranslation('common')

  return (
    <div className="team-block">
      <img src={image || ballImage} alt="" />
      <span>{name || t('common.team')}</span>
    </div>
  )
}

function Odd({ label, value, verified = false }) {
  const { t } = useTranslation('common')

  return (
    <span className={verified ? 'odd-pill verified' : 'odd-pill'}>
      <b>{label}</b>
      <strong>{value || t('common.placeholderDash')}</strong>
      {verified ? (
        <em className="odd-company-badge">
          <ShieldCheck size={10} />
          {t('mobile.match.companyGame')}
        </em>
      ) : null}
    </span>
  )
}

function PageHeader({ title, onBack }) {
  return (
    <header className="page-header">
      <motion.button className="back-button compact-back" type="button" onClick={onBack} whileTap={{ scale: 0.94 }} transition={pressSpring}>
        <ArrowLeft size={18} />
      </motion.button>
      <h1>{title}</h1>
    </header>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <motion.button
          key={option.key}
          className={value === option.key ? 'active' : ''}
          type="button"
          onClick={() => onChange(option.key)}
          whileTap={{ scale: 0.96 }}
          transition={pressSpring}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  )
}

function SelectField({ label, value, onChange, disabled = false, children }) {
  return (
    <label className="mini-field full-field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

function InfoRow({ label, value }) {
  const { t } = useTranslation('common')

  return (
    <div className="info-row">
      <span>{label}</span>
      <b>{value ?? t('common.placeholderDash')}</b>
    </div>
  )
}

function StatusPill({ status }) {
  return <em className={`status-pill tone-${status.tone || 'pending'}`}>{status.label}</em>
}

function ProgressBar({ label, value }) {
  const nextValue = Math.max(0, Math.min(Number(value) || 0, 100))
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="progress-row">
      <span>{label}</span>
      <div>
        <motion.i
          initial={false}
          animate={{ width: `${nextValue}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: motionEase }}
        />
      </div>
      <b>{nextValue.toFixed(1)}%</b>
    </div>
  )
}

function LoadingState({ text }) {
  return (
    <motion.div className="loading-state" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: motionEase }}>
      <RefreshCw size={18} className="spin" />
      {text}
    </motion.div>
  )
}

function EmptyState({ icon, title, text }) {
  return (
    <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: motionEase }}>
      {icon || <CheckCircle2 size={24} />}
      <p>{title}</p>
      <span>{text}</span>
    </motion.div>
  )
}

async function loadPaymentData(setData, setLoading, setMessage, fallbackMessage) {
  setLoading(true)
  setMessage(null)
  try {
    const payload = await apiFetch('/api/mobile/payment-data', { auth: true })
    setData(payload)
  } catch (error) {
    setMessage({ type: 'error', text: error?.message || fallbackMessage })
  } finally {
    setLoading(false)
  }
}

async function copyText(value, successMessage, errorMessage) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success(successMessage)
  } catch (error) {
    toast.error(errorMessage)
  }
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
      if (activeFilter === 'next24h') return startMs <= nowMs + (24 * hourMs)
      if (activeFilter === 'tomorrow') return localDateKey(new Date(startMs)) === tomorrowKey
      return localDateKey(new Date(startMs)) === todayKey
    })
    .map(({ match }) => match)
}

function getMatchStartMs(match) {
  const timestamp = Number(match?.tsgmt)
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return timestamp < 1000000000000 ? timestamp * 1000 : timestamp
  }
  const fallback = new Date(`${match?.date || ''} ${match?.time || ''}`).getTime()
  return Number.isFinite(fallback) ? fallback : 0
}

function formatMatchStart(match, t) {
  const startMs = getMatchStartMs(match)
  if (startMs) {
    const date = new Date(startMs)
    return {
      time: new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    }
  }

  return {
    time: match?.time || '--:--',
    date: match?.date || t('common.upcoming'),
  }
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function leagueName(match, t) {
  return (match?.league === 'others' ? match?.otherl : match?.league) || t('common.league')
}

async function hydrateCompanyMarket(match) {
  if (!match?.match_id || getCompanyMarketKey(match) || !hasSupabaseConfig() || !supabase) {
    return match
  }

  try {
    const { data, error } = await supabase
      .from('bets')
      .select('company, comarket')
      .eq('match_id', match.match_id)
      .maybeSingle()

    if (error || !data?.comarket) return match

    return {
      ...match,
      company: typeof match.company === 'undefined' || match.company === null ? data.company : match.company,
      comarket: match.comarket || data.comarket,
      protectedMarket: match.protectedMarket || data.comarket,
    }
  } catch (error) {
    return match
  }
}

function isCompanyGame(match) {
  const value = match?.company
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  const normalized = String(value || '').trim().toLowerCase()
  return ['1', 'true', 't', 'yes', 'y', 'company', 'verified'].includes(normalized)
}

function getCompanyMarketKey(match) {
  if (!isCompanyGame(match)) return ''
  return getMarketKey(match?.comarket || match?.protectedMarket || match?.protected_market)
}

function isProtectedMarket(match, marketKey) {
  return getCompanyMarketKey(match) === marketKey
}

function getMarketKey(value) {
  const marketKey = String(value || '').trim()
  if (!marketKey) return ''

  const normalized = marketKey.toLowerCase()
  const compact = normalizeMarketToken(normalized)
  const market = markets.find(([key, label]) => (
    key.toLowerCase() === normalized
    || normalizeMarketToken(key) === compact
    || String(label).toLowerCase() === normalized
    || normalizeMarketToken(label) === compact
  ))

  if (market) return market[0]
  if (normalized === 'other' || compact === 'otherscore' || compact === 'otherscores') return 'otherscores'
  return ''
}

function normalizeMarketToken(value) {
  return String(value || '').toLowerCase().replace(/:/g, '-').replace(/\s+/g, '')
}

function formatMarketName(value, t) {
  const marketKey = getMarketKey(value)
  const market = markets.find(([key]) => key === marketKey)
  if (!market) return String(value || '').trim()

  const label = market[1]
  return label.includes('.') ? t(label) : label
}

function betStatus(bet, t) {
  const startMs = getMatchStartMs(bet)
  if (startMs && startMs > Date.now()) return { label: t('status.notStarted'), tone: 'pending' }
  if (bet?.won === 'true') return { label: t('status.won'), tone: 'success' }
  if (bet?.won === 'false') return { label: t('status.lost'), tone: 'failed' }
  return { label: t('status.ongoing'), tone: 'processing' }
}

function normalizeCode(method) {
  return String(method?.currency_code || method?.name || '').toLowerCase()
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function paymentMethodIdentity(method) {
  if (!method) return ''

  const id = String(method.id ?? '').trim()
  if (id) return `id:${id}`

  const name = normalizeName(method.name)
  if (name) return `name:${name}`

  const code = normalizeCode(method)
  return code ? `code:${code}` : ''
}

function isLocalDestination(destination) {
  const type = normalizeName(destination?.type)
  return type === 'local'
    || type === 'local-transfer'
    || type === 'bank'
    || type === 'mobile-money'
}

function getRate(method) {
  const rate = Number(method?.rates)
  return Number.isFinite(rate) && rate > 0 ? rate : 1
}

function getMinimum(method) {
  return getRate(method) * 5
}

function methodLabel(method, t) {
  return method?.name || method?.currency_code?.toUpperCase() || t('mobile.deposit.methodFallback')
}

function formatMoney(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return number.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function findDestination(destinations, method, transferKey) {
  const code = normalizeCode(method)
  if (!code) return null

  const selectedName = normalizeName(method?.name)
  const exactMethodDestination = destinations.find((destination) => (
    selectedName && normalizeName(destination?.name) === selectedName
  ))

  if (exactMethodDestination) return exactMethodDestination

  const matches = destinations.filter((destination) => (
    String(destination?.currency_code || '').toLowerCase() === code
  ))

  if (transferOptions[code]) {
    const option = transferOptions[code].find((item) => item.key === transferKey)
    if (!option) return null
    return matches.find((destination) => (
      String(destination?.bank || '').toLowerCase() === option.bank.toLowerCase()
    )) || null
  }

  if (!matches.length) return null
  return matches[Math.floor(Math.random() * matches.length)]
}

function hasNamedDestination(destinations, method) {
  const selectedName = normalizeName(method?.name)
  if (!selectedName) return false

  return destinations.some((destination) => (
    normalizeName(destination?.name) === selectedName
  ))
}

function formatUsdt(value) {
  return `${formatNumber(value)} USDT`
}

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(3) : '0.000'
}

function formatDate(value, t) {
  if (!value) return t('common.justNow')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('common.justNow')
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
