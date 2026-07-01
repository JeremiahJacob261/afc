import Head from 'next/head'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import { useRouter } from 'next/router'
import { CalendarDays, Plus, Trophy } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'
import { useClientMatchDisplay } from '@/lib/matchDisplay'

export default function Bet({ datas = [] }) {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Admin Bets</title>
      </Head>

      <div className="space-y-5">
        <section className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-[#151515] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Open Bet Markets</h2>
            <p className="text-sm text-zinc-500">Review active match markets and add new odds from upcoming fixtures.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/select?id=1')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
          >
            <Plus className="h-4 w-4" />
            Add Match
          </button>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {datas.length ? datas.map((match) => (
            <AdminMatchCard key={match.match_id || match.id} match={match} onClick={() => router.push(`/admin/matchdetail/${match.match_id}`)} />
          )) : (
            <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center md:col-span-2 xl:col-span-3">
              <Trophy className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">No open bet markets found.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function AdminMatchCard({ match, onClick }) {
  const display = useClientMatchDisplay(match)

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-white/10 bg-[#151515] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1BB6FF]/40 hover:bg-[#202020]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#1BB6FF]/10 px-3 py-1 text-xs font-semibold text-[#8EE5FF]">
          Match ID: {match.match_id}
        </span>
        {match.company && (
          <span className="rounded-full bg-[#B96CFF]/15 px-3 py-1 text-xs font-semibold text-[#dcb3ff]">
            Company Game
          </span>
        )}
      </div>

      <p className="mt-4 truncate text-sm text-zinc-500">{match.league || 'League'}</p>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.ihome || '/ball.png'} alt={match.home || 'Home'} className="mx-auto h-14 w-14 rounded-full object-contain" />
          <p className="mt-3 truncate text-sm font-semibold text-white">{match.home || 'Home'}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-[#1BB6FF]">
          VS
        </div>
        <div className="min-w-0 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.iaway || '/ball.png'} alt={match.away || 'Away'} className="mx-auto h-14 w-14 rounded-full object-contain" />
          <p className="mt-3 truncate text-sm font-semibold text-white">{match.away || 'Away'}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#1BB6FF]" />
          {display.date}
        </span>
        <span>{display.time}</span>
      </div>
    </button>
  )
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  try {
    requireAdmin(context.req)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('verified', false)
      .order('id', { ascending: false })

    if (error) throw error

    return {
      props: {
      ...i18nProps,
        datas: data || [],
      },
    }
  } catch (error) {
    if (error.statusCode === 401) {
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent('/admin/match')}`,
          permanent: false,
        },
      }
    }
    console.log(error)
    return { props: {
      ...i18nProps, datas: [] } }
  }
}
