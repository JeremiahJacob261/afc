import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  Clipboard,
  GitBranch,
  KeyRound,
  LogIn,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  User,
  Wallet,
  X,
} from 'lucide-react'
import codes from '@/pages/api/codes.json'
import { supabase } from '@/pages/api/supabase'
import { clearLegacyAuthStorage } from '@/lib/clientAuth'

function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-full bg-white/[0.08] ${className}`} />
}

function UserDetailSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
      <section className="rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-3xl bg-white/[0.08]" />
          <div className="flex-1 space-y-3">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-8 w-56" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
              <SkeletonLine className="h-3 w-20" />
              <SkeletonLine className="mt-4 h-5 w-36" />
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
        <SkeletonLine className="h-5 w-32" />
        <div className="mt-5 grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-3xl bg-white/[0.06]" />
          ))}
        </div>
      </aside>
    </div>
  )
}

function formatNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toFixed(2) : '0.00'
}

function countryName(countryCode) {
  return codes.countries?.find((country) => country.code === countryCode)?.name || countryCode || 'Unknown'
}

function StatCard({ label, value, icon: Icon, tone = 'text-[#1BB6FF]' }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
          <p className="mt-3 truncate text-lg font-semibold text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  )
}

function ActionButton({ label, description, icon: Icon, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${danger
        ? 'border-[#C61F41]/25 bg-[#C61F41]/10 hover:bg-[#C61F41]/20'
        : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.1]'
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? 'bg-[#C61F41]/15 text-[#ff8ca0]' : 'bg-white/[0.08] text-[#1BB6FF]'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className={`h-4 w-4 ${danger ? 'text-[#ff8ca0]' : 'text-zinc-500 group-hover:text-white'}`} />
      </div>
      <p className="mt-4 font-semibold text-white">{label}</p>
      <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p>
    </button>
  )
}

export default function UserDetailModal() {
  const router = useRouter()
  const [datas, setDatas] = useState(null)
  const [referusers, setReferusers] = useState(0)
  const [bets, setBets] = useState([])
  const [wonbet, setWonbet] = useState([])
  const [lostbet, setLostbet] = useState([])
  const [referredby, setReferredby] = useState(null)
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState('')
  const [editbal, setEditbal] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [newRefer, setNewRefer] = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [credentialOpen, setCredentialOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPin, setNewPin] = useState('')
  const [credentialSaving, setCredentialSaving] = useState(null)

  const uid = useMemo(() => {
    if (!router.query?.id) return ''
    return String(router.query.id)
  }, [router.query?.id])

  useEffect(() => {
    if (!uid) return

    let active = true
    async function run() {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/user-detail?uid=${encodeURIComponent(uid)}`)
        const result = await response.json()
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin')
            return
          }
          throw new Error(result.message || 'Unable to load user')
        }

        if (!active) return
        setDatas(result.user)
        setReferusers(result.referusers)
        setBets(result.bets || [])
        setWonbet(result.wonbet || [])
        setLostbet(result.lostbet || [])
        setReferredby(result.referredby)
        setBalance(result.user?.balance ?? '')
      } catch (error) {
        console.log(error)
        toast.error(error.message || 'Unable to load user')
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [uid, router])

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text || '')
      toast.success(message)
    } catch (error) {
      console.log(error)
      toast.error('Unable to copy')
    }
  }

  const updateBalance = async () => {
    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-balance',
          username: datas?.username,
          newBalance: parseFloat(balance),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Balance update failed')
      setDatas((current) => ({ ...current, balance: parseFloat(balance) }))
      setEditbal(false)
      toast.success('Balance updated')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'An error occurred')
    }
  }

  const deleteUserWallet = async () => {
    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-wallet', username: datas?.username, uid: datas?.uid }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Wallet delete failed')
      toast.success(result.message || 'Wallet deleted successfully')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'An error occurred')
    }
  }

  const switchReferral = async () => {
    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch-referral',
          currentRefer: datas?.newrefer,
          newRefer,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Referral switch failed')
      setDatas((current) => ({ ...current, refer: newRefer }))
      setSwitchOpen(false)
      setNewRefer('')
      toast.success('Referral switched successfully')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Error occurred')
    }
  }

  const loginAsUser = async () => {
    if (!datas?.uid || impersonating) return

    const confirmed = window.confirm(`Login as ${datas.username}? This browser will switch to the user's account.`)
    if (!confirmed) return

    setImpersonating(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: datas.uid }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error(result.message || 'Login-as-user failed')
      }

      if (!result?.session?.access_token || !result?.session?.refresh_token) {
        throw new Error('Login-as-user did not return a valid session')
      }

      clearLegacyAuthStorage()

      const { error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      })

      if (error) throw error

      toast.success(`Signed in as ${datas.username}`)
      router.push('/user')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Unable to login as user')
      setImpersonating(false)
    }
  }

  const resetPassword = async () => {
    const password = newPassword.replace(/\s/g, '')
    if (!datas?.userid) {
      toast.error('Missing Supabase user id')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const confirmed = window.confirm(`Reset ${datas.username}'s login password?`)
    if (!confirmed) return

    setCredentialSaving('password')
    try {
      const response = await fetch('/api/admin/auth-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: datas.userid, password }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error(result.message || 'Password reset failed')
      }

      setDatas((current) => ({ ...current, password }))
      setNewPassword('')
      toast.success('Password reset')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Password reset failed')
    } finally {
      setCredentialSaving(null)
    }
  }

  const resetPin = async () => {
    const pin = newPin.trim()
    if (!datas?.userid) {
      toast.error('Missing Supabase user id')
      return
    }

    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must be 4 digits')
      return
    }

    const confirmed = window.confirm(`Reset ${datas.username}'s transaction PIN?`)
    if (!confirmed) return

    setCredentialSaving('pin')
    try {
      const response = await fetch('/api/admin/user-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: datas.userid, pin }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error(result.message || 'PIN reset failed')
      }

      setDatas((current) => ({ ...current, pin, codeset: true }))
      setNewPin('')
      toast.success('Transaction PIN reset')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'PIN reset failed')
    } finally {
      setCredentialSaving(null)
    }
  }

  const close = () => {
    if (window.history.length > 1) router.back()
    else router.push('/admin/users')
  }

  return (
    <>
      <Head>
        <title>{datas?.username ? `${datas.username} - User Detail` : 'User Detail'}</title>
      </Head>
      <Toaster position="bottom-center" />

      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-3 py-5 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(27,182,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(185,108,255,0.26),transparent_30%)]" />

        <div className="relative mx-auto flex min-h-full max-w-6xl items-center justify-center">
          <section className="relative w-full overflow-hidden rounded-[34px] border border-white/20 bg-[#111111]/72 p-4 text-white shadow-[0_32px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-5 lg:p-6">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1BB6FF]">Floating User Profile</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {loading ? 'Loading user...' : datas?.username || 'User not found'}
                </h1>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-zinc-300 transition hover:bg-white hover:text-black"
                aria-label="Close user detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <UserDetailSkeleton />
            ) : !datas ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-10 text-center">
                <p className="text-lg font-semibold text-white">Unable to load this user.</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
                >
                  Back to users
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
                <section className="rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1BB6FF] to-[#B96CFF] text-2xl font-bold text-black">
                        {datas.username?.slice(0, 1)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-500">{datas.email || 'No email'}</p>
                        <p className="truncate text-2xl font-semibold text-white">{datas.username}</p>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                      {datas.firstd ? 'Active' : 'Not active'}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => copyText(datas.uid, 'UID copied')}
                      className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:bg-white/[0.1]"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">UID</p>
                      <p className="mt-3 truncate text-lg font-semibold text-white">{datas.uid}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(datas.newrefer, 'Referral code copied')}
                      className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:bg-white/[0.1]"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Referral Code</p>
                      <p className="mt-3 truncate text-lg font-semibold text-white">{datas.newrefer}</p>
                    </button>
                    <StatCard label="Password" value={datas.password || 'N/A'} icon={KeyRound} tone="text-[#B96CFF]" />
                    <StatCard label="Transaction PIN" value={datas.codeset ? (datas.pin || 'Set') : 'Not set'} icon={Shield} tone="text-emerald-300" />
                    <StatCard label="Country" value={countryName(datas.countrycode)} icon={User} />
                    <StatCard label="Phone" value={`${datas.countrycode || ''}${datas.phone || ''}`} icon={Clipboard} />
                    <StatCard label="Referred Users" value={referusers} icon={GitBranch} tone="text-emerald-300" />
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Balance</p>
                        {editbal ? (
                          <input
                            type="number"
                            value={balance}
                            onChange={(event) => setBalance(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-[#1BB6FF] sm:w-44"
                          />
                        ) : (
                          <p className="mt-2 text-2xl font-semibold text-[#1BB6FF]">{formatNumber(datas.balance)} USDT</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editbal && (
                          <button
                            type="button"
                            onClick={updateBalance}
                            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
                          >
                            Save
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditbal((value) => !value)}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 transition hover:bg-white hover:text-black"
                          aria-label="Edit balance"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StatCard label="Bets Placed" value={bets.length || 0} icon={Trophy} />
                    <StatCard label="Bets Won" value={wonbet.length || 0} icon={BadgeDollarSign} tone="text-emerald-300" />
                    <StatCard label="Bets Lost" value={lostbet.length || 0} icon={Shield} tone="text-[#ff8ca0]" />
                    <StatCard label="Total Deposits" value={`$${formatNumber(datas.totald)}`} icon={Wallet} tone="text-[#B96CFF]" />
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Referred By</p>
                        <p className="mt-2 text-lg font-semibold text-white">{datas.refer || 'None'} <span className="text-zinc-500">/</span> {referredby || 'None'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSwitchOpen(true)}
                        className="rounded-full border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
                      >
                        Switch referral
                      </button>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Admin Actions</p>
                      <p className="text-xs text-zinc-500">Open linked user workflows</p>
                    </div>
                    <Activity className="h-5 w-5 text-[#1BB6FF]" />
                  </div>

                  <div className="mt-5 grid gap-3">
                    <ActionButton
                      label={impersonating ? 'Signing in...' : 'Login as user'}
                      description="Open this account using a full user session."
                      icon={LogIn}
                      onClick={loginAsUser}
                      disabled={impersonating}
                    />
                    <ActionButton
                      label="Reset Credentials"
                      description="Change login password or transaction PIN."
                      icon={KeyRound}
                      onClick={() => setCredentialOpen(true)}
                    />
                    <ActionButton
                      label="Referral"
                      description="View the user's referral tree."
                      icon={GitBranch}
                      onClick={() => router.push(`/admin/referral/${datas.newrefer}`)}
                    />
                    <ActionButton
                      label="Reward"
                      description="Send reward funds to this user."
                      icon={BadgeDollarSign}
                      onClick={() => router.push(`/admin/reward?id=${datas.uid}`)}
                    />
                    <ActionButton
                      label="Bets"
                      description="Review bets linked to this user."
                      icon={Trophy}
                      onClick={() => router.push(`/admin/bet?id=${datas.uid}`)}
                    />
                    <ActionButton
                      label="Security"
                      description="Open security tools for this account."
                      icon={Shield}
                      onClick={() => router.push(`/admin/security?id=${datas.uid}`)}
                    />
                    <ActionButton
                      label="Transactions"
                      description="View deposits, withdrawals, and admin gifts."
                      icon={Wallet}
                      onClick={() => router.push(`/admin/transaction?id=${datas.uid}`)}
                    />
                    <ActionButton
                      label="Activities"
                      description="Inspect bets, wallet activity, referrals, and bonuses."
                      icon={Activity}
                      onClick={() => router.push(`/admin/activities?id=${datas.uid}`)}
                    />
                    <ActionButton
                      label="Delete Wallet"
                      description="Remove this user's bound wallet record."
                      icon={Trash2}
                      onClick={deleteUserWallet}
                      danger
                    />
                  </div>
                </aside>
              </div>
            )}
          </section>
        </div>
      </div>

      {switchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[30px] border border-white/20 bg-[#161616]/85 p-5 text-white shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1BB6FF]">Switch Referral</p>
                <h2 className="mt-1 text-xl font-semibold">Move {datas?.username}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSwitchOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 hover:bg-white hover:text-black"
                aria-label="Close referral dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              Enter the referral code of the new upline.
            </p>
            <input
              value={newRefer}
              onChange={(event) => setNewRefer(event.target.value)}
              placeholder="New referral code"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#1BB6FF]"
            />
            <button
              type="button"
              onClick={switchReferral}
              className="mt-4 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
            >
              Switch referral
            </button>
          </div>
        </div>
      )}

      {credentialOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[30px] border border-white/20 bg-[#161616]/85 p-5 text-white shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1BB6FF]">Credential Reset</p>
                <h2 className="mt-1 text-xl font-semibold">{datas?.username}</h2>
              </div>
              <button
                type="button"
                onClick={() => setCredentialOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 hover:bg-white hover:text-black"
                aria-label="Close credential dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-[#B96CFF]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Login Password</p>
                    <p className="text-xs text-zinc-500">Current: {datas?.password || 'N/A'}</p>
                  </div>
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value.replace(/\s/g, ''))}
                  placeholder="New password"
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                />
                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={credentialSaving !== null}
                  className="mt-3 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {credentialSaving === 'password' ? 'Resetting password...' : 'Reset password'}
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-emerald-300">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Transaction PIN</p>
                    <p className="text-xs text-zinc-500">Current: {datas?.codeset ? (datas?.pin || 'Set') : 'Not set'}</p>
                  </div>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                />
                <button
                  type="button"
                  onClick={resetPin}
                  disabled={credentialSaving !== null}
                  className="mt-3 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {credentialSaving === 'pin' ? 'Resetting PIN...' : 'Reset PIN'}
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
