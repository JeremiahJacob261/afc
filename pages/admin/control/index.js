import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowUpRight, Bell, KeyRound, Lock, Percent, Save, ShieldCheck, WalletCards } from 'lucide-react'

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
  const [bonusPercent, setBonusPercent] = useState('3')
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('10')
  const [dailyWithdrawalLimit, setDailyWithdrawalLimit] = useState('100')
  const [annualWithdrawalLimit, setAnnualWithdrawalLimit] = useState('100000')
  const [withdrawalLimitExemptUsernames, setWithdrawalLimitExemptUsernames] = useState('')
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState('7')
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true)
  const [withdrawalDisabledMessage, setWithdrawalDisabledMessage] = useState('Withdrawals are temporarily unavailable. Please try again later.')
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401) router.push('/admin')
          throw new Error(result.message || 'Unable to load settings')
        }

        if (active) {
          setBonusPercent(String(result.settings?.firstDepositBonusPercent ?? 3))
          setMinWithdrawalAmount(String(result.settings?.minWithdrawalAmount ?? 10))
          setDailyWithdrawalLimit(String(result.settings?.dailyWithdrawalLimit ?? 100))
          setAnnualWithdrawalLimit(String(result.settings?.annualWithdrawalLimit ?? 100000))
          setWithdrawalLimitExemptUsernames((result.settings?.withdrawalLimitExemptUsernames || []).join('\n'))
          setWithdrawalFeePercent(String(result.settings?.withdrawalFeePercent ?? 7))
          setWithdrawalsEnabled(result.settings?.withdrawalsEnabled ?? true)
          setWithdrawalDisabledMessage(result.settings?.withdrawalDisabledMessage ?? 'Withdrawals are temporarily unavailable. Please try again later.')
        }
      } catch (error) {
        console.log(error)
        toast.error(error.message || 'Unable to load settings')
      } finally {
        if (active) setLoadingSettings(false)
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [router])

  const saveSettings = async () => {
    const firstDepositBonusPercent = Number(bonusPercent)
    const minAmount = Number(minWithdrawalAmount)
    const dailyLimit = Number(dailyWithdrawalLimit)
    const annualLimit = Number(annualWithdrawalLimit)
    const feePercent = Number(withdrawalFeePercent)

    if (!Number.isFinite(firstDepositBonusPercent) || firstDepositBonusPercent < 0 || firstDepositBonusPercent > 100) {
      toast.error('Bonus percent must be between 0 and 100')
      return
    }

    if (!Number.isFinite(minAmount) || minAmount < 0) {
      toast.error('Minimum withdrawal amount must be zero or greater')
      return
    }

    if (minAmount > 100) {
      toast.error('Minimum withdrawal amount cannot exceed the 100 USDT hard limit')
      return
    }

    if (!Number.isFinite(dailyLimit) || dailyLimit < minAmount || !Number.isFinite(annualLimit) || annualLimit < minAmount) {
      toast.error('Daily and annual limits must be at least the minimum withdrawal amount')
      return
    }

    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error('Withdrawal fee percent must be between 0 and 100')
      return
    }

    if (!withdrawalsEnabled && !withdrawalDisabledMessage.trim()) {
      toast.error('Add a message to show while withdrawals are disabled')
      return
    }

    setSavingSettings(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstDepositBonusPercent,
          minWithdrawalAmount: minAmount,
          dailyWithdrawalLimit: dailyLimit,
          annualWithdrawalLimit: annualLimit,
          withdrawalLimitExemptUsernames: withdrawalLimitExemptUsernames.split(/[\n,]/).map((value) => value.trim()).filter(Boolean),
          withdrawalFeePercent: feePercent,
          withdrawalsEnabled,
          withdrawalDisabledMessage: withdrawalDisabledMessage.trim(),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to save settings')
      }

      setBonusPercent(String(result.settings?.firstDepositBonusPercent ?? firstDepositBonusPercent))
      setMinWithdrawalAmount(String(result.settings?.minWithdrawalAmount ?? minAmount))
      setDailyWithdrawalLimit(String(result.settings?.dailyWithdrawalLimit ?? dailyLimit))
      setAnnualWithdrawalLimit(String(result.settings?.annualWithdrawalLimit ?? annualLimit))
      setWithdrawalLimitExemptUsernames((result.settings?.withdrawalLimitExemptUsernames || []).join('\n'))
      setWithdrawalFeePercent(String(result.settings?.withdrawalFeePercent ?? feePercent))
      setWithdrawalsEnabled(result.settings?.withdrawalsEnabled ?? withdrawalsEnabled)
      setWithdrawalDisabledMessage(result.settings?.withdrawalDisabledMessage ?? withdrawalDisabledMessage)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Unable to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Control</title>
      </Head>
      <Toaster position="bottom-center" />

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

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1BB6FF]/10 text-[#8EE5FF]">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">First Deposit Bonus</h3>
                  <p className="text-sm text-zinc-500">Applied once when an admin approves a first deposit.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-12 min-w-[180px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.001"
                  value={bonusPercent}
                  disabled={loadingSettings || savingSettings}
                  onChange={(event) => setBonusPercent(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-right text-lg font-semibold text-white outline-none disabled:text-zinc-500"
                />
                <span className="text-sm font-semibold text-zinc-400">%</span>
              </label>
              <button
                type="button"
                onClick={saveSettings}
                disabled={loadingSettings || savingSettings}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#8EE5FF] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                <Save className="h-4 w-4" />
                {savingSettings ? 'Saving' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-5">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff8ca0]/10 text-[#ff8ca0]">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Withdrawal Settings</h3>
                <p className="text-sm text-zinc-500">Each request is capped at 100 USDT. Set daily and annual totals below.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="withdrawals-enabled" className="text-sm font-semibold text-white">Enable Withdrawals</label>
                    <p className="mt-1 text-xs text-zinc-500">Turn this off to stop all new withdrawal requests.</p>
                  </div>
                  <button
                    id="withdrawals-enabled"
                    type="button"
                    role="switch"
                    aria-checked={withdrawalsEnabled}
                    disabled={loadingSettings || savingSettings}
                    onClick={() => setWithdrawalsEnabled((enabled) => !enabled)}
                    className={`relative h-7 w-12 rounded-full transition ${withdrawalsEnabled ? 'bg-[#1BB6FF]' : 'bg-zinc-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${withdrawalsEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {!withdrawalsEnabled ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <label htmlFor="withdrawal-disabled-message" className="text-sm font-semibold text-white">Message shown to users</label>
                    <textarea
                      id="withdrawal-disabled-message"
                      value={withdrawalDisabledMessage}
                      maxLength={1000}
                      disabled={loadingSettings || savingSettings}
                      onChange={(event) => setWithdrawalDisabledMessage(event.target.value)}
                      placeholder="Explain why withdrawals are unavailable."
                      className="min-h-[96px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none disabled:text-zinc-500"
                    />
                    <p className="text-xs text-zinc-500">This appears in a dialog when a user opens the withdrawal page.</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Minimum Withdrawal Amount (USDT)</label>
                <label className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={minWithdrawalAmount}
                    disabled={loadingSettings || savingSettings}
                    onChange={(event) => setMinWithdrawalAmount(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none disabled:text-zinc-500"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Daily Withdrawal Limit (USDT)</label>
                <label className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={dailyWithdrawalLimit}
                    disabled={loadingSettings || savingSettings}
                    onChange={(event) => setDailyWithdrawalLimit(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none disabled:text-zinc-500"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Annual Withdrawal Limit (USDT)</label>
                <label className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4">
                  <input type="number" inputMode="decimal" min="0" step="0.001" value={annualWithdrawalLimit} disabled={loadingSettings || savingSettings} onChange={(event) => setAnnualWithdrawalLimit(event.target.value)} className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none disabled:text-zinc-500" />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Daily & Annual Limit Exemptions</label>
                <textarea value={withdrawalLimitExemptUsernames} disabled={loadingSettings || savingSettings} onChange={(event) => setWithdrawalLimitExemptUsernames(event.target.value)} placeholder="One username per line" className="min-h-[96px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none disabled:text-zinc-500" />
                <p className="text-xs text-zinc-500">Enter one username per line. Exemptions do not bypass the 100 USDT limit per request.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Withdrawal Fee Percent (%)</label>
                <label className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.001"
                    value={withdrawalFeePercent}
                    disabled={loadingSettings || savingSettings}
                    onChange={(event) => setWithdrawalFeePercent(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none disabled:text-zinc-500"
                  />
                  <span className="text-sm font-semibold text-zinc-400">%</span>
                </label>
              </div>
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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            disabled={loadingSettings || savingSettings}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-[#8EE5FF] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            <Save className="h-4 w-4" />
            {savingSettings ? 'Saving' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </>
  )
}
