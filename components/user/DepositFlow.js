import { translateApiMessage } from '@/lib/translateApiMessage'
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { v4 as uuidv4 } from 'uuid'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Check, Copy, CreditCard, FileImage, RefreshCw, Upload, X } from 'lucide-react'
import Cover from '@/pages/user/cover'
import { supabase } from '@/pages/api/supabase'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { waitForPaint } from '@/lib/uiFeedback'
import {
  DEPOSIT_DRAFT_KEY, DEPOSIT_SUCCESS_KEY, EMPTY_DEPOSIT_DRAFT,
  destinationSnapshot, findDestination, formatMoney, isLocalDestination,
  methodCode, methodIdentity, methodRate, minimumAmount, needsTransferOption,
  readDepositDraft, reviewSignature, transferOptions, ledgerAmount, validAmount,
} from '@/lib/depositFlow'
import styles from '@/styles/UserFund.module.css'

const routes = ['/user/fund', '/user/fund/amount', '/user/fund/payment', '/user/fund/receipt']
let receiptInMemory = null
let receiptOwnerId = ''
let uploadedReceipt = { file: null, url: '' }

function methodLabel(method, t) {
  return method?.name || method?.currency_code?.toUpperCase() || t('mobile.deposit.methodFallback')
}

function CopyRow({ label, value, onCopy, copyLabel }) {
  if (!value) return null
  return <div className={styles.copyRow}>
    <div><span>{label}</span><strong>{value}</strong></div>
    <button type="button" aria-label={`${copyLabel} ${label}`} onClick={() => onCopy(value, label)}><Copy size={18} strokeWidth={1.8} aria-hidden="true" /></button>
  </div>
}

function Recovery({ message, href, action }) {
  return <div className={styles.recovery} role="status">
    <p>{message}</p>
    <Link href={href} className={styles.primaryAction}>{action}<ArrowRight size={18} aria-hidden="true" /></Link>
  </div>
}

export default function DepositFlow({ step }) {
  const { t, i18n } = useTranslation('common')
  const money = (value) => formatMoney(value, i18n.language)
  const router = useRouter()
  const fileInputRef = useRef(null)
  const draftRef = useRef(EMPTY_DEPOSIT_DRAFT)
  const [draft, setDraft] = useState(EMPTY_DEPOSIT_DRAFT)
  const [methods, setMethods] = useState([])
  const [destinations, setDestinations] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [pendingRequest, setPendingRequest] = useState(false)

  const updateDraft = useCallback((patch) => {
    const next = { ...draftRef.current, ...patch }
    draftRef.current = next
    setDraft(next)
    if (typeof window !== 'undefined') sessionStorage.setItem(DEPOSIT_DRAFT_KEY, JSON.stringify(next))
    return next
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      const session = await requireSession(router)
      if (!session || !active) return
      clearLegacyAuthStorage()
      const userId = session.user.id
      const stored = readDepositDraft(sessionStorage, userId)
      draftRef.current = stored
      setDraft(stored)
      if (receiptOwnerId !== userId) {
        receiptInMemory = null
        uploadedReceipt = { file: null, url: '' }
        receiptOwnerId = userId
      }
      setReceipt(receiptInMemory)

      try {
        const [{ data: methodRows, error: methodError }, { data: destinationRows, error: destinationError }, pendingResponse] = await Promise.all([
          supabase.from('walle').select('*').eq('available', true),
          supabase.from('depositwallet').select('*'),
          authFetch('/api/pending-payment-request'),
        ])
        if (methodError) throw methodError
        if (destinationError) throw destinationError
        if (!pendingResponse.ok) throw new Error('Unable to check pending requests')
        const pendingResult = await pendingResponse.json()
        if (!active) return
        setMethods(Array.isArray(methodRows) ? methodRows : [])
        setDestinations(Array.isArray(destinationRows) ? destinationRows : [])
        setPendingRequest(Boolean(pendingResult.pending))
      } catch (_) {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [router, reloadKey])

  const selectedMethod = useMemo(
    () => methods.find((method) => methodIdentity(method) === draft.methodIdentity) || null,
    [methods, draft.methodIdentity]
  )
  const code = methodCode(selectedMethod)
  const amountValid = validAmount(draft.amount, selectedMethod)
  const equivalent = ledgerAmount(draft.amount, selectedMethod)
  const requiresTransfer = needsTransferOption(destinations, selectedMethod)
  const transferReady = !requiresTransfer || Boolean(draft.transferKey)
  const liveDestination = useMemo(
    () => destinationSnapshot(findDestination(destinations, selectedMethod, draft.transferKey)),
    [destinations, selectedMethod, draft.transferKey]
  )
  const destination = draft.destination || (step === 3 && amountValid && transferReady ? liveDestination : null)
  const reviewed = Boolean(destination && draft.reviewedRate === methodRate(selectedMethod) && draft.reviewedSignature === reviewSignature(draft))

  useEffect(() => {
    if (step !== 3 || loading || !selectedMethod || !amountValid || !transferReady || draft.destination || !liveDestination) return
    updateDraft({ destination: liveDestination, reviewedSignature: '' })
  }, [step, loading, selectedMethod, amountValid, transferReady, draft.destination, liveDestination, updateDraft])

  const chooseMethod = (method) => {
    const identity = methodIdentity(method)
    if (identity === draft.methodIdentity) return
    updateDraft({ methodIdentity: identity, transferKey: '', destination: null, reviewedRate: null, reviewedSignature: '' })
    uploadedReceipt = { file: null, url: '' }
    setSubmitError('')
  }

  const chooseTransfer = (key) => {
    if (key === draft.transferKey) return
    updateDraft({ transferKey: key, destination: null, reviewedRate: null, reviewedSignature: '' })
    uploadedReceipt = { file: null, url: '' }
    setSubmitError('')
  }

  const changeAmount = (value) => {
    updateDraft({ amount: value, reviewedRate: null, reviewedSignature: '' })
    uploadedReceipt = { file: null, url: '' }
    setSubmitError('')
  }

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('mobile.deposit.copiedLabel', { label }))
    } catch (_) {
      toast.error(t('messages.unableCopy'))
    }
  }

  const chooseReceipt = (file) => {
    if (file && !file.type.startsWith('image/')) {
      toast.error(t('mobile.deposit.receiptHint'))
      return
    }
    receiptInMemory = file
    uploadedReceipt = { file: null, url: '' }
    setReceipt(file)
    setSubmitError('')
  }

  const submit = async () => {
    if (pendingRequest || !selectedMethod || !amountValid || !destination || !reviewed || !receipt || submitting) return
    setSubmitError('')
    setSubmitting(true)
    await waitForPaint()
    try {
      let receiptUrl = uploadedReceipt.file === receipt ? uploadedReceipt.url : ''
      if (!receiptUrl) {
        const path = `public/${uuidv4()}-${receipt.name.replace(/\s+/g, '-')}`
        const { error } = await supabase.storage.from('trcreceipt').upload(path, receipt)
        if (error) throw error
        receiptUrl = supabase.storage.from('trcreceipt').getPublicUrl(path).data?.publicUrl || ''
        if (!receiptUrl) throw new Error(t('messages.depositFailed'))
        uploadedReceipt = { file: receipt, url: receiptUrl }
      }

      const response = await authFetch('/api/create-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(draft.amount),
          method: code,
          methodName: selectedMethod.name,
          address: receiptUrl,
          adminaddress: destination.address,
          expectedRate: draft.reviewedRate,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (result.code === 'rate_changed') updateDraft({ reviewedRate: null, reviewedSignature: '' })
        throw new Error(translateApiMessage(result, t, 'messages.depositFailed'))
      }

      sessionStorage.setItem(DEPOSIT_SUCCESS_KEY, JSON.stringify({ userId: draft.userId, mmkAmount: equivalent }))
      sessionStorage.removeItem(DEPOSIT_DRAFT_KEY)
      draftRef.current = { ...EMPTY_DEPOSIT_DRAFT, userId: draft.userId }
      receiptInMemory = null
      uploadedReceipt = { file: null, url: '' }
      toast.success(t('messages.depositSubmitted'))
      router.push('/user/depositsuccess')
    } catch (error) {
      const message = translateApiMessage(error, t, 'messages.depositFailed')
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const titles = [t('mobile.deposit.paymentMethod'), t('common.amount'), t('mobile.deposit.paymentDestination'), t('mobile.deposit.receiptUpload')]
  const backHref = step === 1 ? '/user' : routes[step - 2]
  const canEnterAmount = Boolean(selectedMethod && transferReady && methodRate(selectedMethod) > 0 && (draft.destination || liveDestination))
  const canEnterPayment = Boolean(canEnterAmount && amountValid)
  const canEnterReceipt = Boolean(canEnterPayment && destination && reviewed)
  const methodBlockMessage = !selectedMethod ? t('mobile.deposit.chooseMethodFirst')
    : !transferReady ? t('mobile.deposit.chooseTransferOption')
      : methodRate(selectedMethod) <= 0 ? t('mobile.deposit.rateUnavailable')
        : t('mobile.deposit.noPaymentAddress')
  const blocked = step === 2 && !canEnterAmount
    ? { message: methodBlockMessage, href: routes[0], action: t('mobile.deposit.paymentMethod') }
    : step === 3 && !canEnterPayment
      ? { message: !canEnterAmount ? methodBlockMessage : t('mobile.deposit.enterValidAmount'), href: canEnterAmount ? routes[1] : routes[0], action: canEnterAmount ? t('common.amount') : t('mobile.deposit.paymentMethod') }
      : step === 4 && !canEnterReceipt
        ? { message: submitError || (!canEnterAmount ? methodBlockMessage : !amountValid ? t('mobile.deposit.enterValidAmount') : t('mobile.deposit.chooseMethodDetails')), href: canEnterPayment ? routes[2] : canEnterAmount ? routes[1] : routes[0], action: canEnterPayment ? t('mobile.deposit.paymentDestination') : canEnterAmount ? t('common.amount') : t('mobile.deposit.paymentMethod') }
        : null

  return <Cover>
    <Head><title>{`${titles[step - 1]} - UCL`}</title><link rel="icon" href="/european.ico" /></Head>
    <Toaster position="bottom-center" reverseOrder={false} />
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link href={backHref} className={styles.back}><ArrowLeft size={18} aria-hidden="true" />{t('common.back')}</Link>
        <span className={styles.stepCount}>{step} / 4</span>
      </div>
      <ol className={styles.progress} aria-label={t('mobile.deposit.title')}>
        {titles.map((title, index) => <li key={index} className={`${styles.progressStep} ${index + 1 === step ? styles.currentStep : ''} ${index + 1 < step ? styles.completeStep : ''}`} aria-current={index + 1 === step ? 'step' : undefined}>
          <span className={styles.progressMarker}>{index + 1 < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
          <span>{title}</span>
        </li>)}
      </ol>

      <div className={styles.heading}>
        <h1>{titles[step - 1]}</h1>
        <p>{step === 1 ? t('mobile.deposit.availableOptions') : step === 2 ? t('mobile.deposit.minShort', { amount: money(minimumAmount(selectedMethod)), currency: code.toUpperCase() }) : step === 3 ? t('mobile.deposit.sendExactly', { amount: `${draft.amount} ${code.toUpperCase()}` }) : t('mobile.deposit.receiptHint')}</p>
      </div>

      {loading ? <div className={styles.status} role="status" aria-live="polite">{t('mobile.deposit.loading')}</div>
        : loadError ? <div className={styles.status} role="alert"><p>{t('messages.unableLoadPaymentData')}</p><button type="button" className={styles.secondaryAction} onClick={() => setReloadKey((key) => key + 1)}><RefreshCw size={18} aria-hidden="true" />{t('mobile.transactions.retry')}</button></div>
          : pendingRequest ? <div className={styles.status} role="status">{t('messages.paymentRequestPending')}</div>
          : blocked ? <Recovery {...blocked} />
            : <div className={styles.workspace}>
              <section className={styles.primaryPanel} aria-label={titles[step - 1]}>
                {step === 1 && <>
                  {methods.length === 0 ? <p className={styles.status}>{t('mobile.deposit.noMethods')}</p> : <div className={styles.methodList} role="group" aria-label={t('mobile.deposit.paymentMethod')}>
                    {methods.map((method) => {
                      const selected = draft.methodIdentity === methodIdentity(method)
                      const minimum = minimumAmount(method)
                      return <button key={methodIdentity(method)} type="button" className={`${styles.methodOption} ${selected ? styles.methodSelected : ''}`} aria-pressed={selected} onClick={() => chooseMethod(method)}>
                        <span className={styles.methodIcon}>{method.image ? <img src={method.image} alt="" width="40" height="40" loading="lazy" /> : <CreditCard size={24} strokeWidth={1.8} aria-hidden="true" />}</span>
                        <span className={styles.methodCopy}><strong>{methodLabel(method, t)}</strong><small>{minimum === null ? t('mobile.deposit.rateUnavailable') : t('mobile.deposit.minShort', { amount: money(minimum), currency: methodCode(method).toUpperCase() })}</small></span>
                        <span className={styles.methodCheck} aria-hidden="true">{selected && <Check size={16} strokeWidth={2.5} />}</span>
                      </button>
                    })}
                  </div>}
                  {selectedMethod && requiresTransfer && <div className={styles.transferGroup}>
                    <h2>{t('mobile.deposit.transferOption')}</h2>
                    <div role="group" aria-label={t('mobile.deposit.transferOption')} className={styles.transferOptions}>
                      {transferOptions[code].map((option) => <button key={option.key} type="button" aria-pressed={draft.transferKey === option.key} className={draft.transferKey === option.key ? styles.transferSelected : ''} onClick={() => chooseTransfer(option.key)}>{option.label}</button>)}
                    </div>
                  </div>}
                  {selectedMethod && transferReady && !draft.destination && !liveDestination && <p className={styles.destinationError} role="alert">{t('mobile.deposit.noPaymentAddress')}</p>}
                  <button type="button" className={styles.primaryAction} disabled={!canEnterAmount} onClick={() => router.push(routes[1])}>{t('common.continue')}<ArrowRight size={18} aria-hidden="true" /></button>
                </>}

                {step === 2 && <>
                  <label htmlFor="deposit-amount" className={styles.fieldLabel}>{t('common.amount')}</label>
                  <div className={`${styles.amountInput} ${draft.amount !== '' && !amountValid ? styles.inputInvalid : ''}`}>
                    <input id="deposit-amount" type="text" inputMode="decimal" autoComplete="off" value={draft.amount} aria-invalid={draft.amount !== '' && !amountValid} aria-describedby="deposit-minimum deposit-equivalent" placeholder={t('mobile.deposit.minimumPlaceholder', { amount: money(minimumAmount(selectedMethod)), currency: code.toUpperCase() })} onChange={(event) => changeAmount(event.target.value)} />
                    <span>{code.toUpperCase()}</span>
                  </div>
                  <p id="deposit-minimum" className={styles.helpText} role={draft.amount !== '' && !amountValid ? 'alert' : undefined}>{draft.amount !== '' && !amountValid ? /^\d{1,11}(?:\.\d{1,4})?$/.test(draft.amount) ? t('messages.minimumDeposit', { amount: money(minimumAmount(selectedMethod)), currency: code.toUpperCase() }) : t('mobile.deposit.enterValidAmount') : t('mobile.deposit.minShort', { amount: money(minimumAmount(selectedMethod)), currency: code.toUpperCase() })}</p>
                  <div id="deposit-equivalent" className={styles.equivalent}><span>{t('mobile.deposit.usdtEquivalent')}</span><strong>{draft.amount !== '' && equivalent !== null ? money(equivalent) : '—'} MMK</strong></div>
                  <button type="button" className={styles.primaryAction} disabled={!canEnterPayment} onClick={() => router.push(routes[2])}>{t('common.continue')}<ArrowRight size={18} aria-hidden="true" /></button>
                </>}

                {step === 3 && <>
                  <div className={styles.amountHero}><span>{t('mobile.deposit.sendEnteredAmount')}</span><strong>{draft.amount} <small>{code.toUpperCase()}</small></strong></div>
                  {!destination ? <p className={styles.destinationError} role="alert">{t('mobile.deposit.noPaymentAddress')}</p> : <>
                    <div className={styles.destinationRows}>
                      <CopyRow label={isLocalDestination(destination) ? t('forms.accountNumber') : t('forms.walletAddress')} value={destination.address} onCopy={copyText} copyLabel={t('common.copy')} />
                      {isLocalDestination(destination) && <>
                        <CopyRow label={t('forms.accountName')} value={destination.accountname} onCopy={copyText} copyLabel={t('common.copy')} />
                        <CopyRow label={t('forms.bank')} value={destination.bank} onCopy={copyText} copyLabel={t('common.copy')} />
                      </>}
                    </div>
                    {destination.image && <img className={styles.destinationImage} src={destination.image} alt={t('mobile.deposit.paymentDetailsAlt')} width="640" height="360" loading="lazy" />}
                    <button type="button" className={styles.primaryAction} onClick={() => { const reviewedRate = methodRate(selectedMethod); const next = updateDraft({ destination, reviewedRate, reviewedSignature: reviewSignature({ ...draft, destination, reviewedRate }) }); if (next.reviewedSignature) router.push(routes[3]) }}>{t('common.continue')}<ArrowRight size={18} aria-hidden="true" /></button>
                  </>}
                </>}

                {step === 4 && <>
                  <div className={styles.receiptReview}>
                    <div><span>{t('mobile.deposit.stepMethod')}</span><strong>{methodLabel(selectedMethod, t)}</strong></div>
                    <div><span>{t('common.amount')}</span><strong>{draft.amount} {code.toUpperCase()}</strong></div>
                    <div><span>{t('mobile.deposit.paymentDestination')}</span><strong>{destination.address}</strong></div>
                  </div>
                  <input id="deposit-receipt" ref={fileInputRef} type="file" accept="image/*" className={styles.fileInput} onChange={(event) => chooseReceipt(event.target.files?.[0] || null)} />
                  <label htmlFor="deposit-receipt" className={styles.uploadZone}><Upload size={24} strokeWidth={1.8} aria-hidden="true" /><span>{t('mobile.deposit.browseReceiptImage')}</span></label>
                  {receipt ? <div className={styles.selectedFile}><FileImage size={20} aria-hidden="true" /><span><strong>{receipt.name}</strong><small>{(receipt.size / 1024 / 1024).toFixed(2)} MB</small></span><button type="button" aria-label={t('mobile.deposit.removeReceipt')} onClick={() => { chooseReceipt(null); if (fileInputRef.current) fileInputRef.current.value = '' }}><X size={18} aria-hidden="true" /></button></div> : <p className={styles.helpText}>{t('mobile.deposit.uploadRequired')}</p>}
                  {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
                  <button type="button" className={styles.primaryAction} disabled={!receipt || submitting} onClick={submit}>{submitting ? t('mobile.deposit.submitting') : submitError ? t('mobile.transactions.retry') : t('mobile.deposit.submit')}<ArrowRight size={18} aria-hidden="true" /></button>
                </>}
              </section>

            </div>}
      <picture className={styles.stadiumImage} aria-hidden="true">
        <source media="(max-width: 600px)" srcSet="/assets/generated/stadium-night-640.webp" />
        <source media="(max-width: 1000px)" srcSet="/assets/generated/stadium-night-960.webp" />
        <img src="/assets/generated/stadium-night-1600.webp" width="1600" height="900" alt="" loading="lazy" decoding="async" />
      </picture>
    </main>
  </Cover>
}
