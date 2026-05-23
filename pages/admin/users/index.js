import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowUpRight, Search, UserCheck, Users as UsersIcon, X } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'

function formatDate(value) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatBalance(value) {
  const number = Number(value || 0)
  return `${Number.isFinite(number) ? number.toFixed(2) : '0.00'} USDT`
}

export default function Users({ dount = 0, count = 0, datw = [] }) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [data, setData] = useState(datw)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ find: searchValue }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) window.location.href = '/admin'
        return
      }
      setData(result || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setSearchValue('')
    setData(datw)
  }

  return (
    <>
      <Head>
        <title>Admin Users</title>
      </Head>

      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Total users</p>
              <UsersIcon className="h-4 w-4 text-[#1BB6FF]" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{count}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Active users</p>
              <UserCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-[#1BB6FF]">{dount}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
            <p className="text-sm text-zinc-500">Visible rows</p>
            <p className="mt-4 text-3xl font-semibold text-[#B96CFF]">{data.length}</p>
          </article>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">User Directory</h2>
              <p className="text-sm text-zinc-500">Search by username or referral code, then open a user profile.</p>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/[0.06] p-1">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') search()
                }}
                placeholder="Username or referral code"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <button type="button" onClick={search} className="rounded-full bg-white px-3 py-2 text-black">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" onClick={clear} className="rounded-full px-3 py-2 text-[#ff8ca0]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10">
            <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 md:grid">
              <span>User</span>
              <span>Registered</span>
              <span>Balance</span>
              <span>Open</span>
            </div>
            <div className="divide-y divide-white/10">
              {data.length ? data.map((user) => (
                <button
                  key={user.uid}
                  type="button"
                  onClick={() => router.push(`/admin/full/${user.uid}`)}
                  className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04] md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-zinc-500">{user.uid}</p>
                  </div>
                  <p className="text-sm text-zinc-400">{formatDate(user.created_at || user.crdate)}</p>
                  <p className="text-sm font-semibold text-[#1BB6FF]">{formatBalance(user.balance)}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              )) : (
                <div className="px-4 py-10 text-center text-sm text-zinc-500">
                  {loading ? 'Searching users...' : 'No users found.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    requireAdmin(context.req)
    const supabaseAdmin = getSupabaseAdmin()
    const [{ count: dount }, { data, count }] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('firstd', true),
      supabaseAdmin
        .from('users')
        .select('created_at,uid,username,balance', { count: 'exact' })
        .order('id', { ascending: false })
        .limit(250),
    ])

    return {
      props: {
        dount: dount || 0,
        count: count || 0,
        datw: data || [],
      },
    }
  } catch (error) {
    if (error.statusCode === 401) {
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent('/admin/users')}`,
          permanent: false,
        },
      }
    }
    console.log(error)
    return { props: { dount: 0, count: 0, datw: [] } }
  }
}
