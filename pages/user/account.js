import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useCookies } from 'react-cookie'
import toast, { Toaster } from 'react-hot-toast'
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine, Check,
  ChevronRight, CircleHelp, Copy, History, Link2, LockKeyhole,
  LogOut, MessageCircle, Send, ShieldCheck, Sparkles, Trophy, UsersRound, Wallet,
} from 'lucide-react'
import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { waitForPaint } from '@/lib/uiFeedback'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import AppLoadingOverlay from '@/components/AppLoadingOverlay'
import styles from '@/styles/UserAccount.module.css'

const defaultLinks = {
  telegramGroupUrl: 'https://t.me/+Giav1o1JVGNkYzNk',
  whatsappGroupUrl: 'https://chat.whatsapp.com/I1D6NNWndu6HDrbzB5BkPX?s=hd&p=i&mlu=0&ilr=0',
  customerSupportUrl: 'https://t.me/EFC_Support',
}

function AccountRow({ href, label, icon: Icon, external = false }) {
  const content = <>
    <span className={styles.rowIcon}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
    <span className={styles.rowLabel}>{label}</span>
    <ChevronRight className={styles.rowArrow} size={20} strokeWidth={1.8} aria-hidden="true" />
  </>
  return external
    ? <a className={styles.row} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
    : <Link className={styles.row} href={href}>{content}</Link>
}

export default function Account() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [, setCookie] = useCookies([])
  const [profile, setProfile] = useState(null)
  const [referralCount, setReferralCount] = useState(0)
  const [vipLevel, setVipLevel] = useState(1)
  const [links, setLinks] = useState(defaultLinks)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/platform-settings')
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result?.links) setLinks((current) => ({
          telegramGroupUrl: result.links.telegramGroupUrl || current.telegramGroupUrl,
          whatsappGroupUrl: result.links.whatsappGroupUrl || current.whatsappGroupUrl,
          customerSupportUrl: result.links.customerSupportUrl || current.customerSupportUrl,
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    async function loadProfile() {
      setLoading(true)
      setLoadError(false)
      const session = await requireSession(router)
      if (!session || !active) return
      clearLegacyAuthStorage()
      try {
        const response = await authFetch('/api/me')
        if (response.status === 401 || response.status === 404) {
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }
        if (!response.ok) throw new Error('profile')
        const result = await response.json()
        if (result.status !== 'success' || !result.profile) throw new Error('profile')
        if (!active) return
        setProfile(result.profile)
        setReferralCount(result.referralCount || 0)
        setVipLevel(result.vip?.viplevel || 1)
      } catch (_) {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadProfile()
    return () => { active = false }
  }, [router, retryKey])

  const copyReferral = async () => {
    if (!profile?.newrefer) return
    try {
      await navigator.clipboard.writeText('https://europeanfc01.com/register/' + profile.newrefer)
      setCopied(true)
      toast.success(t('messages.inviteLinkCopied'))
      window.setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      toast.error(t('messages.unableCopy'))
    }
  }

  const signOutAccount = async () => {
    if (signingOut) return
    setSigningOut(true)
    await waitForPaint()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearLegacyAuthStorage()
      setCookie('authdata', '', { path: '/', expires: new Date(0) })
      setCookie('authed', '', { path: '/', expires: new Date(0) })
      router.replace('/login')
    } catch (_) {
      toast.error(t('messages.anErrorOccurred'))
      setSigningOut(false)
    }
  }

  const username = profile?.username || (loading ? t('status.pending') : t('common.account'))
  const balance = Number(profile?.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
  const initials = (profile?.username || 'U').slice(0, 2).toUpperCase()

  return <Cover>
    <Head>
      <title>{username + ' · UCL'}</title>
      <link rel="icon" href="/european.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <Toaster position="bottom-center" reverseOrder={false} />
    <AppLoadingOverlay open={signingOut} title={t('common.signOut')} message="" />
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/user"><ArrowLeft size={18} aria-hidden="true" />{t('common.back')}</Link>
      </div>
      <h1 className={styles.pageTitle}>{t('common.profile')}</h1>

      {loadError && !profile ? <div className={styles.error} role="alert">
        <p>{t('messages.unableLoadProfile')}</p>
        <button type="button" onClick={() => setRetryKey((key) => key + 1)}>{t('mobile.transactions.retry')}</button>
      </div> : <>
        <section className={styles.hero} aria-label={t('common.account')}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <div>
              <span className={styles.hello}>{t('mobile.profile.hello')}</span>
              <h2 className="notranslate">{username}</h2>
              <p>{t('mobile.profile.vipReferralLine', { level: vipLevel, count: referralCount })}</p>
            </div>
          </div>
          <div className={styles.heroBalance}>
            <span>{t('common.currentBalance')}</span>
            <strong aria-live="polite">{loading ? '—' : balance}<small>USDT</small></strong>
            <div className={styles.heroActions}>
              <Link href="/user/fund" className={styles.primaryAction}><ArrowDownToLine size={18} aria-hidden="true" />{t('common.deposit')}</Link>
              <Link href="/user/withdraw" className={styles.secondaryAction}><ArrowUpFromLine size={18} aria-hidden="true" />{t('common.withdraw')}</Link>
            </div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.group}>
              <div className={styles.groupHeading}><h2>{t('mobile.profile.betsTitle')}</h2><Trophy size={23} strokeWidth={1.7} aria-hidden="true" /></div>
              <div className={styles.rows}>
                <AccountRow href="/user/bets" label={t('common.myBets')} icon={Trophy} />
                <AccountRow href="/user/history" label={t('mobile.profile.history')} icon={History} />
              </div>
            </section>

            <section className={styles.group}>
              <div className={styles.groupHeading}><h2>{t('common.account')}</h2><Wallet size={23} strokeWidth={1.7} aria-hidden="true" /></div>
              <div className={styles.rows}>
                <AccountRow href="/user/fund" label={t('mobile.profile.fundAccount')} icon={ArrowDownToLine} />
                <AccountRow href="/user/withdraw" label={t('common.withdraw')} icon={ArrowUpFromLine} />
                <AccountRow href="/user/bindwallet" label={t('mobile.profile.linkWallets')} icon={Link2} />
                <AccountRow href="/user/codesetting" label={t('mobile.profile.codeSetting')} icon={LockKeyhole} />
                <AccountRow href="/user/vip" label={t('mobile.profile.vipProgress')} icon={ShieldCheck} />
                <AccountRow href="/user/wheel" label="Spin wheel" icon={Sparkles} />
              </div>
            </section>
          </div>

          <div className={styles.sideColumn}>
            <section className={styles.referral}>
              <div className={styles.referralHeading}><h2>{t('mobile.profile.referrals')}</h2><UsersRound size={24} strokeWidth={1.7} aria-hidden="true" /></div>
              <div className={styles.referralCode}>
                <span className="notranslate">{profile?.newrefer ? 'register/' + profile.newrefer : '—'}</span>
                <button type="button" onClick={copyReferral} disabled={!profile?.newrefer} aria-label={t('common.copy')} title={t('common.copy')}>
                  {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                </button>
              </div>
              <Link href="/user/refferal" className={styles.referralLink}>{t('mobile.profile.allReferral')}<ArrowRight size={18} aria-hidden="true" /></Link>
            </section>

            <section className={styles.group}>
              <div className={styles.groupHeading}><h2>{t('mobile.profile.aboutTitle')}</h2><CircleHelp size={23} strokeWidth={1.7} aria-hidden="true" /></div>
              <div className={styles.rows}>
                <AccountRow href="/user/faq" label={t('common.faq')} icon={CircleHelp} />
                <AccountRow href={links.customerSupportUrl} label={t('mobile.profile.customerService')} icon={MessageCircle} external />
                <AccountRow href={links.customerSupportUrl} label={t('mobile.profile.contact')} icon={MessageCircle} external />
              </div>
            </section>

            <section className={styles.group}>
              <div className={styles.groupHeading}><h2>{t('mobile.profile.telegramGroup')}</h2><Send size={23} strokeWidth={1.7} aria-hidden="true" /></div>
              <div className={styles.rows}>
                <AccountRow href={links.telegramGroupUrl} label={t('mobile.profile.telegramChannel')} icon={Send} external />
                <AccountRow href={links.telegramGroupUrl} label={t('mobile.profile.telegramGroup')} icon={UsersRound} external />
                <AccountRow href={links.whatsappGroupUrl} label={t('mobile.profile.whatsappGroup')} icon={MessageCircle} external />
              </div>
            </section>
          </div>
        </div>

        <div className={styles.signOut}>
          <button type="button" onClick={signOutAccount} disabled={signingOut}><LogOut size={20} strokeWidth={1.8} aria-hidden="true" />{t('common.signOut')}<ChevronRight size={20} aria-hidden="true" /></button>
        </div>
      </>}
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
