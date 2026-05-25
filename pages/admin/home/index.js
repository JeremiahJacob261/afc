import Head from 'next/head'
import Image from 'next/image'
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import Logo from '@/public/european.ico'
import { requireAdmin } from '@/lib/adminAuth'
import { getAdminDashboardData } from '@/lib/adminDashboardData'

const filters = ['All', 'Finance', 'Users', 'Bets', 'System']

function formatNumber(value, options = {}) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: options.decimals ?? 0,
    minimumFractionDigits: options.decimals ?? 0,
  }).format(number)
}

function formatMoney(value) {
  return `$${formatNumber(value, { decimals: 2 })}`
}

function formatTime(value) {
  if (!value) return 'No time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusClass(status) {
  if (status === 'success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
  if (status === 'failed') return 'border-[#C61F41]/30 bg-[#C61F41]/15 text-[#ff8ca0]'
  if (status === 'processing') return 'border-[#B96CFF]/30 bg-[#B96CFF]/15 text-[#dcb3ff]'
  return 'border-[#1BB6FF]/25 bg-[#1BB6FF]/10 text-[#8EE5FF]'
}

function MetricCard({ label, value, hint, icon: Icon, emphasis }) {
  return (
    <article className={`rounded-[24px] border border-white/10 p-4 ${emphasis ? 'bg-[#202020]' : 'bg-[#151515]'}`}>
      <div className="mb-6 flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-[#1BB6FF]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </article>
  )
}

function Heatmap({ charts }) {
  const max = Math.max(...charts.map((item) => item.deposits + item.withdrawals), 1)
  const rows = ['Deposits', 'Withdraws', 'Bets', 'Activity']

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Transaction Heatmap</p>
          <p className="text-xs text-zinc-500">Last 6 months</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">Finance</span>
      </div>
      <div className="grid gap-3">
        {rows.map((row, rowIndex) => (
          <div key={row} className="grid grid-cols-[76px_repeat(6,minmax(0,1fr))] items-center gap-2">
            <p className="text-xs text-zinc-500">{row}</p>
            {charts.map((item) => {
              const value = rowIndex === 0
                ? item.deposits
                : rowIndex === 1
                  ? item.withdrawals
                  : rowIndex === 2
                    ? item.bets * 50
                    : item.deposits + item.withdrawals + item.bets
              const opacity = Math.max(0.12, Math.min(1, value / max))
              return (
                <div
                  key={`${row}-${item.label}`}
                  className="h-7 rounded-lg border border-white/10"
                  style={{ background: `rgba(27, 182, 255, ${opacity})` }}
                />
              )
            })}
          </div>
        ))}
        <div className="grid grid-cols-[76px_repeat(6,minmax(0,1fr))] gap-2 pt-1">
          <span />
          {charts.map((item) => (
            <p key={item.label} className="text-center text-xs text-zinc-500">{item.label}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

function GrowthBars({ charts }) {
  const max = Math.max(...charts.map((item) => item.bets), 1)

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Betting Growth</p>
          <p className="text-xs text-zinc-500">Placed bets trend</p>
        </div>
        <div className="rounded-full bg-white/[0.06] p-1 text-xs">
          <span className="rounded-full bg-white px-3 py-1 text-black">Monthly</span>
        </div>
      </div>
      <div className="flex h-44 items-end gap-3">
        {charts.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-t-2xl border border-white/10 bg-white/[0.03] p-1">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-[#B96CFF] to-[#1BB6FF]"
                style={{ height: `${Math.max(8, (item.bets / max) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ConversionRing({ summary }) {
  const total = Math.max(summary.totalUsers || 0, 1)
  const activeRate = Math.min(100, Math.round(((summary.activeUsers || 0) / total) * 100))
  const pendingRate = Math.min(100, Math.round(((summary.pendingTransactions || 0) / Math.max(summary.pendingTransactions + summary.betsToday, 1)) * 100))

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">System Ratio</p>
          <p className="text-xs text-zinc-500">Active users vs queue</p>
        </div>
        <ShieldCheck className="h-4 w-4 text-[#1BB6FF]" />
      </div>
      <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#1BB6FF 0 ${activeRate}%, #C61F41 ${activeRate}% ${activeRate + pendingRate}%, rgba(255,255,255,0.1) ${activeRate + pendingRate}% 100%)`,
          }}
        />
        <div className="absolute inset-6 rounded-full bg-[#151515]" />
        <div className="relative text-center">
          <p className="text-3xl font-semibold text-white">{activeRate}%</p>
          <p className="text-xs text-zinc-500">Active Rate</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-full bg-[#1BB6FF]/10 px-3 py-2 text-[#8EE5FF]">Active {summary.activeUsers}</span>
        <span className="rounded-full bg-[#C61F41]/15 px-3 py-2 text-[#ff8ca0]">Pending {summary.pendingTransactions}</span>
      </div>
    </section>
  )
}

export default function AdminHome({ dashboard }) {
  const summary = dashboard?.summary || {}
  const charts = dashboard?.charts || []
  const activity = dashboard?.activity || []
  const financeRows = dashboard?.finance?.latest || []
  const latestUsers = dashboard?.users || []
  const matches = dashboard?.matches || []

  return (
    <>
      <Head>
        <title>Admin Overview</title>
      </Head>

      <div className="space-y-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Let&apos;s see the current platform performance.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((filter, index) => (
                <span
                  key={filter}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    index === 0 ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-300'
                  }`}
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-[#151515] p-3">
            <Image src={Logo} width={42} height={42} alt="EFC logo" />
            <div>
              <p className="text-sm font-semibold text-white">Live Admin Feed</p>
              <p className="text-xs text-zinc-500">Real data from admin services</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Users" value={formatNumber(summary.totalUsers)} hint={`${formatNumber(summary.activeUsers)} active users`} icon={Users} />
          <MetricCard label="Bets Today" value={formatNumber(summary.betsToday)} hint="Placed since midnight" icon={Trophy} emphasis />
          <MetricCard label="Finance Balance" value={formatMoney(summary.financeBalance)} hint="Deposits minus withdrawals" icon={Banknote} />
          <MetricCard label="Pending Queue" value={formatNumber(summary.pendingTransactions)} hint="Transactions needing review" icon={Clock3} />
        </section>

        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_0.72fr]">
          <Heatmap charts={charts} />
          <GrowthBars charts={charts} />
          <ConversionRing summary={summary} />
        </section>

        <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Latest Finance</p>
                <p className="text-xs text-zinc-500">Deposits and withdrawals</p>
              </div>
              <CircleDollarSign className="h-4 w-4 text-[#1BB6FF]" />
            </div>
            <div className="grid gap-2">
              {financeRows.length ? financeRows.map((row) => (
                <div key={row.uid || row.id} className="grid gap-3 rounded-2xl bg-white/[0.04] p-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-white">{row.username || 'Unknown user'}</p>
                    <p className="text-xs text-zinc-500">{row.type || 'transaction'} · {row.method || 'USDT'}</p>
                  </div>
                  <p className="font-semibold text-white">{formatNumber(row.amount, { decimals: 2 })}</p>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs capitalize ${statusClass(row.normalizedStatus)}`}>
                    {row.normalizedStatus}
                  </span>
                </div>
              )) : (
                <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-zinc-500">No finance rows yet.</p>
              )}
            </div>
          </section>

          <aside className="grid gap-3">
            <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Recent Activity</p>
                <ArrowUpRight className="h-4 w-4 text-[#1BB6FF]" />
              </div>
              <div className="grid gap-2">
                {activity.length ? activity.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-zinc-500">{item.detail}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[11px] capitalize ${statusClass(item.tone)}`}>
                        {item.tone}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-600">{formatTime(item.time)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-500">No activity yet.</p>
                )}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Latest Users</p>
              <Users className="h-4 w-4 text-[#1BB6FF]" />
            </div>
            <div className="grid gap-2">
              {latestUsers.length ? latestUsers.map((user) => (
                <div key={user.uid} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-zinc-500">{user.uid}</p>
                  </div>
                  <p className="text-sm text-zinc-300">{formatNumber(user.balance, { decimals: 2 })} USDT</p>
                </div>
              )) : (
                <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-zinc-500">No users found.</p>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Open Matches</p>
              <Wallet className="h-4 w-4 text-[#1BB6FF]" />
            </div>
            <div className="grid gap-2">
              {matches.length ? matches.map((match) => (
                <div key={match.match_id || match.id} className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-xs text-zinc-500">{match.league || 'League'}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold text-white">
                    <span className="truncate">{match.home}</span>
                    <span className="text-[#1BB6FF]">VS</span>
                    <span className="truncate text-right">{match.away}</span>
                  </div>
                </div>
              )) : (
                <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-zinc-500">No open matches found.</p>
              )}
            </div>
          </section>
        </section>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    requireAdmin(context.req)
    const dashboard = await getAdminDashboardData()
    return { props: { dashboard } }
  } catch (error) {
    if (error.statusCode === 401) {
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent('/admin/home')}`,
          permanent: false,
        },
      }
    }

    console.log(error)
    return {
      props: {
        dashboard: {
          summary: {},
          finance: { latest: [] },
          charts: [],
          users: [],
          matches: [],
          activity: [],
        },
      },
    }
  }
}
