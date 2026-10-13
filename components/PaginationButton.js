import { useTranslation } from 'next-i18next'

export default function PaginationButton({ cursor, loading, onClick }) {
  const { t } = useTranslation('common')
  if (!cursor) return null
  return <button type="button" disabled={loading} onClick={onClick}
    style={{ minHeight: 44, padding: '10px 20px', margin: '16px 0', borderRadius: 8, border: '1px solid var(--ucl-border)', background: 'var(--ucl-paper)', color: 'var(--ucl-ink)', cursor: loading ? 'wait' : 'pointer' }}>
    {loading ? t('status.pending') : t('common.loadMore')}
  </button>
}
