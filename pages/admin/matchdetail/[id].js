import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast, Toaster } from 'react-hot-toast'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import { supabase } from '@/pages/api/supabase'
import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const marketGroups = [
  {
    title: 'Home Scores',
    markets: [
      { key: 'onenil', label: '1 - 0' },
      { key: 'twonil', label: '2 - 0' },
      { key: 'threenil', label: '3 - 0' },
      { key: 'twoone', label: '2 - 1' },
      { key: 'threeone', label: '3 - 1' },
      { key: 'threetwo', label: '3 - 2' },
    ],
  },
  {
    title: 'Away Scores',
    markets: [
      { key: 'nilone', label: '0 - 1' },
      { key: 'niltwo', label: '0 - 2' },
      { key: 'nilthree', label: '0 - 3' },
      { key: 'onetwo', label: '1 - 2' },
      { key: 'onethree', label: '1 - 3' },
      { key: 'twothree', label: '2 - 3' },
    ],
  },
  {
    title: 'Draw And Other',
    markets: [
      { key: 'nilnil', label: '0 - 0' },
      { key: 'oneone', label: '1 - 1' },
      { key: 'twotwo', label: '2 - 2' },
      { key: 'threethree', label: '3 - 3' },
      { key: 'otherscores', label: 'Other' },
    ],
  },
]

const marketLabels = marketGroups
  .flatMap((group) => group.markets)
  .reduce((acc, market) => ({ ...acc, [market.key]: market.label }), {})

function money(value) {
  const number = Number(value || 0)
  return `${number.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`
}

function compactDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusFor(match) {
  if (match?.verified) return { label: 'Settled', tone: 'emerald' }

  const startsAt = Number(match?.tsgmt) || Date.parse(`${match?.date || ''} ${match?.time || ''}`)
  if (startsAt && startsAt > Date.now()) return { label: 'Upcoming', tone: 'cyan' }
  if (startsAt && startsAt <= Date.now()) return { label: 'Ready to settle', tone: 'amber' }

  return { label: 'Open', tone: 'zinc' }
}

function statusClass(tone) {
  const classes = {
    emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
    cyan: 'bg-[#1BB6FF]/10 text-[#8EE5FF] ring-[#1BB6FF]/20',
    amber: 'bg-amber-400/10 text-amber-200 ring-amber-400/20',
    red: 'bg-red-400/10 text-red-200 ring-red-400/20',
    zinc: 'bg-white/[0.06] text-zinc-300 ring-white/10',
  }
  return classes[tone] || classes.zinc
}

function resultLabel(value) {
  if (value === 'true' || value === true) return { label: 'Won', tone: 'emerald' }
  if (value === 'false' || value === false) return { label: 'Lost', tone: 'red' }
  return { label: 'Pending', tone: 'amber' }
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#151515] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-[#1BB6FF]">
          <Icon className="h-5 w-5" />
        </div>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      </div>
      <p className="mt-5 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

export default function MatchDetail({ datas = {}, mist = [] }) {
  const router = useRouter()
  const match = datas || {}
  const bets = useMemo(() => (Array.isArray(mist) ? mist : []), [mist])
  const [drop, setDrop] = useState(false)
  const [editingMarket, setEditingMarket] = useState(null)
  const [oddValue, setOddValue] = useState('')
  const [score, setScore] = useState({ home: '', away: '' })

  const status = statusFor(match)
  const startsAt = match.tsgmt ? compactDate(Number(match.tsgmt)) : compactDate(`${match.date || ''} ${match.time || ''}`)

  const totals = useMemo(() => {
    return bets.reduce(
      (acc, bet) => {
        const stake = Number(bet.stake || 0)
        const payout = Number(bet.aim || 0) + stake
        acc.stake += stake
        acc.payout += payout
        acc.profit += Number(bet.profit || 0)
        if (bet.won === 'true' || bet.won === true) acc.won += 1
        if (bet.won === 'false' || bet.won === false) acc.lost += 1
        return acc
      },
      { stake: 0, payout: 0, profit: 0, won: 0, lost: 0 }
    )
  }, [bets])

  const marketSummary = useMemo(() => {
    const summary = bets.reduce((acc, bet) => {
      const key = bet.market || 'Unknown'
      if (!acc[key]) acc[key] = { market: key, count: 0, stake: 0, payout: 0 }
      acc[key].count += 1
      acc[key].stake += Number(bet.stake || 0)
      acc[key].payout += Number(bet.aim || 0) + Number(bet.stake || 0)
      return acc
    }, {})

    return Object.values(summary).sort((a, b) => b.stake - a.stake)
  }, [bets])

  const openEdit = (market) => {
    setEditingMarket(market)
    setOddValue(match[market.key] ?? '')
  }

  const updateOdd = async () => {
    if (!editingMarket) return
    if (String(oddValue).trim() === '') {
      toast.error('Please enter an odd value')
      return
    }

    setDrop(true)
    const { error } = await supabase
      .from('bets')
      .update({ [editingMarket.key]: oddValue })
      .eq('match_id', match.match_id)

    setDrop(false)
    if (error) {
      toast.error(error.message || 'Unable to update odd')
      return
    }

    toast.success('Odd updated')
    setEditingMarket(null)
    router.replace(router.asPath)
  }

  const settleMatch = async () => {
    if (score.home === '' || score.away === '') {
      toast.error('Enter the final score')
      return
    }

    setDrop(true)
    try {
      const response = await fetch('/api/inputscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home: score.home,
          away: score.away,
          matchid: match.match_id,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Unable to settle match')
      }

      const summary = result.summary
      toast.success(summary ? `Settled: ${summary.won} won, ${summary.lost} lost, ${summary.refunded} refunded` : 'Match settled')
      router.push('/admin/match')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDrop(false)
    }
  }

  if (!match?.match_id) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-200" />
        <p className="mt-3 text-sm text-zinc-400">This match could not be found.</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{match.home} vs {match.away} | Match Detail</title>
      </Head>
      <Toaster position="bottom-center" />
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={drop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <div className="space-y-5">
        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#151515]">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass(status.tone)}`}>
                    {status.label}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-white/10">
                    Match ID: {match.match_id}
                  </span>
                  {match.company ? (
                    <span className="rounded-full bg-[#B96CFF]/15 px-3 py-1 text-xs font-semibold text-[#dcb3ff] ring-1 ring-[#B96CFF]/20">
                      Company Game
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 truncate text-sm text-zinc-500">{match.league || 'League not set'}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {match.home || 'Home'} vs {match.away || 'Away'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => router.push('/admin/match')}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white hover:text-black"
              >
                Back to markets
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="min-w-0 rounded-[20px] bg-white/[0.04] p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.ihome || '/ball.png'} alt={match.home || 'Home'} className="mx-auto h-20 w-20 rounded-full object-contain" />
              <p className="mt-4 truncate text-lg font-semibold text-white">{match.home || 'Home'}</p>
            </div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1BB6FF] text-sm font-black text-black shadow-[0_0_34px_rgba(27,182,255,0.24)]">
              VS
            </div>
            <div className="min-w-0 rounded-[20px] bg-white/[0.04] p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.iaway || '/ball.png'} alt={match.away || 'Away'} className="mx-auto h-20 w-20 rounded-full object-contain" />
              <p className="mt-4 truncate text-lg font-semibold text-white">{match.away || 'Away'}</p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 p-4 text-sm text-zinc-400 sm:grid-cols-3 sm:p-5">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#1BB6FF]" />
              {startsAt}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#1BB6FF]" />
              Result: {match.results || 'Not settled'}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#1BB6FF]" />
              Live: {match.live ? 'Yes' : 'No'}
            </span>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Placed Bets" value={bets.length} />
          <StatCard icon={CircleDollarSign} label="Total Stake" value={money(totals.stake)} />
          <StatCard icon={Trophy} label="Max Payout" value={money(totals.payout)} />
          <StatCard icon={CheckCircle2} label="Settled Bets" value={totals.won + totals.lost} hint={`${totals.won} won / ${totals.lost} lost`} />
        </section>

        {!match.verified ? (
          <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Settle Match</h3>
                <p className="text-sm text-zinc-500">Enter final scores once the match has ended.</p>
              </div>
              {match.company ? (
                <span className="rounded-full bg-[#B96CFF]/15 px-3 py-1 text-xs font-semibold text-[#dcb3ff]">
                  Protected market: {match.comarket || 'Not set'}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{match.home} score</span>
                <input
                  type="number"
                  min="0"
                  value={score.home}
                  onChange={(event) => setScore((current) => ({ ...current, home: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{match.away} score</span>
                <input
                  type="number"
                  min="0"
                  value={score.away}
                  onChange={(event) => setScore((current) => ({ ...current, away: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                  placeholder="0"
                />
              </label>
              <button
                type="button"
                onClick={settleMatch}
                className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#1BB6FF] md:self-end"
              >
                Submit Result
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            {marketGroups.map((group) => (
              <div key={group.title} className="rounded-[24px] border border-white/10 bg-[#151515] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                  <span className="text-xs text-zinc-500">Tap a market to edit</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.markets.map((market) => (
                    <button
                      key={market.key}
                      type="button"
                      onClick={() => openEdit(market)}
                      className="flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left transition hover:border-[#1BB6FF]/50 hover:bg-[#202020]"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-white">{market.label}</span>
                        <span className="mt-1 block text-xs text-zinc-500">{market.key}</span>
                      </span>
                      <span className="flex items-center gap-2 rounded-full bg-[#1BB6FF]/10 px-3 py-1 text-sm font-semibold text-[#8EE5FF]">
                        {match[market.key] ?? '-'}
                        <Edit3 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[#151515] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1BB6FF]" />
                <h3 className="text-lg font-semibold text-white">Market Exposure</h3>
              </div>
              <div className="space-y-3">
                {marketSummary.length ? marketSummary.slice(0, 8).map((item) => (
                  <div key={item.market} className="rounded-2xl bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white">{marketLabels[item.market] || item.market}</p>
                      <span className="text-xs text-zinc-500">{item.count} bets</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>Stake {money(item.stake)}</span>
                      <span>Payout {money(item.payout)}</span>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                    No exposure yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#151515] p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-white">Recent Bettors</h3>
              <div className="mt-4 space-y-3">
                {bets.length ? bets.slice(0, 10).map((bet) => {
                  const result = resultLabel(bet.won)
                  return (
                    <div key={bet.id || bet.betid} className="rounded-2xl bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white">{bet.username || 'Unknown user'}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(result.tone)}`}>
                          {result.label}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-zinc-500">
                        <span>{bet.market || 'Market'} at {bet.odd || '-'} odd</span>
                        <span>Stake {money(bet.stake)} | Returns {money(Number(bet.aim || 0) + Number(bet.stake || 0))}</span>
                        <span>{compactDate(bet.created_at)}</span>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                    No bets have been placed on this match.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {editingMarket ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#151515] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-500">Edit odd</p>
                <h3 className="text-xl font-semibold text-white">{editingMarket.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMarket(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition hover:bg-white hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Odd value</span>
              <input
                value={oddValue}
                onChange={(event) => setOddValue(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                placeholder="1.90"
              />
            </label>
            <button
              type="button"
              onClick={updateOdd}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
            >
              Update Odd
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export async function getServerSideProps(context) {
  const id = context.params.id

  try {
    requireAdmin(context.req)
    const admin = getSupabaseAdmin()

    const [{ data: match, error: matchError }, { data: placed, error: placedError }] = await Promise.all([
      admin.from('bets').select('*').eq('match_id', id).maybeSingle(),
      admin.from('placed').select('*').eq('match_id', id).order('created_at', { ascending: false }),
    ])

    if (matchError) throw matchError
    if (placedError) throw placedError

    return {
      props: {
        datas: match || {},
        mist: placed || [],
      },
    }
  } catch (error) {
    if (error.statusCode === 401) {
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent(`/admin/matchdetail/${id}`)}`,
          permanent: false,
        },
      }
    }

    console.log(error)
    return {
      props: {
        datas: {},
        mist: [],
      },
    }
  }
}
