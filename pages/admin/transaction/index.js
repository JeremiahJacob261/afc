import Head from 'next/head'
import { useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eye,
  Gift,
  Search,
  ShieldAlert,
  Trophy,
  Wallet,
  X,
} from 'lucide-react'
import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'bet', label: 'Bets' },
  { key: 'bonus', label: 'Bonuses/Rebates' },
]

function formatAmount(value) {
  const number = Number(value || 0)
  return `${Number.isFinite(number) ? number.toFixed(3) : '0.000'} USDT`
}

function formatDate(value) {
  if (!value) return 'No time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeStatus(value) {
  const status = String(value || 'pending').toLowerCase()
  if (status === 'true') return 'won'
  if (status === 'false') return 'lost'
  if (status === 'null') return 'pending'
  if (status === 'completed') return 'success'
  return status
}

function statusClass(status) {
  if (['success', 'won'].includes(status)) return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
  if (['failed', 'lost'].includes(status)) return 'border-[#C61F41]/30 bg-[#C61F41]/15 text-[#ff8ca0]'
  if (status === 'processing') return 'border-[#B96CFF]/30 bg-[#B96CFF]/15 text-[#dcb3ff]'
  return 'border-[#1BB6FF]/25 bg-[#1BB6FF]/10 text-[#8EE5FF]'
}

function iconForCategory(category) {
  if (category === 'deposit') return ArrowDownLeft
  if (category === 'withdrawal') return ArrowUpRight
  if (category === 'bet') return Trophy
  if (category === 'bonus') return Gift
  return Wallet
}

function iconClass(category) {
  if (category === 'deposit') return 'bg-emerald-400/10 text-emerald-300'
  if (category === 'withdrawal') return 'bg-[#C61F41]/15 text-[#ff8ca0]'
  if (category === 'bet') return 'bg-[#1BB6FF]/10 text-[#8EE5FF]'
  if (category === 'bonus') return 'bg-[#B96CFF]/15 text-[#dcb3ff]'
  return 'bg-white/[0.08] text-zinc-300'
}

function StatCard({ label, value, icon: Icon, tone = 'text-white' }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#151515] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`mt-4 text-2xl font-semibold ${tone}`}>{value}</p>
    </article>
  )
}

function LedgerRow({ item, onCopy, onProof }) {
  const Icon = iconForCategory(item.category)
  const isCredit = item.direction === 'credit'

  return (
    <article className="grid gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass(item.category)}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-white">{item.title}</p>
          <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusClass(item.status)}`}>
            {item.status}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs capitalize text-zinc-400">
            {item.category}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span className={isCredit ? 'font-semibold text-emerald-300' : 'font-semibold text-[#ff8ca0]'}>
            {isCredit ? '+' : '-'}{formatAmount(item.amount)}
          </span>
          <span className="text-zinc-600">/</span>
          <span>{formatDate(item.timestamp)}</span>
          <span className="text-zinc-600">/</span>
          <span className="capitalize">{item.source}</span>
        </div>
        <p className="mt-2 break-words text-xs leading-5 text-zinc-500">{item.details || 'No extra details'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        {item.proofUrl ? (
          <button
            type="button"
            onClick={() => onProof(item.proofUrl)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white hover:text-black"
            title="View proof"
          >
            <Eye className="h-4 w-4" />
          </button>
        ) : null}
        {item.copyText ? (
          <button
            type="button"
            onClick={() => onCopy(item.copyText)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white hover:text-black"
            title="Copy details"
          >
            <Copy className="h-4 w-4" />
          </button>
        ) : null}
        {!item.proofUrl && !item.copyText ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-zinc-500">
            <ShieldAlert className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </article>
  )
}

function getSummary(ledger) {
  return ledger.reduce((summary, item) => {
    const amount = Number(item.amount || 0)
    summary.total += 1
    if (item.direction === 'credit') summary.credits += amount
    if (item.direction === 'debit') summary.debits += amount
    if (item.category === 'deposit') summary.deposits += 1
    if (item.category === 'withdrawal') summary.withdrawals += 1
    if (item.category === 'bet') summary.bets += 1
    if (item.category === 'bonus') summary.bonuses += 1
    return summary
  }, {
    total: 0,
    credits: 0,
    debits: 0,
    deposits: 0,
    withdrawals: 0,
    bets: 0,
    bonuses: 0,
  })
}

export default function UserTransactions({ user, ledger = [] }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [proofImage, setProofImage] = useState('')

  const summary = useMemo(() => getSummary(ledger), [ledger])

  const visibleLedger = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    return ledger.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.category === activeFilter
      if (!matchesFilter) return false
      if (!query) return true

      return [
        item.title,
        item.details,
        item.status,
        item.source,
        item.category,
        item.copyText,
        item.searchText,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [activeFilter, ledger, searchValue])

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '')
      toast.success('Copied to clipboard')
    } catch (error) {
      console.log(error)
      toast.error('Unable to copy')
    }
  }

  return (
    <>
      <Head>
        <title>{user?.username ? `${user.username} Transactions` : 'User Transactions'}</title>
      </Head>
      <Toaster position="bottom-center" />

      {proofImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setProofImage('')}>
          <div className="relative max-w-lg rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-[#C61F41] p-2 text-white"
              onClick={() => setProofImage('')}
              aria-label="Close proof"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofImage} alt="Payment proof" className="max-h-[70vh] w-auto rounded-2xl object-contain" />
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1BB6FF]">User Ledger</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{user?.username || 'User not found'}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Deposits, withdrawals, bets, rebates, and bonuses from every available log.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-2xl bg-white/[0.05] px-4 py-3">
                <p className="text-xs text-zinc-600">UID</p>
                <p className="mt-1 truncate text-white">{user?.uid || 'N/A'}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.05] px-4 py-3">
                <p className="text-xs text-zinc-600">Balance</p>
                <p className="mt-1 font-semibold text-[#1BB6FF]">{formatAmount(user?.balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.05] px-4 py-3">
                <p className="text-xs text-zinc-600">Total deposit</p>
                <p className="mt-1 font-semibold text-emerald-300">{formatAmount(user?.totald)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <StatCard label="Total rows" value={summary.total} icon={Wallet} />
          <StatCard label="Credits" value={formatAmount(summary.credits)} icon={ArrowDownLeft} tone="text-emerald-300" />
          <StatCard label="Debits" value={formatAmount(summary.debits)} icon={ArrowUpRight} tone="text-[#ff8ca0]" />
          <StatCard label="Deposits" value={summary.deposits} icon={ArrowDownLeft} tone="text-emerald-300" />
          <StatCard label="Withdrawals" value={summary.withdrawals} icon={ArrowUpRight} tone="text-[#ff8ca0]" />
          <StatCard label="Bets" value={summary.bets} icon={Trophy} tone="text-[#8EE5FF]" />
          <StatCard label="Bonuses" value={summary.bonuses} icon={Gift} tone="text-[#dcb3ff]" />
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto rounded-full bg-white/[0.06] p-1">
              {filters.map((filter) => {
                const active = activeFilter === filter.key
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-white text-black'
                        : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/[0.06] p-1 xl:w-[360px]">
              <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search ledger"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="mr-1 rounded-full px-3 py-2 text-[#ff8ca0]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {visibleLedger.length ? visibleLedger.map((item) => (
              <LedgerRow
                key={item.id}
                item={item}
                onCopy={copyText}
                onProof={setProofImage}
              />
            )) : (
              <div className="rounded-[22px] border border-dashed border-white/10 p-10 text-center">
                <p className="font-semibold text-white">No ledger rows found.</p>
                <p className="mt-2 text-sm text-zinc-500">Try another filter or search term.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function timestampOf(row, fallback) {
  return row.time || row.created_at || fallback || null
}

function notificationTitle(row) {
  if (row.address === 'admin') return 'Admin reward'
  if (row.type === 'deposit') return 'Deposit'
  if (row.type === 'withdraw' || row.type === 'withdrawer') return 'Withdrawal'
  return row.type || 'Transaction'
}

function notificationCategory(row) {
  if (row.address === 'admin') return 'bonus'
  if (row.type === 'withdraw' || row.type === 'withdrawer') return 'withdrawal'
  if (row.type === 'deposit') return 'deposit'
  return 'deposit'
}

function notificationDetails(row) {
  if (row.address === 'admin') return `Reason: ${row.method || 'Admin reward'}`
  if (row.type === 'deposit') {
    return [
      `Method: ${row.method || 'N/A'}`,
      row.adminaddress ? `Admin address: ${row.adminaddress}` : '',
      row.address ? `Proof/reference: ${row.address}` : '',
    ].filter(Boolean).join(' / ')
  }

  return [
    `Method: ${row.method || 'N/A'}`,
    row.bank ? `Bank: ${row.bank}` : '',
    row.accountname ? `Account: ${row.accountname}` : '',
    row.address ? `Address: ${row.address}` : '',
  ].filter(Boolean).join(' / ')
}

function normalizeNotification(row) {
  const category = notificationCategory(row)
  const isWithdrawal = category === 'withdrawal'
  const proofUrl = category === 'deposit' && row.address && row.address !== 'admin' ? row.address : ''
  const copyText = isWithdrawal && row.address ? row.address : ''

  return {
    id: `notification-${row.id || row.uid}`,
    source: 'notification',
    category,
    direction: isWithdrawal ? 'debit' : 'credit',
    amount: Number(row.amount || 0),
    status: normalizeStatus(row.sent),
    timestamp: timestampOf(row),
    title: notificationTitle(row),
    details: notificationDetails(row),
    proofUrl,
    copyText,
    searchText: `${row.method || ''} ${row.bank || ''} ${row.accountname || ''} ${row.adminaddress || ''}`,
  }
}

function betStatus(row) {
  if (row.won === 'true' || row.won === true) return 'won'
  if (row.won === 'false' || row.won === false) return 'lost'
  return 'pending'
}

function normalizeBet(row) {
  return {
    id: `placed-${row.betid || row.id}`,
    source: 'placed',
    category: 'bet',
    direction: 'debit',
    amount: Number(row.stake || 0),
    status: betStatus(row),
    timestamp: timestampOf(row),
    title: `${row.home || 'Home'} vs ${row.away || 'Away'}`,
    details: [
      `Market: ${row.market || 'N/A'}`,
      `Bet ID: ${row.betid || row.id || 'N/A'}`,
      `Odd: ${row.odd || 'N/A'}`,
      `Potential return: ${formatAmount(Number(row.stake || 0) + Number(row.aim || 0))}`,
    ].join(' / '),
    proofUrl: '',
    copyText: row.betid || '',
    searchText: `${row.home || ''} ${row.away || ''} ${row.market || ''} ${row.match_id || ''}`,
  }
}

function activityTitle(row, user) {
  if (row.type === 'rebate' || row.code === 'bet') return 'Bet rebate'
  if (row.type === 'affbonus') return 'Rebate bonus'
  if (row.type === 'depbonus' || row.code === 'firstdepositbonus') {
    return row.code === user.newrefer ? 'Referral deposit bonus' : 'First deposit bonus'
  }
  if (row.type === 'bonus') return 'Bonus'
  if (row.code === 'broadcast') return 'Broadcast bonus'
  return row.type || row.code || 'Bonus activity'
}

function activityDetails(row) {
  return [
    row.code ? `Code: ${row.code}` : '',
    row.type ? `Type: ${row.type}` : '',
    row.username ? `User: ${row.username}` : '',
  ].filter(Boolean).join(' / ')
}

function isDuplicateFinanceActivity(row) {
  return row.code === 'finance' && ['deposit', 'withdraw', 'withdrawal'].includes(String(row.type || '').toLowerCase())
}

function normalizeActivity(row, user) {
  return {
    id: `activa-${row.id}`,
    source: 'activa',
    category: 'bonus',
    direction: 'credit',
    amount: Number(row.amount || 0),
    status: 'success',
    timestamp: timestampOf(row),
    title: activityTitle(row, user),
    details: activityDetails(row),
    proofUrl: '',
    copyText: row.code || '',
    searchText: `${row.code || ''} ${row.type || ''} ${row.username || ''}`,
  }
}

function sortLedger(rows) {
  return rows.sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime()
    const bTime = new Date(b.timestamp || 0).getTime()
    return bTime - aTime
  })
}

async function readUser(supabaseAdmin, uid) {
  const queryUser = (columns) => supabaseAdmin
    .from('users')
    .select(columns)
    .eq('uid', uid)
    .maybeSingle()

  const result = await queryUser('username,newrefer,uid,balance,totald,totalw')
  if (!result.error) return result

  const message = `${result.error.message || ''} ${result.error.details || ''} ${result.error.hint || ''}`.toLowerCase()
  if (result.error.code !== '42703' && !message.includes('totalw')) return result

  return queryUser('username,newrefer,uid,balance,totald')
}

export async function getServerSideProps(context) {
  const uid = String(context.query.id || '').trim()

  try {
    requireAdmin(context.req)

    if (!uid) {
      return { props: { user: null, ledger: [] } }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: user, error: userError } = await readUser(supabaseAdmin, uid)

    if (userError) throw userError
    if (!user) {
      return { props: { user: null, ledger: [] } }
    }

    const [notificationsResult, betsResult, activitiesResult] = await Promise.all([
      supabaseAdmin
        .from('notification')
        .select('*')
        .eq('username', user.username)
        .order('id', { ascending: false }),
      supabaseAdmin
        .from('placed')
        .select('*')
        .eq('username', user.username)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('activa')
        .select('*')
        .or(`username.eq.${user.username},code.eq.${user.newrefer}`)
        .order('id', { ascending: false }),
    ])

    if (notificationsResult.error) throw notificationsResult.error
    if (betsResult.error) throw betsResult.error
    if (activitiesResult.error) throw activitiesResult.error

    const ledger = sortLedger([
      ...(notificationsResult.data || []).map(normalizeNotification),
      ...(betsResult.data || []).map(normalizeBet),
      ...(activitiesResult.data || [])
        .filter((item) => !isDuplicateFinanceActivity(item))
        .map((item) => normalizeActivity(item, user)),
    ])

    return {
      props: {
        user,
        ledger,
      },
    }
  } catch (error) {
    if (error.statusCode === 401) {
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent(uid ? `/admin/transaction?id=${uid}` : '/admin/transaction')}`,
          permanent: false,
        },
      }
    }

    console.error('Admin transaction ledger error:', error)
    return {
      props: {
        user: null,
        ledger: [],
      },
    }
  }
}
