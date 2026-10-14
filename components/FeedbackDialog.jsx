import { useEffect, useId, useRef } from 'react'
import { CircleCheck, CircleAlert, Info } from 'lucide-react'
import Image from 'next/image'
import LOGO from '@/public/champions-league-logo.png'
import { useTranslation } from 'next-i18next'

const contentByType = {
  success: { icon: CircleCheck, color: '#2ECFC4', titleKey: 'status.success' },
  error: { icon: CircleAlert, color: '#FFB4AB', titleKey: 'messages.anErrorOccurred' },
  info: { icon: Info, color: '#1BB6FF', titleKey: 'common.information' },
}

export default function FeedbackDialog({ open, type = 'info', title, message, actionLabel, onClose }) {
  const { t } = useTranslation('common')
  const dialog = useRef(null)
  const id = useId()
  const content = contentByType[type] || contentByType.info
  const Icon = content.icon
  const description = message || t(content.titleKey)
  useEffect(() => {
    const element = dialog.current
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])
  return <dialog ref={dialog} className="feedback-dialog" style={{ '--feedback-accent': content.color }}
    aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); onClose?.() }}
    onClick={event => { if (event.target === dialog.current) onClose?.() }}>
    <div className="feedback-dialog-content">
      <div className="feedback-dialog-logo"><Image src={LOGO} width={44} height={44} alt="UCL" /><Icon size={25} aria-hidden="true" /></div>
      <h2 id={`${id}-title`}>{title || t(content.titleKey)}</h2>
      <p id={`${id}-description`}>{description}</p>
      <button type="button" onClick={onClose} autoFocus>{actionLabel ?? t('common.okay')}</button>
    </div>
  </dialog>
}
