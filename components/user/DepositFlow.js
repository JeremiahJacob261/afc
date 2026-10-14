import { translateApiMessage } from '@/lib/translateApiMessage'
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { v4 as uuidv4 } from 'uuid'
import { createReceiptUpload } from '@/lib/receiptUpload'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Check, Copy, CreditCard, FileImage, RefreshCw, Upload, X } from 'lucide-react'
import Cover from '@/pages/user/cover'
import { supabase } from '@/pages/api/supabase'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { readPaymentConfiguration } from '@/lib/paymentConfiguration'
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
let receiptUpload = null

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
  const [uploadState, setUploadState] = useState({ stage: 'idle', percent: 0 })
  const mounted = useRef(true)
  const submissionAttempt = useRef({ signature: '', id: '' })
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
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
        receiptUpload?.discard()
        receiptUpload = null
        receiptOwnerId = userId
      }
      setReceipt(receiptInMemory)
      if (receiptUpload) {
        receiptUpload.onProgress = state => { if (mounted.current) setUploadState(state) }
        setUploadState(receiptUpload.progress)
      }

      try {
        const [configuration, pendingResponse] = await Promise.all([
          readPaymentConfiguration({ fresh: reloadKey > 0 }),
          authFetch('/api/pending-payment-request'),
        ])
        if (!pendingResponse.ok) throw new Error('Unable to check pending requests')
        const pendingResult = await pendingResponse.json()
        if (!active) return
        setMethods(configuration.methods)
        setDestinations(configuration.destinations)
        setPendingRequest(Boolean(pendingResult.pending))
      } catch (_) {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [reloadKey])

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
    setSubmitError('')
  }

  const chooseTransfer = (key) => {
    if (key === draft.transferKey) return
    updateDraft({ transferKey: key, destination: null, reviewedRate: null, reviewedSignature: '' })
    setSubmitError('')
  }

  const changeAmount = (value) => {
    updateDraft({ amount: value, reviewedRate: null, reviewedSignature: '' })
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
    if (submitting) return
    if (file && !file.type.startsWith('image/')) {
      toast.error(t('mobile.deposit.receiptHint'))
      return
    }
    receiptUpload?.discard()
    receiptInMemory = file
    setReceipt(file)
    setSubmitError('')
    if (!file) { receiptUpload = null; setUploadState({ stage: 'idle', percent: 0 }); return }
    const task = createReceiptUpload(file, draft.userId, state => {
      if (mounted.current && receiptUpload === task) setUploadState(state)
    })
    receiptUpload = task
    task.start().catch(error => { if (mounted.current && receiptUpload === task) setSubmitError(translateApiMessage(error, t, 'mobile.deposit.uploadFailed')) })
  }

  const submit = async () => {
    if (pendingRequest || !selectedMethod || !amountValid || !destination || !reviewed || !receipt || submitting) return
    setSubmitError('')
    setSubmitting(true)
    await waitForPaint()
    try {
      if (!receiptUpload || receiptUpload.file !== receipt) {
        receiptUpload = createReceiptUpload(receipt, draft.userId, setUploadState)
      }
      const task = receiptUpload
      const receiptUrl = await task.start()
      const signature = JSON.stringify([draft.amount, code, selectedMethod.name, receiptUrl, destination.address])
      if (submissionAttempt.current.signature !== signature) submissionAttempt.current = { signature, id: uuidv4() }

      // A lost response may follow a committed request. Leave its receipt for
      // the durable cleanup job to check before deletion.
      task.submitted = true
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
          client_request_id: submissionAttempt.current.id,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.status !== 'success') {
        if (result.code === 'rate_changed') {
          updateDraft({ reviewedRate: null, reviewedSignature: '' })
          setReloadKey(key => key + 1)
        }
        if (result.code === 'receipt_expired') {
          receiptUpload = createReceiptUpload(receipt, draft.userId, setUploadState)
          receiptUpload.start().catch(() => {})
        }
        throw Object.assign(new Error(result.message), { payload: result, status: response.status })
      }

      task.accepted = true
      sessionStorage.setItem(DEPOSIT_SUCCESS_KEY, JSON.stringify({ userId: draft.userId, mmkAmount: equivalent }))
      sessionStorage.removeItem(DEPOSIT_DRAFT_KEY)
      draftRef.current = { ...EMPTY_DEPOSIT_DRAFT, userId: draft.userId }
      receiptInMemory = null
      receiptUpload = null
      toast.success(t('messages.depositSubmitted'))
      router.push('/user/depositsuccess')
    } catch (error) {
      const message = translateApiMessage(error, t, receiptUpload?.submitted ? 'messages.depositFailed' : 'mobile.deposit.uploadFailed')
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
                  <input id="deposit-receipt" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={submitting} className={styles.fileInput} onChange={(event) => chooseReceipt(event.target.files?.[0] || null)} />
                  <label htmlFor="deposit-receipt" className={styles.uploadZone}><Upload size={24} strokeWidth={1.8} aria-hidden="true" /><span>{t('mobile.deposit.browseReceiptImage')}</span></label>
                  {receipt ? <div className={styles.selectedFile}><FileImage size={20} aria-hidden="true" /><span><strong>{receipt.name}</strong><small>{(receipt.size / 1024 / 1024).toFixed(2)} MB</small></span><button type="button" aria-label={t('mobile.deposit.removeReceipt')} onClick={() => { chooseReceipt(null); if (fileInputRef.current) fileInputRef.current.value = '' }}><X size={18} aria-hidden="true" /></button></div> : <p className={styles.helpText}>{t('mobile.deposit.uploadRequired')}</p>}
                  {receipt && uploadState.stage !== 'idle' && <p className={styles.helpText} role="status">{t(`mobile.deposit.uploadStages.${uploadState.stage}`, { percent: uploadState.percent })}</p>}
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
