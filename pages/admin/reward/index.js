import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowRight, BadgeDollarSign, Bell, Check, LockKeyhole, ReceiptText, UserRound, Wallet } from 'lucide-react'
import { supabase } from '@/pages/api/supabase'

function formatAmount(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toFixed(2) : '0.00'
}

function getRewardErrorMessage(result, response) {
  const message = result?.message || result?.error?.message || result?.error || response.statusText || 'Reward failed'
  const status = result?.statusCode || response.status
  return status ? `${message} (${status})` : message
}

export default function Reward({ id = '', uid = '' }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [checked, setChecked] = useState(true)
  const [loading, setLoading] = useState(false)

  const amountValue = Number(amount)
  const isValidAmount = amount.trim() && Number.isFinite(amountValue) && amountValue > 0

  const submitReward = async (event) => {
    event.preventDefault()

    if (!id) {
      toast.error('No reward recipient was found')
      return
    }
    if (!isValidAmount) {
      toast.error('Enter a reward amount greater than 0')
      return
    }
    if (!reason.trim()) {
      toast.error('Enter a reason for this reward')
      return
    }
    if (!password.trim()) {
      toast.error('Enter the admin password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reward: amount,
          reason,
          password,
          id,
          checked,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(getRewardErrorMessage(result, response))
      }

      toast.success('Successfully rewarded')
      setAmount('')
      setReason('')
      setPassword('')
      router.push('/admin/users')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Unable to send reward')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Reward</title>
      </Head>
      <Toaster position="bottom-center" />

      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#151515]">
          <div className="flex flex-col gap-5 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1BB6FF]/10 text-[#8EE5FF]">
                <BadgeDollarSign className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1BB6FF]">Balance Reward</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Send user funds</h2>
                <p className="mt-1 text-sm text-zinc-500">Credit a selected account and optionally create a reward notification.</p>
              </div>
            </div>

            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              Single-user flow
            </div>
          </div>

          {id ? (
            <div className="grid gap-4 p-5 lg:grid-cols-[0.82fr_1.18fr]">
              <aside className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1BB6FF] to-[#B96CFF] text-lg font-bold text-black">
                      {id.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Recipient</p>
                      <p className="truncate text-xl font-semibold text-white">{id}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <UserRound className="h-4 w-4 text-[#1BB6FF]" />
                      <span className="truncate">{uid || 'UID unavailable'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <article className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-500">Reward amount</p>
                      <Wallet className="h-4 w-4 text-[#B96CFF]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{formatAmount(amount)} USDT</p>
                  </article>
                  <article className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-500">Notification</p>
                      <Bell className="h-4 w-4 text-[#1BB6FF]" />
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">{checked ? 'Included' : 'Skipped'}</p>
                  </article>
                </div>
              </aside>

              <form onSubmit={submitReward} className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Reward Details</h3>
                    <p className="text-sm text-zinc-500">Confirm the amount, reason, and admin password.</p>
                  </div>
                  <ReceiptText className="h-5 w-5 shrink-0 text-[#1BB6FF]" />
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">Amount</span>
                    <div className="mt-2 flex min-h-[52px] items-center rounded-2xl border border-white/10 bg-black/25 px-4 transition focus-within:border-[#1BB6FF]">
                      <input
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-zinc-700"
                      />
                      <span className="shrink-0 text-sm font-semibold text-zinc-500">USDT</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">Reason</span>
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={4}
                      placeholder="Reason for reward"
                      className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#1BB6FF] placeholder:text-zinc-700"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">Admin Password</span>
                    <div className="mt-2 flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 transition focus-within:border-[#1BB6FF]">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type="password"
                        placeholder="Enter admin password"
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
                      />
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <span>
                      <span className="block text-sm font-semibold text-white">Include reason notification</span>
                      <span className="mt-1 block text-xs text-zinc-500">Create a user notification using the reward reason.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => setChecked(event.target.checked)}
                      className="sr-only"
                    />
                    <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? 'bg-[#1BB6FF]' : 'bg-white/[0.12]'}`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-black transition ${checked ? 'translate-x-6' : 'translate-x-0'}`}>
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/users')}
                    className="h-12 rounded-full border border-white/10 px-5 text-sm font-semibold text-zinc-300 transition hover:bg-white hover:text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#8EE5FF] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  >
                    {loading ? 'Sending reward' : 'Submit reward'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-5">
              <div className="rounded-[22px] border border-[#ff8ca0]/20 bg-[#C61F41]/10 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C61F41]/15 text-[#ff8ca0]">
                  <UserRound className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">User not found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  This reward page needs a valid user id from the admin user profile.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#8EE5FF]"
                >
                  Back to users
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const uid = context.query.id ? String(context.query.id) : ''

  if (!uid) {
    return {
      props: {
        id: '',
        uid: '',
      },
    }
  }

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('uid', uid)
    .limit(1)

  if (error) {
    console.log(error)
  }

  return {
    props: {
      id: data?.[0]?.username || '',
      uid,
    },
  }
}
