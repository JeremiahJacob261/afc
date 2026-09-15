import React, { useState, useContext, useEffect } from "react";
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import Head from "next/head";
import Link from 'next/link'
import { Stack } from "@mui/material";
import { ArrowLeft, Mail, Lock, ArrowRight, User, Phone, Hash } from "lucide-react";
import { useRouter } from 'next/router'
import LOGO from '@/public/european.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '@/pages/api/supabase'
import codes from '@/pages/api/codeswithflag.json'
import { clearLegacyAuthStorage } from '@/lib/clientAuth';
import AppLoadingOverlay from '@/components/AppLoadingOverlay';
import FeedbackDialog from '@/components/FeedbackDialog';
import { waitForPaint } from '@/lib/uiFeedback';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'next-i18next';

const registrationCountries = [
  ...codes.countries.filter((country) => country.countryCode === 'US'),
  ...codes.countries.filter((country) => country.countryCode === 'RU'),
  ...codes.countries.filter((country) => country.countryCode !== 'US' && country.countryCode !== 'RU'),
]

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
      className="h-4 w-[22px] shrink-0 rounded-sm object-cover shadow-sm"
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
        className="flex w-full items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-3 pr-3 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all"
      >
        <CountryFlag country={selected} eager />
        <span className="min-w-0 flex-1 truncate">{selected.code} {selected.name}</span>
        <span className="text-gray-400" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#1BB6FF]"
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
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${item.countryCode === selected.countryCode ? 'bg-[#1BB6FF]/10 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <CountryFlag country={item} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-gray-500">{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
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

      console.log('User registered successfully:', data.user);
      console.log(data)

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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
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

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#1BB6FF]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#FF4FA3]/10 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{t('common.backToHome')}</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src={LOGO} alt="EFC Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-3xl font-black tracking-[-0.04em] text-gray-900">{t('common.appName')}</span>
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ECFC4] to-[#1BB6FF]" />

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-black tracking-tight mb-2">{t('auth.register.title')}</h1>
              <p className="text-gray-500 text-sm">{t('auth.register.subtitle')}</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              handleRegister()
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.username')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t('auth.register.usernamePlaceholder')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('common.emailAddress')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder={t('auth.register.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.code')}</label>
                  <CountryCodePicker
                    countries={registrationCountries}
                    value={country}
                    onChange={setCountry}
                    label={t('auth.register.code')}
                    searchPlaceholder={t('auth.register.searchCountry')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.phone')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="5550000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.referralCode')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('auth.register.referralCode')}
                    value={idR}
                    onChange={(e) => setidR(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.password')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={values.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={values.password}
                      onChange={handleChange('password')}
                      autoComplete="new-password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                    <button type="button" onClick={handleClickShowPassword} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {values.showPassword ? <VisibilityOff className="w-4 h-4" /> : <Visibility className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">{t('auth.register.confirmPassword')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={values.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={cpassword}
                      onChange={(e) => setcPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agecheck}
                    onChange={(e) => setAgecheck(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1BB6FF] focus:ring-[#1BB6FF]"
                  />
                  <span className="text-sm text-gray-600">
                    {t('auth.register.terms')}{' '}
                    <Link href="/terms" className="text-gray-900 font-semibold hover:text-[#1BB6FF]">{t('auth.register.termsLink')}</Link>
                    {' '}{t('auth.register.and')}{' '}
                    <Link href="/privacy" className="text-gray-900 font-semibold hover:text-[#1BB6FF]">{t('auth.register.privacyLink')}</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1BB6FF] hover:bg-[#2ECFC4] text-[#06101F] font-bold rounded-xl py-3.5 transition-all hover:shadow-[0_0_20px_rgba(27,182,255,0.3)] mt-4 group"
              >
                {loading ? t('auth.register.submitting') : t('auth.register.submit')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {t('auth.register.hasAccount')}{" "}
              <Link href="/login" className="text-gray-900 font-semibold hover:text-[#1BB6FF] transition-colors">
                {t('auth.login.submit')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  const { params } = context;
  const id = params?.id?.[0] ?? null;  // catch-all gives array; grab first element
  return { props: {
      ...i18nProps, refer: id } }
}
