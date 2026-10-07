import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Bell, History, Home, Menu, Trophy, Wallet } from 'lucide-react'
import { clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import styles from '@/styles/UserDashboard.module.css'

const navigation = [
  { href: '/user', label: 'Home', icon: Home },
  { href: '/user/matches', label: 'Matches', icon: Trophy },
  { href: '/user/bets', label: 'Bets', icon: History },
  { href: '/user/fund', label: 'Wallet', icon: Wallet },
  { href: '/user/account', label: 'More', icon: Menu },
]

export default function Cover({ children, dashboard = false }) {
  const router = useRouter()
  const contentRef = useRef(null)
  const [offline, setOffline] = useState(false)
  const [visible, setVisible] = useState(true)
  const [draftAmount, setDraftAmount] = useState('')
  const [userId, setUserId] = useState('')
  const transactionPage = /^\/user\/(?:fund|deposit|withdraw|bets|match|viewbet|wheel|inputvalue|codesetting|bindwallet)(?:\/|$)/.test(router.pathname)

  useEffect(() => {
    async function checkSession() {
      const session = await requireSession(router)
      if (session) {
        clearLegacyAuthStorage()
        setUserId(session.user.id)
      }
    }
    checkSession()
  }, [router])

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
        <Link href="/user" className={styles.shellBrand} aria-label="UCL home">UCL</Link>
        <nav className={styles.desktopNav} aria-label="Dashboard navigation">
          {navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={router.pathname === href ? 'page' : undefined}>{label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <LocaleSwitcher compact className={styles.dashboardLocale} />
          <Link href="/user/notification" className={styles.notificationLink} aria-label="Notifications" aria-current={router.pathname === '/user/notification' ? 'page' : undefined}><Bell size={21} strokeWidth={1.8} /></Link>
        </div>
      </div>
    </header>
    {offline && <div className={styles.offlineNotice} role="status">
      <strong>You are offline.</strong> {transactionPage ? 'Transactions are unavailable until you reconnect.' : 'Live information will refresh when you reconnect.'}
      {draftAmount && <span>Saved deposit draft: {draftAmount}</span>}
    </div>}
    {dashboard ? children : <div className={styles.subpageContent} data-page={router.pathname} ref={contentRef} data-offline-disabled={offline && transactionPage}>{children}</div>}
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {navigation.map(({ href, label, icon: ItemIcon }) => <Link key={href} href={href} aria-current={router.pathname === href ? 'page' : undefined}><ItemIcon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  </div>
}
