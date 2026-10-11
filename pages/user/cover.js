import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Bell, History, Home, Menu, Trophy, Wallet } from 'lucide-react'
import { clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import styles from '@/styles/UserDashboard.module.css'

function getNavigation(t) { return [
  { href: '/user', label: t('website.home'), icon: Home },
  { href: '/user/matches', label: t('website.matches'), icon: Trophy },
  { href: '/user/bets', label: t('website.bets'), icon: History },
  { href: '/user/fund', label: t('website.wallet'), icon: Wallet },
  { href: '/user/account', label: t('website.more'), icon: Menu },
] }

export default function Cover({ children, dashboard = false }) {
  const { t } = useTranslation('common');
  const navigation = getNavigation(t);
  const router = useRouter()
  const contentRef = useRef(null)
  const [offline, setOffline] = useState(false)
  const [visible, setVisible] = useState(true)
  const [draftAmount, setDraftAmount] = useState('')
  const [userId, setUserId] = useState('')
  const transactionPage = /^\/user\/(?:fund|deposit|withdraw|bets|match|viewbet|wheel|inputvalue|codesetting|bindwallet)(?:\/|$)/.test(router.pathname)

  useEffect(() => {
    if (dashboard) return

    async function checkSession() {
      const session = await requireSession(router)
      if (session) {
        clearLegacyAuthStorage()
        setUserId(session.user.id)
      }
    }
    checkSession()
  }, [dashboard, router])

  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine)
    const updateVisibility = () => setVisible(!document.hidden)
    updateConnection()
    updateVisibility()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = offline && transactionPage
    if (!offline || !userId || !router.pathname.startsWith('/user/fund')) {
      setDraftAmount('')
      return
    }
    try {
      const draft = JSON.parse(sessionStorage.getItem('ucl.depositDraft.v1') || 'null')
      setDraftAmount(draft?.userId === userId ? String(draft.amount || '') : '')
    } catch (_) {
      setDraftAmount('')
    }
  }, [offline, transactionPage, userId, router.pathname])

  function followOfflineLink(event) {
    if (!offline || !(event.target instanceof Element)) return
    const anchor = event.target.closest('a[href]')
    if (!anchor || anchor.target === '_blank') return
    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin || !/(^|\/)user(\/|$)/.test(url.pathname)) return
    event.preventDefault()
    window.location.assign(url.href)
  }

  return <div className={styles.shell} onClickCapture={followOfflineLink}>
    <div className={styles.ambientBall} data-paused={!visible} aria-hidden="true" />
    <header className={styles.shellHeader}>
      <div className={styles.shellHeaderInner}>
        <Link href="/user" className={styles.shellBrand} aria-label={t('website.uclHome')}>UCL</Link>
        <nav className={styles.desktopNav} aria-label={t('website.dashboardNavigation')}>
          {navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={router.pathname === href ? 'page' : undefined}>{label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <LocaleSwitcher compact className={styles.dashboardLocale} />
          <Link href="/user/notification" className={styles.notificationLink} aria-label={t('website.notifications')} aria-current={router.pathname === '/user/notification' ? 'page' : undefined}><Bell size={21} strokeWidth={1.8} /></Link>
        </div>
      </div>
    </header>
    {offline && <div className={styles.offlineNotice} role="status">
      <strong>{t('website.youAreOffline')}</strong> {transactionPage ? t('website.transactionsAreUnavailableUntilYouReconnect') : t('website.liveInformationWillRefreshWhenYouReconnect')}
      {draftAmount && <span>{t('website.savedDepositDraft')} {draftAmount}</span>}
    </div>}
    {dashboard ? children : <div className={styles.subpageContent} data-page={router.pathname} ref={contentRef} data-offline-disabled={offline && transactionPage}>{children}</div>}
    <nav className={styles.mobileNav} aria-label={t('website.mobileNavigation')}>
      {navigation.map(({ href, label, icon: ItemIcon }) => <Link key={href} href={href} aria-current={router.pathname === href ? 'page' : undefined}><ItemIcon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  </div>
}
