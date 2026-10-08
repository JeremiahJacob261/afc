import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/currency'
import { isWheelAmount, WHEEL_MAX_AMOUNT } from '@/lib/wheel'
import styles from '@/styles/AdminWheel.module.css'

const COLORS = ['#d047dc', '#a840d6', '#1daedc', '#f235a0', '#29dc45', '#ffe700', '#eb7608', '#ef5f9d']

function sectorGradient(items) {
  if (!items.length) return '#f8c522'
  const size = 360 / items.length
  return `conic-gradient(from -${size / 2}deg, ${items.map((item, index) => `${item.color} ${index * size}deg ${(index + 1) * size}deg`).join(', ')})`
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the image'))
    reader.readAsDataURL(file)
  })
}

export default function WheelEditor() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [revision, setRevision] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(items) !== JSON.stringify(savedItems)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/wheel-items', { cache: 'no-store' })
      if (response.status === 401) { router.push('/admin'); return }
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not load wheel items')
      setItems(result.items)
      setSavedItems(result.items)
      setRevision(result.revision)
    } catch (caught) { setError(caught.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function change(id, field, value) {
    setItems(current => current.map(item => item.id === id ? {
      ...item, [field]: value, ...(field === 'amount' ? { label: formatCurrency(value, null, 'en') } : {}),
    } : item))
  }

  function move(index, direction) {
    const next = [...items]
    const other = index + direction
    if (other < 0 || other >= next.length) return
    ;[next[index], next[other]] = [next[other], next[index]]
    setItems(next)
  }

  function add() {
    if (items.length >= 12) return
    setItems(current => [...current, {
      id: `new-${Date.now()}-${Math.random()}`,
      amount: 1000,
      label: '1,000 MMK',
      imageUrl: '/assets/wheel/cash-emerald.png',
      color: COLORS[current.length % COLORS.length],
    }])
  }

  async function upload(id, file) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error('Choose a PNG, JPEG, WebP, or AVIF image under 5 MB')
      return
    }
    setUploading(id)
    try {
      const dataUrl = await readFile(file)
      const response = await fetch('/api/admin/wheel-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }),
      })
      if (response.status === 401) { router.push('/admin'); return }
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not upload image')
      change(id, 'imageUrl', result.imageUrl)
      toast.success('Image uploaded. Save the wheel to publish it.')
    } catch (caught) { toast.error(caught.message) }
    finally { setUploading(null) }
  }

  async function save() {
    setError('')
    if (items.some(item => !isWheelAmount(item.amount))) {
      setError('Each item needs a positive whole MMK amount.')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/admin/wheel-items', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision, items }),
      })
      if (response.status === 401) { router.push('/admin'); return }
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not save wheel items')
      setItems(result.items)
      setSavedItems(result.items)
      setRevision(result.revision)
      toast.success('Wheel updated')
    } catch (caught) { setError(caught.message) }
    finally { setSaving(false) }
  }

  return <>
    <Head><title>Wheel Items — Admin</title></Head>
    <div className={styles.layout}>
      <div className={styles.intro}>
        <div><h2>Wheel items</h2><p>Edit the cash amounts, artwork, colors, and slice order. Changes appear on the user wheel after you save.</p></div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={load} disabled={loading || saving || Boolean(uploading)}><RotateCcw size={16} /> Reload</button>
          <button type="button" className={styles.primary} onClick={save} disabled={loading || saving || Boolean(uploading) || !dirty}><Save size={16} /> {saving ? 'Saving…' : 'Save wheel'}</button>
        </div>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.columns}>
        <section className={styles.list} aria-label="Wheel items">
          <div className={styles.listHead}><div><h3>Slices</h3><p>{items.length} of 12 items · Minimum 2</p></div><button type="button" className={styles.add} onClick={add} disabled={loading || items.length >= 12}><Plus size={16} /> Add item</button></div>
          {loading ? <p className={styles.loading}>Loading wheel items…</p> : items.map((item, index) => <div className={styles.item} key={item.id}>
            <div className={styles.itemTop}>
              <strong>Slice {index + 1}</strong>
              <div className={styles.itemActions}>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.label} up`} title="Move up"><ArrowUp size={16} /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${item.label} down`} title="Move down"><ArrowDown size={16} /></button>
                <button type="button" onClick={() => setItems(current => current.filter(entry => entry.id !== item.id))} disabled={items.length <= 2} aria-label={`Remove ${item.label}`} title="Remove"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className={styles.fields}>
              <label>Amount (MMK)<input type="number" inputMode="numeric" min="1" max={WHEEL_MAX_AMOUNT} step="1" value={item.amount} onChange={event => change(item.id, 'amount', event.target.value)} placeholder="e.g. 5000" /></label>
              <label>Slice color<div className={styles.colorField}><input type="color" value={item.color} onChange={event => change(item.id, 'color', event.target.value)} aria-label={`Color for ${item.label}`} /><span>{item.color}</span></div></label>
            </div>
            <div className={styles.imageField}>
              <div className={styles.thumb}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <ImagePlus size={24} />}</div>
              <div className={styles.imageControls}>
                <label>Image URL<input value={item.imageUrl} onChange={event => change(item.id, 'imageUrl', event.target.value)} placeholder="/assets/wheel/cash-emerald.png or https://…" /></label>
                <label className={styles.upload}><ImagePlus size={15} /> {uploading === item.id ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={Boolean(uploading)} onChange={event => { upload(item.id, event.target.files?.[0]); event.target.value = '' }} /></label>
              </div>
            </div>
          </div>)}
        </section>
        <aside className={styles.previewCard}>
          <div><h3>Live preview</h3><p>Preview reflects your edits before saving.</p></div>
          <div className={styles.previewRim}>
            <div className={styles.previewWheel} style={{ background: sectorGradient(items) }}>
              {items.map((item, index) => {
                const angle = index * Math.PI * 2 / items.length
                return <div className={styles.previewPrize} key={item.id} style={{ left: `${50 + 34 * Math.sin(angle)}%`, top: `${50 - 34 * Math.cos(angle)}%`, width: `${Math.min(27, Math.max(16, 185 / items.length))}%` }}><span>{item.label}</span>{item.imageUrl && <img src={item.imageUrl} alt="" />}</div>
              })}
              <div className={styles.previewHub}>GO</div>
            </div>
          </div>
          <p className={styles.note}>Each slice has an equal chance and credits its amount to the user&apos;s balance. One free spin every 24 hours requires a balance of at least 100,000 MMK.</p>
          {dirty && <p className={styles.unsaved}>Unsaved changes</p>}
        </aside>
      </div>
    </div>
  </>
}
