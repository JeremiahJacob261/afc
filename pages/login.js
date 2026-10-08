import { translateApiMessage } from '@/lib/translateApiMessage'
import { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { useRouter } from 'next/router'
import { supabase } from '@/pages/api/supabase'
import { clearLegacyAuthStorage } from '@/lib/clientAuth'
import AppLoadingOverlay from '@/components/AppLoadingOverlay'
import FeedbackDialog from '@/components/FeedbackDialog'
import { waitForPaint } from '@/lib/uiFeedback'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'next-i18next'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import LandingImage from '@/components/ucl/LandingImage'
import landing from '@/styles/LandingSystem.module.css'
import styles from '@/styles/Auth.module.css'

const facts = [
  ['marketsLabel', 'marketsValue'],
  ['safetyLabel', 'safetyValue'],
  ['focusLabel', 'focusValue'],
]

export default function Login() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [email, setEmail] = useState('')

  const [values, setValues] = useState({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  })

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value.replace(/\s/g, '') })
  }

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const login = async () => {
    if (loading) return

    setLoading(true)
    let navigating = false
    await waitForPaint()
    clearLegacyAuthStorage()

    try {
      let loginEmail = email.trim()

      if (!loginEmail.includes("@")) {
        const response = await fetch('/api/login-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginEmail })
        })
        const result = await response.json().catch(() => ({}))

        if (result?.message === 'TypeError: fetch failed') {
          setFeedback({
            type: 'error',
            title: t('messages.networkError'),
            message: t('messages.checkConnectionTryAgain'),
          })
          return
        } else if (result?.message === 'Invalid login credentials') {
          setFeedback({
            type: 'error',
            title: t('messages.incorrectDetails'),
            message: t('messages.loginDetailsIncorrect'),
          })
          return
        } else {
          if (!response.ok || result.status !== 'success') {
            setFeedback({
              type: 'error',
              title: t('messages.unableSignIn'),
              message: t('messages.anErrorOccurred'),
            })
            return
          }
        }
        loginEmail = result.email
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: values.password,
      })

      if (error) {
        console.error(error)
        setFeedback({
          type: 'error',
          title: t('messages.unableSignIn'),
          message: translateApiMessage(error, t, 'messages.unableSignIn'),
        })
        return
      }

      clearLegacyAuthStorage()
      navigating = true
      router.push('/user')
    } catch (error) {
      console.error(error)
      setFeedback({
        type: 'error',
        title: t('messages.connectionProblem'),
        message: t('messages.checkConnectionTryAgain'),
      })
    } finally {
      if (!navigating) setLoading(false)
    }
  }

  return (
    <div className={`${landing.page} ${styles.auth}`}>
      <Head>
        <title>{t('common.login')}</title>
        <meta name="description" content={t('auth.login.subtitle')} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLoadingOverlay open={loading} title={t('messages.signingInTitle')} message={t('messages.signingInMessage')} />
      <FeedbackDialog
        open={Boolean(feedback)}
        type={feedback?.type}
        title={feedback?.title}
        message={feedback?.message}
        onClose={() => setFeedback(null)}
      />
      <Toaster position="bottom-center" reverseOrder={false} />

      <section className={`${styles.dark} ${styles.band}`} aria-labelledby="login-heading">
        <div className={styles.artwork} aria-hidden="true">
          <LandingImage name="hero" eager sizes="100vw" />
        </div>
        <div className={`${styles.container} ${styles.bandInner} ${styles.darkInner}`}>
          <div className={styles.brandRow}>
            <Link href="/" className={styles.brand} aria-label={t('website.uclHome')}>UCL</Link>
            <Link href="/register/000208" className={styles.pill}>{t('common.joinNow')}</Link>
          </div>
          <div className={styles.bandCopy}>
            <h1 id="login-heading">{t('auth.login.title')}</h1>
            <p className={styles.lede}>{t('auth.login.subtitle')}</p>
          </div>

          <div className={styles.facts}>
            {facts.map(([label, value]) => (
              <div className={styles.fact} key={label}>
                <p className={styles.factLabel}>{t(`landing.hero.stats.${label}`)}</p>
                <p className={styles.factValue}>{t(`landing.hero.stats.${value}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={`${styles.container} ${styles.lower}`}>
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); login() }}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-identity">{t('auth.login.identityLabel')}</label>
              <input
                id="login-identity"
                type="text"
                placeholder={t('auth.login.identityPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value.replace(/\s/g, ''))}
                autoComplete="username"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">{t('auth.login.passwordLabel')}</label>
                <Link href="/passwordreset" className={styles.link}>{t('auth.login.forgotPassword')}</Link>
              </div>
              <div className={styles.control}>
                <input
                  id="login-password"
                  type={values.showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                  className={`${styles.input} ${styles.withReveal}`}
                  required
                />
                <button
                  type="button"
                  className={styles.reveal}
                  onClick={handleClickShowPassword}
                  aria-label={t('auth.login.passwordLabel')}
                >
                  {values.showPassword ? <EyeOff size={20} strokeWidth={2} aria-hidden="true" /> : <Eye size={20} strokeWidth={2} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
              <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <div className={styles.switch}>
            {t('auth.login.newAccount')}{' '}
            <Link href="/register/000208" className={styles.link}>{t('common.createAccount')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await getI18nServerSideProps(locale)),
    },
  }
}
