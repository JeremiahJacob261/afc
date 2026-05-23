import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowUpRight, Bell, KeyRound, Lock, ShieldCheck, WalletCards } from 'lucide-react'

const tools = [
  {
    label: 'Generate Bonus Claim Code',
    description: 'Create a claim code for a selected user.',
    href: '/admin/generate',
    icon: KeyRound,
    tone: 'text-[#1BB6FF]',
  },
  {
    label: 'Payment Wallets',
    description: 'Update company deposit wallet accounts.',
    href: '/admin/paymentmthod',
    icon: WalletCards,
    tone: 'text-[#B96CFF]',
  },
  {
    label: 'Announcement',
    description: 'Broadcast a message to platform users.',
    href: '/admin/broadcast',
    icon: Bell,
    tone: 'text-[#1BB6FF]',
  },
  {
    label: 'Change Password',
    description: 'Password controls and security updates.',
    href: '/admin/security',
    icon: Lock,
    tone: 'text-[#ff8ca0]',
  },
]

export default function Controls() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Admin Control</title>
      </Head>

      <div className="space-y-5">
        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Control Center</h2>
              <p className="text-sm text-zinc-500">Operational admin tools for rewards, wallets, announcements, and security.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#1BB6FF]/10 px-4 py-2 text-sm font-semibold text-[#8EE5FF]">
              <ShieldCheck className="h-4 w-4" />
              Admin tools
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {tools.map(({ label, description, href, icon: Icon, tone }) => (
            <button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              className="group rounded-[24px] border border-white/10 bg-[#151515] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1BB6FF]/40 hover:bg-[#202020]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition group-hover:bg-white group-hover:text-black">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
            </button>
          ))}
        </section>
      </div>
    </>
  )
}
