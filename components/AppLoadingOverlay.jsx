import Image from 'next/image'
import LOGO from '@/public/champions-league-logo.png'
import { useTranslation } from 'next-i18next'

export default function AppLoadingOverlay({ open, title, message }) {
  const { t } = useTranslation('common')
  if (!open) return null
  return <div className="app-loading-overlay" role="status" aria-live="polite" aria-label={title || t('common.loading')}>
    <div className="route-loading-mark"><Image src={LOGO} width={58} height={58} alt="" /></div>
    <span className="sr-only">{message || t('common.loading')}</span>
  </div>
}
