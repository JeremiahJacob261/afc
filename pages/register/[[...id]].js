import React, { useState, useEffect } from "react";
import { getI18nServerSideProps } from "@/lib/i18nServerSideProps";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, Phone, ShieldCheck, User, Hash } from "lucide-react";
import { useRouter } from "next/router";
import LOGO from "@/public/european.ico";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/pages/api/supabase";
import codes from "@/pages/api/codeswithflag.json";
import { clearLegacyAuthStorage } from "@/lib/clientAuth";
import AppLoadingOverlay from "@/components/AppLoadingOverlay";
import FeedbackDialog from "@/components/FeedbackDialog";
import { waitForPaint } from "@/lib/uiFeedback";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { Hairline, Starfield } from "@/components/ucl/Decor";
import { Star, Starball } from "@/components/ucl/Starball";

const registrationCountries = [
  ...codes.countries.filter((country) => country.countryCode === 'US'),
  ...codes.countries.filter((country) => country.countryCode === 'RU'),
  ...codes.countries.filter((country) => country.countryCode !== 'US' && country.countryCode !== 'RU'),
];

function CountryFlag({ country, eager = false }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!country?.flagImage || imageFailed) {
    return <span className="text-lg leading-none" aria-hidden="true">{country?.flag}</span>
  }

  return (
    <img
      src={country.flagImage}
      alt={`${country.name} flag`}
      width={22}
      height={16}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setImageFailed(true)}
      className="h-4 w-[22px] shrink-0 rounded-sm object-cover"
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
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="ucl-select-trigger"
      >
        <CountryFlag country={selected} eager />
        <span className="min-w-0 flex-1 truncate">
          <span className="text-silver-500">{selected.code}</span> {selected.name}
        </span>
        <span className="text-xs text-silver-500" aria-hidden="true">▼</span>
      </button>

      {open && (
        <div className="ucl-select-menu">
          <div className="border-b border-white/10 p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="ucl-field py-2"
            />
          </div>
          <div role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
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
                className="ucl-select-option"
              >
                <CountryFlag country={item} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-silver-500">{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ id, label, icon: Icon, children, trailing }) {
  return (
    <div>
      <label className="ucl-label" htmlFor={id}>{label}</label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon className="h-4 w-4 text-silver-500" aria-hidden="true" />
          </span>
        )}
        {children}
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5">
            {trailing}
          </span>
        )}
      </div>
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
        showErrorDialog(t('messages.checkConnectionTryAgain'))
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="ucl-root flex flex-col lg:flex-row">
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

      <Starfield />
      <div className="ucl-rays" aria-hidden="true" />
      <Starball
        className="pointer-events-none absolute -left-28 top-1/4 h-[30rem] w-[30rem] opacity-30 lg:-left-24"
        tilt={16}
        density={0.18}
      />

      {/* ── Brand column ──────────────────────────────────────────────── */}
      <aside className="ucl-content relative hidden w-[46%] shrink-0 flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-14">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Star className="h-4 w-4 shrink-0 text-cyan-300" />
          <Image src={LOGO} alt="" width={30} height={30} aria-hidden="true" />
          <span className="text-xl font-black uppercase tracking-[0.2em] text-white">
            {t('common.appName')}
          </span>
        </Link>

        <div className="max-w-md">
          <p className="flex items-center gap-2.5">
            <Star className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span className="ucl-eyebrow">{t('common.brandFull')}</span>
          </p>
          <h2 className="ucl-display mt-5 text-5xl text-white">
            <span className="ucl-silver">{t('landing.hero.titleLine1')}</span>{" "}
            <span className="ucl-ribbon">{t('landing.hero.titleLine2')}</span>
          </h2>
          <div
            className="mt-7 h-[2px] w-20 bg-ucl-ribbon"
            style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
            aria-hidden="true"
          />
          <p className="mt-6 text-base leading-7 text-silver-400">
            {t('landing.hero.copy')}
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: CheckCircle2, copy: t('landing.hero.secureDepositsCopy') },
              { icon: ShieldCheck, copy: t('landing.hero.responsiblePlayCopy') },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.copy} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
                  <span className="text-sm leading-6 text-silver-300">{item.copy}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-silver-500">
          {t('auth.register.terms')} <Link href="/terms" className="ucl-link">{t('auth.register.termsLink')}</Link>
        </p>
      </aside>

      {/* ── Form column ───────────────────────────────────────────────── */}
      <main className="ucl-content relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src={LOGO} alt="" width={30} height={30} aria-hidden="true" />
              <span className="text-lg font-black uppercase tracking-[0.16em] text-white">
                {t('common.appName')}
              </span>
            </Link>
            <Link href="/" className="ucl-chip">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.backToHome')}
            </Link>
          </div>

          <Link href="/" className="mb-8 hidden items-center gap-2 text-sm font-bold text-silver-400 transition hover:text-white lg:inline-flex">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('common.backToHome')}
          </Link>

          <div className="ucl-panel-strong ucl-cut relative overflow-hidden p-6 sm:p-8">
            <div className="ucl-cut-rule absolute inset-x-0 top-0" />

            <div className="mb-8">
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                {t('auth.register.title')}
              </h1>
              <p className="mt-2 text-sm text-silver-400">{t('auth.register.subtitle')}</p>
            </div>

            <Hairline className="mb-7" />

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              handleRegister()
            }}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="reg-username" label={t('auth.register.username')} icon={User}>
                  <input
                    id="reg-username"
                    type="text"
                    placeholder={t('auth.register.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="ucl-field pl-10"
                    required
                  />
                </Field>

                <Field id="reg-email" label={t('common.emailAddress')} icon={Mail}>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder={t('auth.register.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="ucl-field pl-10"
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="ucl-label">{t('auth.register.code')}</span>
                  <CountryCodePicker
                    countries={registrationCountries}
                    value={country}
                    onChange={setCountry}
                    label={t('auth.register.code')}
                    searchPlaceholder={t('auth.register.searchCountry')}
                  />
                </div>

                <Field id="reg-phone" label={t('auth.register.phone')} icon={Phone}>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="5550000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    className="ucl-field pl-10"
                    required
                  />
                </Field>
              </div>

              <Field id="reg-referral" label={t('auth.register.referralCode')} icon={Hash}>
                <input
                  id="reg-referral"
                  type="text"
                  placeholder={t('auth.register.referralCode')}
                  value={idR}
                  onChange={(e) => setidR(e.target.value)}
                  className="ucl-field pl-10"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="reg-password"
                  label={t('auth.register.password')}
                  icon={Lock}
                  trailing={
                    <button
                      type="button"
                      onClick={handleClickShowPassword}
                      aria-label={t('auth.register.password')}
                      className="text-silver-500 transition hover:text-white"
                    >
                      {values.showPassword
                        ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                        : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  }
                >
                  <input
                    id="reg-password"
                    type={values.showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange('password')}
                    autoComplete="new-password"
                    className="ucl-field pl-10 pr-11"
                    required
                  />
                </Field>

                <Field id="reg-confirm" label={t('auth.register.confirmPassword')} icon={Lock}>
                  <input
                    id="reg-confirm"
                    type={values.showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={cpassword}
                    onChange={(e) => setcPassword(e.target.value)}
                    autoComplete="new-password"
                    className="ucl-field pl-10"
                    required
                  />
                </Field>
              </div>

              <div className="pt-2">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={agecheck}
                    onChange={(e) => setAgecheck(e.target.checked)}
                    className="ucl-check mt-0.5"
                  />
                  <span className="text-sm leading-6 text-silver-400">
                    {t('auth.register.terms')}{' '}
                    <Link href="/terms" className="ucl-link">{t('auth.register.termsLink')}</Link>
                    {' '}{t('auth.register.and')}{' '}
                    <Link href="/privacy" className="ucl-link">{t('auth.register.privacyLink')}</Link>
                  </span>
                </label>
              </div>

              <button type="submit" disabled={loading} className="ucl-btn ucl-btn-primary ucl-btn-block group mt-2">
                {loading ? t('auth.register.submitting') : t('auth.register.submit')}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </form>

            <Hairline className="my-7" />

            <div className="text-center text-sm text-silver-400">
              {t('auth.register.hasAccount')}{" "}
              <Link href="/login" className="ucl-link">
                {t('auth.login.submit')}
              </Link>
            </div>
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
