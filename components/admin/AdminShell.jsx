import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import Logo from '@/public/european.ico'

const navItems = [
  { label: 'Overview', href: '/admin/home', icon: LayoutDashboard },
  { label: 'Finance', href: '/admin/finances', icon: CircleDollarSign },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Bets', href: '/admin/match', icon: Trophy },
  { label: 'Control', href: '/admin/control', icon: ShieldCheck },
]

const pageTitles = {
  '/admin/home': 'Admin Overview',
  '/admin/finances': 'Finance',
  '/admin/users': 'Users',
  '/admin/match': 'Bets',
  '/admin/control': 'Control',
  '/admin/generate': 'Generate Claim Code',
  '/admin/paymentmthod': 'Payment Wallets',
  '/admin/wallets': 'Wallet Tools',
  '/admin/broadcast': 'Broadcast',
  '/admin/select': 'Select Match',
  '/admin/input': 'Input Odds',
}

function getTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/admin/full')) return 'User Detail'
  if (pathname.startsWith('/admin/referral')) return 'Referral'
  if (pathname.startsWith('/admin/reward')) return 'Reward'
  if (pathname.startsWith('/admin/security')) return 'Security'
  if (pathname.startsWith('/admin/matchdetail')) return 'Match Detail'
  if (pathname.startsWith('/admin/bet')) return 'User Bets'
  if (pathname.startsWith('/admin/transaction')) return 'Transactions'
  if (pathname.startsWith('/admin/activities')) return 'Activities'
  return 'Admin Console'
}

function formatToday() {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())
}

export default function AdminShell({ children }) {
  const router = useRouter()
  const pathname = router.pathname
  const isPrimaryPage = navItems.some((item) => item.href === pathname)
  const title = getTitle(pathname)

  return (
    <div className="min-h-screen bg-[#BF7AF2] p-0 text-white sm:p-5 lg:p-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col overflow-hidden bg-[#020202] shadow-[0_32px_80px_rgba(0,0,0,0.35)] sm:min-h-[calc(100vh-40px)] sm:rounded-[28px] lg:min-h-[calc(100vh-64px)]">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020202]/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              {!isPrimaryPage && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white hover:text-black"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10">
                <Image src={Logo} width={32} height={32} alt="EFC logo" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1BB6FF]">
                  EFC Admin
                </p>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {title}
                </h1>
              </div>
            </div>

            <nav className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-white/[0.06] p-1">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => router.push(href)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-white text-black'
                        : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition hover:bg-white hover:text-black"
                aria-label="Search admin"
              >
                <Search className="h-4 w-4" />
              </button>
              <div className="hidden shrink-0 items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-zinc-300 sm:flex">
                <CalendarDays className="h-4 w-4 text-[#1BB6FF]" />
                {formatToday()}
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-full bg-white/[0.06] py-1 pl-1 pr-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1BB6FF] text-sm font-bold text-black">
                  A
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        <main className="admin-shell-content flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  )
}
