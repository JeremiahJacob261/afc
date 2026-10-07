import React, { useState, useEffect } from "react";
import { getI18nServerSideProps } from "@/lib/i18nServerSideProps";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/router";
import { supabase } from "@/pages/api/supabase";
import codes from "@/pages/api/codeswithflag.json";
import { clearLegacyAuthStorage } from "@/lib/clientAuth";
import AppLoadingOverlay from "@/components/AppLoadingOverlay";
import FeedbackDialog from "@/components/FeedbackDialog";
import { waitForPaint } from "@/lib/uiFeedback";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import LandingImage from "@/components/ucl/LandingImage";
import landing from "@/styles/LandingSystem.module.css";
import styles from "@/styles/Auth.module.css";

const registrationCountries = [
  ...codes.countries.filter((country) => country.countryCode === 'US'),
  ...codes.countries.filter((country) => country.countryCode === 'RU'),
  ...codes.countries.filter((country) => country.countryCode !== 'US' && country.countryCode !== 'RU'),
];

function CountryFlag({ country, eager = false }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!country?.flagImage || imageFailed) {
    return <span className={styles.flagEmoji} aria-hidden="true">{country?.flag}</span>
  }

  return (
    <img
      src={country.flagImage}
      alt={`${country.name} flag`}
      width={22}
      height={16}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setImageFailed(true)}
      className={styles.flag}
    />
  )
}

function CountryCodePicker({ countries, value, onChange, label, searchPlaceholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = countries.find((item) => item.countryCode === value) || countries[0]
  const normalizedQuery = query.trim().toLowerCase()
  const visibleCountries = normalizedQuery
    ? countries.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(normalizedQuery))
    : countries

  return (
    <div className={styles.control}>
      <button
        type="button"
        id="reg-code"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={styles.selectTrigger}
      >
        <CountryFlag country={selected} eager />
        <span className={styles.selectValue}>
          <span className={styles.selectCode}>{selected.code}</span> {selected.name}
        </span>
        <span className={styles.selectCaret} aria-hidden="true"><ChevronDown size={20} strokeWidth={2} /></span>
      </button>

      {open && (
        <div className={styles.selectMenu}>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={label}
            className={styles.selectSearch}
          />
          <div role="listbox" aria-label={label} className={styles.selectList}>
            {visibleCountries.map((item) => (
              <button
                key={item.countryCode}
                type="button"
                role="option"
                aria-selected={item.countryCode === selected.countryCode}
                onClick={() => {
                  onChange(item.countryCode)
                  setOpen(false)
                  setQuery('')
                }}
                className={styles.selectOption}
              >
                <CountryFlag country={item} />
                <span className={styles.selectName}>{item.name}</span>
                <span className={styles.selectDial}>{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ id, label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default function Register({ refer }) {
  const { t } = useTranslation('common')

  const [password, setPassword] = useState("")
  const [cpassword, setcPassword] = useState("")
  const route = useRouter();
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [country, setCountry] = useState("US");

  const [loading, setLoading] = useState(false);
  const [idR, setidR] = useState(refer);
  const [agecheck, setAgecheck] = useState(false);
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState(null)

  const [values, setValues] = React.useState({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  });

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  useEffect(() => {
  }, [refer]);

  const showErrorDialog = (message, title = t('messages.unableCreateAccount')) => {
    setFeedback({ type: 'error', title, message })
  }

  const handleRegister = async () => {
    if (loading) return

    if (phone.length < 9) {
      toast.error(t('messages.phoneNineDigits'))
      return
    }

    if (!agecheck) {
      toast.error(t('messages.acceptTerms'))
      return
    }

    if (cpassword !== values.password) {
      toast.error(t('messages.passwordsMustMatch'))
      return
    }

    setLoading(true)
    await waitForPaint()

    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(t('messages.unableValidateUsername'))
        return
      }

      if (!result.available) {
        toast.error(t('messages.usernameExists'))
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: values.password,
        options: {
          data: {
            displayName: username,
            phoneNumber: phone,
          }
        }
      })

      if (error) throw error;

      const profileResponse = await fetch('/api/signup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: data.user.id,
          username,
          email,
          phone,
          countrycode: codes.countries.find((item) => item.countryCode === country)?.code || country,
          refer: idR,
        }),
      })
      const profileResult = await profileResponse.json().catch(() => ({}))

      if (!profileResponse.ok || profileResult.status !== 'success') {
        throw new Error(profileResult.message || t('messages.unableCreateProfile'))
      }

      clearLegacyAuthStorage();
      setLoading(false)
      setFeedback({
        type: 'success',
        title: t('messages.welcomeToEfc'),
        message: t('messages.accountCreated'),
      })
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.message === 'User already registered') {
        showErrorDialog(t('messages.emailExists'), t('messages.emailRegistered'))
      } else if (error.message === 'Password should be at least 6 characters') {
        showErrorDialog(t('messages.strongerPasswordMessage'), t('messages.strongerPasswordTitle'))
      } else if (error.message === 'Unable to validate email address: invalid format') {
        showErrorDialog(t('messages.invalidEmailMessage'), t('messages.invalidEmailTitle'))
      } else if (error.message === 'Username Already Exist!') {
        toast.error(t('messages.usernameExists'))
      } else {
        console.error('Unexpected error during registration:', error);
        showErrorDialog(t('messages.checkConnectionTryAgain'))
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className={`${landing.page} ${styles.auth} ${styles.register}`}>
      <Head>
        <title>{t('auth.register.title')}</title>
        <meta name="description" content={t('auth.register.subtitle')} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppLoadingOverlay open={loading} title={t('auth.register.submitting')} message={t('auth.register.subtitle')} />
      <FeedbackDialog
        open={Boolean(feedback)}
        type={feedback?.type}
        title={feedback?.title}
        message={feedback?.message}
        onClose={() => {
          const shouldGoHome = feedback?.type === 'success'
          setFeedback(null)
          if (shouldGoHome) route.push('/user')
        }}
      />
      <Toaster position="bottom-center" reverseOrder={false} />

      {/* ── Brand column: the landing masthead, run vertically ───────────── */}
      <aside className={`${styles.dark} ${styles.brandPanel}`}>
        <div className={styles.artwork} aria-hidden="true">
          <LandingImage name="hero" eager sizes="(min-width: 1024px) 46vw, 100vw" />
        </div>
        <div className={`${styles.brandPanelInner} ${styles.darkInner}`}>
          <div className={styles.brandRow}>
            <Link href="/" className={styles.brand} aria-label="UCL home">UCL</Link>
            <Link href="/login" className={styles.pill}>{t('common.login')}</Link>
          </div>

          <div className={styles.brandCopy}>
            <h2>
              {t('landing.hero.titleLine1')} {t('landing.hero.titleLine2')}
            </h2>
            <p className={styles.lede}>{t('landing.hero.copy')}</p>

            <div className={styles.facts}>
              <div className={styles.fact}>
                <p className={styles.factLabel}>{t('landing.hero.secureDeposits')}</p>
                <p className={styles.factValue}>{t('landing.hero.secureDepositsCopy')}</p>
              </div>
              <div className={styles.fact}>
                <p className={styles.factLabel}>{t('landing.hero.responsiblePlay')}</p>
                <p className={styles.factValue}>{t('landing.hero.responsiblePlayCopy')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Task column ──────────────────────────────────────────────────── */}
      <main className={styles.formColumn}>
        <div className={styles.formInner}>
          <header className={styles.formHead}>
            <h1>{t('auth.register.title')}</h1>
            <p>{t('auth.register.subtitle')}</p>
          </header>

          <div className={styles.rule} aria-hidden="true" />

          <form className={styles.form} onSubmit={(event) => {
            event.preventDefault();
            handleRegister()
          }}>
            <div className={styles.grid}>
              <div className={styles.span6}>
                <Field id="reg-username" label={t('auth.register.username')}>
                  <input
                    id="reg-username"
                    type="text"
                    placeholder={t('auth.register.usernamePlaceholder')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    className={styles.input}
                    required
                  />
                </Field>
              </div>

              <div className={styles.span6}>
                <Field id="reg-email" label={t('common.emailAddress')}>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder={t('auth.register.emailPlaceholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className={styles.input}
                    required
                  />
                </Field>
              </div>

              <div className={styles.span7}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-code">{t('auth.register.code')}</label>
                  <CountryCodePicker
                    countries={registrationCountries}
                    value={country}
                    onChange={setCountry}
                    label={t('auth.register.code')}
                    searchPlaceholder={t('auth.register.searchCountry')}
                  />
                </div>
              </div>

              <div className={styles.span5}>
                <Field id="reg-phone" label={t('auth.register.phone')}>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="5550000000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    className={styles.input}
                    required
                  />
                </Field>
              </div>

              <div>
                <Field id="reg-referral" label={t('auth.register.referralCode')}>
                  <input
                    id="reg-referral"
                    type="text"
                    placeholder={t('auth.register.referralCode')}
                    value={idR}
                    onChange={(event) => setidR(event.target.value)}
                    className={styles.input}
                  />
                </Field>
              </div>

              <div className={styles.span6}>
                <Field id="reg-password" label={t('auth.register.password')}>
                  <div className={styles.control}>
                    <input
                      id="reg-password"
                      type={values.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={values.password}
                      onChange={handleChange('password')}
                      autoComplete="new-password"
                      className={`${styles.input} ${styles.withReveal}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.reveal}
                      onClick={handleClickShowPassword}
                      aria-label={t('auth.register.password')}
                    >
                      {values.showPassword
                        ? <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
                        : <Eye size={20} strokeWidth={2} aria-hidden="true" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className={styles.span6}>
                <Field id="reg-confirm" label={t('auth.register.confirmPassword')}>
                  <input
                    id="reg-confirm"
                    type={values.showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={cpassword}
                    onChange={(event) => setcPassword(event.target.value)}
                    autoComplete="new-password"
                    className={styles.input}
                    required
                  />
                </Field>
              </div>
            </div>

            <label className={styles.terms}>
              <input
                type="checkbox"
                checked={agecheck}
                onChange={(event) => setAgecheck(event.target.checked)}
              />
              <span>
                {t('auth.register.terms')}{' '}
                <Link href="/terms" className={styles.link}>{t('auth.register.termsLink')}</Link>
                {' '}{t('auth.register.and')}{' '}
                <Link href="/privacy" className={styles.link}>{t('auth.register.privacyLink')}</Link>
              </span>
            </label>

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
              <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <div className={styles.switch}>
            {t('auth.register.hasAccount')}{' '}
            <Link href="/login" className={styles.link}>{t('auth.login.submit')}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  const { params } = context;
  const id = params?.id?.[0] ?? null;  // catch-all gives array; grab first element
  return { props: {
      ...i18nProps, refer: id } }
}
