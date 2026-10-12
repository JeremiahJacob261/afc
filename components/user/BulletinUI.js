import { useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { RefreshCw, Ticket } from 'lucide-react'
import ball from '@/public/simps/ball.png'
import { getBetState } from '@/lib/betDisplay'
import styles from '@/styles/MatchdayBulletin.module.css'

export function BulletinTeam({ name, image, size = 28 }) {
  const { t } = useTranslation('common')
  const [failed, setFailed] = useState(false)
  return <div className={styles.team}><Image src={failed || !image ? ball : image} width={size} height={size} alt="" unoptimized onError={() => setFailed(true)} /><span>{name || t('common.team')}</span></div>
}
export function BetBadge({ bet }) {
  const { t } = useTranslation('common')
  const state = getBetState(bet)
  return <span className={styles.badge} data-state={state}>{t(`status.${state}`)}</span>
}
export function CompanyGameBadge() {
  const { t } = useTranslation('common')
  return <span className={styles.companyBadge}>{t('mobile.match.companyGame')}</span>
}
export function BulletinLoading({ label }) {
  return <div role="status" aria-busy="true"><span className={styles.skeletonLabel}>{label}</span>{[0, 1, 2].map((key) => <div className={styles.skeleton} aria-hidden="true" key={key} />)}</div>
}
export function BulletinState({ title, description, onRetry, children }) {
  const { t } = useTranslation('common')
  return <div className={styles.state} role={onRetry ? 'alert' : 'status'}><Ticket size={28} aria-hidden="true" /><h2>{title}</h2>{description && <p>{description}</p>}{onRetry && <button className={styles.action} type="button" onClick={onRetry}><RefreshCw size={16} aria-hidden="true" />{t('bulletin.retry')}</button>}{children}</div>
}
