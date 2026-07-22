import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import toast, { Toaster } from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeDollarSign,
  Banknote,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

const emptyForm = {
  name: '',
  currencyCode: '',
  rate: '',
  available: true,
  type: 'mobile-money',
  logoPreview: '',
  bank: '',
  accountName: '',
  accountNumber: '',
  notes: '',
}

const paymentTypes = [
  { value: 'local-transfer', label: 'Local transfer' },
  { value: 'crypto-wallet', label: 'Crypto wallet' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile-money', label: 'Mobile money' },
]

function getInitials(name) {
  return String(name || 'PM').slice(0, 2).toUpperCase()
}

function normalizeForm(form) {
  return {
    ...form,
    name: form.name.trim(),
    currencyCode: form.currencyCode.trim().toUpperCase(),
    rate: String(form.rate).trim(),
    bank: form.bank.trim(),
    accountName: form.accountName.trim(),
    accountNumber: form.accountNumber.trim(),
    notes: form.notes.trim(),
  }
}

function validateForm(form) {
  const normalized = normalizeForm(form)
  const rate = Number(normalized.rate)

  if (!normalized.name) return 'Method name is required'
  if (!normalized.currencyCode) return 'Currency code is required'
  if (!Number.isFinite(rate) || rate <= 0) return 'Rate must be a positive number'
  if (!normalized.accountName) return 'Account holder name is required'
  if (!normalized.accountNumber) return 'Account number or address is required'

  return ''
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read logo file'))
    reader.readAsDataURL(file)
  })
}

function MethodLogo({ method, className = 'h-12 w-12' }) {
  if (method.logoPreview) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={method.logoPreview}
        alt={`${method.name} logo`}
        className={`${className} rounded-2xl object-cover`}
      />
    )
  }

  return (
    <div className={`${className} flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1BB6FF] to-[#B96CFF] text-sm font-bold text-black`}>
      {getInitials(method.name)}
    </div>
  )
}

export default function PaymentMethodManager() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [methods, setMethods] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === selectedId) || methods[0] || null,
    [methods, selectedId]
  )

  const filteredMethods = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return methods
    return methods.filter((method) => (
      method.name.toLowerCase().includes(needle)
      || method.currencyCode.toLowerCase().includes(needle)
      || method.bank.toLowerCase().includes(needle)
      || method.accountName.toLowerCase().includes(needle)
    ))
  }, [methods, search])

  const loadMethods = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch('/api/admin/payment-methods')
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to load payment methods')
      }

      const nextMethods = Array.isArray(result.methods) ? result.methods : []
      setMethods(nextMethods)
      setSelectedId((current) => (
        nextMethods.some((method) => method.id === current)
          ? current
          : nextMethods[0]?.id || null
      ))
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Unable to load payment methods')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setLogoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const editMethod = (method) => {
    setEditingId(method.id)
    setSelectedId(method.id)
    setForm({
      name: method.name,
      currencyCode: method.currencyCode,
      rate: method.rate,
      available: method.available,
      type: method.type,
      logoPreview: method.logoPreview,
      bank: method.bank,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      notes: method.notes,
    })
  }

  const saveMethod = async () => {
    const error = validateForm(form)
    if (error) {
      toast.error(error)
      return
    }

    const normalized = normalizeForm(form)
    const editingMethod = methods.find((method) => method.id === editingId)

    setSaving(true)
    try {
      const logoDataUrl = logoFile ? await fileToDataUrl(logoFile) : ''
      const payload = {
        ...normalized,
        id: editingMethod?.methodId || editingId,
        destinationId: editingMethod?.destinationId,
        previousName: editingMethod?.name,
        logoUrl: logoFile ? '' : normalized.logoPreview,
        logoFile: logoFile ? {
          name: logoFile.name,
          type: logoFile.type,
          dataUrl: logoDataUrl,
        } : null,
      }

      const response = await fetch('/api/admin/payment-methods', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to save payment method')
      }

      const savedMethod = result.method
      if (!savedMethod) throw new Error('Payment method saved without a response row')

      setMethods((current) => (
        editingId
          ? current.map((method) => (method.id === editingId ? savedMethod : method))
          : [savedMethod, ...current]
      ))
      setSelectedId(savedMethod.id)
      toast.success(editingId ? 'Method updated' : 'Method added')
      resetForm()
    } catch (saveError) {
      console.log(saveError)
      toast.error(saveError.message || 'Unable to save payment method')
    } finally {
      setSaving(false)
    }
  }

  const deleteMethod = async (method) => {
    setDeletingId(method.id)
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.methodId || method.id, name: method.name, hardDelete: true }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to delete payment method')
      }

      setMethods((current) => current.filter((item) => item.id !== method.id))
      if (selectedId === method.id) {
        const next = methods.find((item) => item.id !== method.id)
        setSelectedId(next?.id || null)
      }
      if (editingId === method.id) resetForm()
      toast.success('Method deleted')
    } catch (deleteError) {
      console.log(deleteError)
      toast.error(deleteError.message || 'Unable to delete payment method')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAvailability = async (method) => {
    setTogglingId(method.id)
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.methodId || method.id,
          name: method.name,
          available: !method.available,
          toggleOnly: true,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to update availability')
      }

      setMethods((current) => current.map((item) => (
        item.id === method.id ? { ...item, available: !method.available } : item
      )))
      toast.success(method.available ? 'Method disabled' : 'Method enabled')
    } catch (toggleError) {
      console.log(toggleError)
      toast.error(toggleError.message || 'Unable to update availability')
    } finally {
      setTogglingId(null)
    }
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    updateForm('logoPreview', URL.createObjectURL(file))
  }

  return (
    <>
      <Head>
        <title>Payment Methods</title>
      </Head>
      <Toaster position="bottom-center" />

      <div className="mx-auto w-full max-w-7xl space-y-5 text-white">
        <section className="rounded-[30px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 transition hover:bg-white hover:text-black"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1BB6FF]">
                  Payment Manager
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Deposit Methods
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Add, edit, preview, and publish payment methods that customers can use on the deposit screen.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Methods</p>
                <p className="mt-1 text-xl font-semibold">{methods.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Active</p>
                <p className="mt-1 text-xl font-semibold text-[#1BB6FF]">{methods.filter((method) => method.available).length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Storage</p>
                <p className="mt-1 text-xl font-semibold text-[#B96CFF]">Live</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[30px] border border-white/15 bg-[#151515]/85 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Method Library</h2>
                <p className="text-sm text-zinc-500">Search and select a payment method.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
              >
                <Plus className="h-4 w-4" />
                New method
              </button>
              <button
                type="button"
                onClick={() => loadMethods()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-full bg-white/[0.06] p-1">
              <Search className="ml-3 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search method, currency, bank..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-white/[0.08] hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              {loading ? (
                <>
                  <MethodSkeleton />
                  <MethodSkeleton />
                  <MethodSkeleton />
                </>
              ) : filteredMethods.length ? filteredMethods.map((method) => {
                const selected = selectedId === method.id
                return (
                  <article
                    key={method.id}
                    className={`rounded-[24px] border p-4 transition ${
                      selected
                        ? 'border-[#1BB6FF]/50 bg-[#1BB6FF]/10'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(method.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <MethodLogo method={method} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{method.name}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            method.available
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-[#C61F41]/15 text-[#ff8ca0]'
                          }`}>
                            {method.available ? 'Available' : 'Disabled'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {method.currencyCode} · rate {method.rate} · {method.bank || method.type}
                        </p>
                        <p className="mt-2 truncate text-sm text-zinc-300">
                          {method.accountName || 'No account name'} / {method.accountNumber || 'No address'}
                        </p>
                      </div>
                    </button>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editMethod(method)}
                        disabled={saving || deletingId === method.id || togglingId === method.id}
                        className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(method)}
                        disabled={togglingId === method.id || deletingId === method.id}
                        className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {togglingId === method.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : method.available ? <ToggleRight className="h-3.5 w-3.5 text-[#1BB6FF]" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {method.available ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMethod(method)}
                        disabled={deletingId === method.id || togglingId === method.id}
                        className="inline-flex items-center gap-2 rounded-full bg-[#C61F41]/15 px-3 py-2 text-xs font-semibold text-[#ff8ca0] transition hover:bg-[#C61F41] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === method.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    </div>
                  </article>
                )
              }) : (
                <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center">
                  <WalletCards className="mx-auto h-8 w-8 text-zinc-600" />
                  <p className="mt-3 text-sm font-semibold text-white">No methods found</p>
                  <p className="mt-1 text-sm text-zinc-500">Try another search or add a new saved method.</p>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-5">
            <div className="rounded-[30px] border border-white/15 bg-[#151515]/85 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{editingId ? 'Edit Method' : 'Add Method'}</h2>
                  <p className="text-sm text-zinc-500">Saved methods are used by the customer deposit page.</p>
                </div>
                <span className="w-fit rounded-full bg-[#B96CFF]/15 px-4 py-2 text-xs font-semibold text-[#dcb3ff]">
                  Supabase
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Method name" value={form.name} onChange={(value) => updateForm('name', value)} placeholder="e.g. GPay Ghana" icon={WalletCards} />
                <Field label="Currency code" value={form.currencyCode} onChange={(value) => updateForm('currencyCode', value.toUpperCase())} placeholder="e.g. GHS" icon={BadgeDollarSign} />
                <Field label="Payment-currency units per 1 FCFA" value={form.rate} onChange={(value) => updateForm('rate', value)} placeholder="e.g. 1" icon={Banknote} type="number" />
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    <Smartphone className="h-4 w-4 text-[#1BB6FF]" />
                    Payment type
                  </span>
                  <select
                    value={form.type}
                    onChange={(event) => updateForm('type', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[#1BB6FF]"
                  >
                    {paymentTypes.map((type) => (
                      <option key={type.value} value={type.value} className="bg-[#151515] text-white">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Bank / Provider" value={form.bank} onChange={(value) => updateForm('bank', value)} placeholder="e.g. MTN Money" icon={Banknote} />
                <Field label="Account holder name" value={form.accountName} onChange={(value) => updateForm('accountName', value)} placeholder="Account name" icon={CheckCircle2} />
                <Field label="Account number / address" value={form.accountNumber} onChange={(value) => updateForm('accountNumber', value)} placeholder="Wallet address or number" icon={Smartphone} />

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    {form.available ? <ToggleRight className="h-4 w-4 text-[#1BB6FF]" /> : <ToggleLeft className="h-4 w-4 text-zinc-500" />}
                    Availability
                  </span>
                  <button
                    type="button"
                    onClick={() => updateForm('available', !form.available)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      form.available
                        ? 'border-[#1BB6FF]/30 bg-[#1BB6FF]/10 text-[#8EE5FF]'
                        : 'border-white/10 bg-black/25 text-zinc-400'
                    }`}
                  >
                    <span>{form.available ? 'Available to users' : 'Disabled'}</span>
                    {form.available ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-300">Logo / Icon</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#1BB6FF]/45 bg-[#1BB6FF]/10 text-center transition hover:bg-[#1BB6FF]/15"
                  >
                    {form.logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoPreview} alt="Method preview" className="h-16 w-16 rounded-2xl object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-[#8EE5FF]" />
                    )}
                    <span className="mt-3 text-sm font-semibold text-white">Choose logo</span>
                    <span className="mt-1 text-xs text-zinc-500">Uploads when saved</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-300">Admin notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                    placeholder="Internal notes about limits, supported region, confirmation rules..."
                    className="h-36 w-full resize-none rounded-3xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1BB6FF]"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={saveMethod}
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? 'Update method' : 'Add method'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white hover:text-black"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            <PreviewCard method={selectedMethod} draft={form} editing={Boolean(editingId)} />
          </section>
        </div>
      </div>
    </>
  )
}

function Field({ label, value, onChange, placeholder, icon: Icon, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Icon className="h-4 w-4 text-[#1BB6FF]" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1BB6FF]"
      />
    </label>
  )
}

function MethodSkeleton() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/[0.08]" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-16 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
    </div>
  )
}

function PreviewCard({ method, draft, editing }) {
  const preview = editing ? { ...method, ...draft } : method

  if (!preview) {
    return (
      <section className="rounded-[30px] border border-white/15 bg-white/[0.08] p-5 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-sm text-zinc-500">Select or add a method to preview it.</p>
      </section>
    )
  }

  return (
    <section className="rounded-[30px] border border-white/15 bg-white/[0.08] p-5 text-white shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1BB6FF]">Customer Preview</p>
          <h2 className="mt-2 text-xl font-semibold">Deposit card appearance</h2>
        </div>
        <span className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${
          preview.available ? 'bg-emerald-400/10 text-emerald-300' : 'bg-[#C61F41]/15 text-[#ff8ca0]'
        }`}>
          {preview.available ? 'Visible' : 'Hidden'}
        </span>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-[#06101F]/70 p-5">
        <div className="flex items-start gap-4">
          <MethodLogo method={preview} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-white">{preview.name || 'Payment method'}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Min 3,000 FCFA equivalent · {preview.currencyCode || 'CODE'}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <p className="text-xs text-zinc-500">Rate</p>
                <p className="mt-1 truncate font-semibold">{preview.rate || '0'}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <p className="text-xs text-zinc-500">Provider</p>
                <p className="mt-1 truncate font-semibold">{preview.bank || 'Not set'}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <p className="text-xs text-zinc-500">Type</p>
                <p className="mt-1 truncate font-semibold capitalize">{String(preview.type || '').replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Payment details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-500">Account name</p>
              <p className="mt-1 overflow-wrap-anywhere font-semibold text-white">{preview.accountName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Number / address</p>
              <p className="mt-1 break-words font-semibold text-white">{preview.accountNumber || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
