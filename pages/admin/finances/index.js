import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import LoadingBar from 'react-top-loading-bar'
import {
  Check,
  Copy,
  Eye,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import logoPKR from '@/public/pkr.png'
import logoUsdt from '@/public/tether.png'
import BCA from '@/public/bca.jpg'

const rates = {
  mmk: 5000,
  usdt: 1,
  idr: 16500,
  ngn: 1500,
  fcfa: 600,
  pkr: 280,
  kes: 130,
}

function getStatus(sent) {
  if (sent === true || sent === 'true' || sent === 'success' || sent === 'completed') return 'success'
  if (sent === false || sent === 'false' || sent === 'failed') return 'failed'
  if (sent === 'processing') return 'processing'
  return 'pending'
}

function statusClass(status) {
  if (status === 'success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
  if (status === 'failed') return 'border-[#C61F41]/30 bg-[#C61F41]/15 text-[#ff8ca0]'
  if (status === 'processing') return 'border-[#B96CFF]/30 bg-[#B96CFF]/15 text-[#dcb3ff]'
  return 'border-[#1BB6FF]/25 bg-[#1BB6FF]/10 text-[#8EE5FF]'
}

function formatDate(value) {
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

function formatAmount(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toFixed(3) : '0.000'
}

function methodLogo(method) {
  if (method === 'idr' || method === 'bca') return BCA
  if (method === 'pBkr' || method === 'pkr') return logoPKR
  return logoUsdt
}

function convertedAmount(data) {
  const method = data.method || 'usdt'
  const rate = rates[method] || 1
  const amount = Number(data.amount || 0)
  if (data.type !== 'deposit') return `${formatAmount(amount * rate)} ${method.toUpperCase()}`
  if (method === 'usdt') return `${formatAmount(amount)} USDT`
  return `${formatAmount(amount / rate)} USDT`
}

export default function Finances() {
  const ref = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [allNotifications, setAllNotifications] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [proofImage, setProofImage] = useState('')

  const fetchNotifications = async (find = '') => {
    ref.current?.continuousStart()
    try {
      const response = await fetch(find ? '/api/admin/finances' : '/api/admin/finances', {
        method: find ? 'POST' : 'GET',
        headers: find ? { 'Content-Type': 'application/json' } : undefined,
        body: find ? JSON.stringify({ find }) : undefined,
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) window.location.href = '/admin'
        toast.error(data.message || 'Unable to load transactions')
        return
      }
      setNotifications(data || [])
      if (!find) setAllNotifications(data || [])
    } catch (error) {
      console.log(error)
      toast.error('Unable to load transactions')
    } finally {
      ref.current?.complete()
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const runFinanceAction = async (transaction, action) => {
    const transactionId = transaction.id ?? transaction.uid
    if (!transactionId) {
      toast.error('Transaction ID is missing')
      return
    }

    ref.current?.continuousStart()
    try {
      const response = await fetch('/api/admin/finance-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transaction.id, uid: transaction.uid, action }),
      })
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) window.location.href = '/admin'
        toast.error(result.message || 'Unable to process transaction')
        return
      }

      await fetchNotifications(searchValue.trim())
      if (result.warning) {
        toast.success(result.warning)
      } else {
        toast.success(action === 'approve' ? 'Transaction confirmed' : 'Transaction cancelled')
      }
    } catch (error) {
      console.log(error)
      toast.error('Unknown error occurred, please try again')
    } finally {
      ref.current?.complete()
    }
  }

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setNotifications(allNotifications)
      return
    }
    fetchNotifications(searchValue.trim())
  }

  const clearSearch = () => {
    setSearchValue('')
    setNotifications(allNotifications)
  }

  const pendingCount = notifications.filter((item) => getStatus(item.sent) === 'pending').length
  const deposits = notifications.filter((item) => item.type === 'deposit').length
  const withdrawals = notifications.filter((item) => item.type !== 'deposit').length

  return (
    <>
      <Head>
        <title>Admin Finance</title>
      </Head>
      <Toaster position="bottom-center" />
      <LoadingBar color="#1BB6FF" ref={ref} height={3} />

      {proofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setProofImage('')}>
          <div className="relative max-w-lg rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-[#C61F41] p-2 text-white"
              onClick={() => setProofImage('')}
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofImage} alt="Payment proof" className="max-h-[70vh] w-auto rounded-2xl object-contain" />
          </div>
        </div>
      )}

      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <p className="text-sm text-zinc-500">Pending review</p>
            <p className="mt-3 text-3xl font-semibold text-white">{pendingCount}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <p className="text-sm text-zinc-500">Deposit rows</p>
            <p className="mt-3 text-3xl font-semibold text-[#1BB6FF]">{deposits}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <p className="text-sm text-zinc-500">Withdrawal rows</p>
            <p className="mt-3 text-3xl font-semibold text-[#B96CFF]">{withdrawals}</p>
          </article>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Finance Queue</h2>
              <p className="text-sm text-zinc-500">Approve deposits, settle withdrawals, and inspect payment proofs.</p>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/[0.06] p-1">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch()
                }}
                placeholder="Search username"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <button type="button" onClick={handleSearch} className="rounded-full bg-white px-3 py-2 text-black">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" onClick={clearSearch} className="rounded-full px-3 py-2 text-[#ff8ca0]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {notifications.length ? notifications.map((data) => {
              const status = getStatus(data.sent)
              const isDeposit = data.type === 'deposit'
              const addressText = isDeposit
                ? `Admin address: ${data.adminaddress || 'N/A'}`
                : data.method !== 'usdt'
                  ? `${data.bank || 'Bank'} · ${data.accountname || 'Account'} · ${data.address || 'N/A'}`
                  : data.address || 'No wallet address'

              return (
                <article key={data.id || data.uid} className="grid gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDeposit ? 'bg-emerald-400/10 text-emerald-300' : 'bg-[#C61F41]/15 text-[#ff8ca0]'}`}>
                    {isDeposit ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{data.username || 'Unknown user'}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusClass(status)}`}>{status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                      <Image src={methodLogo(data.method)} width={24} height={20} alt={data.method || 'method'} className="rounded bg-white p-0.5" />
                      <span>{formatAmount(data.amount)} {isDeposit ? String(data.method || 'USDT').toUpperCase() : 'USDT'}</span>
                      <span className="text-zinc-600">/</span>
                      <span>{convertedAmount(data)}</span>
                      <span className="text-zinc-600">/</span>
                      <span>{formatDate(data.time || data.created_at)}</span>
                    </div>
                    <p className="mt-2 truncate text-xs text-zinc-600">{addressText}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDeposit) {
                          if (data.address) setProofImage(data.address)
                          else toast.error('No receipt is attached to this deposit')
                          return
                        }
                        if (!isDeposit && data.address) {
                          navigator.clipboard.writeText(data.address)
                          toast.success('Copied to clipboard')
                        }
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white hover:text-black"
                      title={isDeposit ? 'View proof' : 'Copy address'}
                    >
                      {isDeposit ? <Eye className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                    {status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => runFinanceAction(data, 'approve')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 transition hover:bg-emerald-400 hover:text-black"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => runFinanceAction(data, 'reject')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C61F41]/15 text-[#ff8ca0] transition hover:bg-[#C61F41] hover:text-white"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-zinc-500">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </article>
              )
            }) : (
              <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                No transactions found.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
