import { useEffect } from 'react'
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
  useEffect(() => {
    async function checkSession() {
      const session = await requireSession(router)
      if (session) clearLegacyAuthStorage()
    }
    checkSession()
  }, [router])

  return <div className={styles.shell}>
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
    {dashboard ? children : <div className={styles.subpageContent} data-page={router.pathname}>{children}</div>}
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {navigation.map(({ href, label, icon: ItemIcon }) => <Link key={href} href={href} aria-current={router.pathname === href ? 'page' : undefined}><ItemIcon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  </div>
}
