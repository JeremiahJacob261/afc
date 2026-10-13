import { useRouter } from 'next/router'
import { prefetchRoute } from '@/lib/backgroundPrefetch'

export default function PerformanceLink({ href, onClick, onMouseEnter, onFocus, onTouchStart, replace = false, scroll = true, shallow = false, locale, prefetch: _prefetch, ...props }) {
  const router = useRouter()
  const language = locale || router.locale
  const local = typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
  const localized = local && language && language !== router.defaultLocale && !href.startsWith(`/${language}/`)
    ? `/${language}${href}` : href
  // Next 13's Pages Router still prefetches on hover with prefetch=false.
  // A native anchor preserves normal link behavior and gives our queue sole control.
  return <a {...props} href={local ? `${router.basePath || ''}${localized}` : href}
    onClick={event => {
      onClick?.(event)
      if (!local || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download !== undefined) return
      event.preventDefault()
      router[replace ? 'replace' : 'push'](href, undefined, { locale: language, scroll, shallow })
    }}
    onMouseEnter={event => { prefetchRoute(router, href); onMouseEnter?.(event) }}
    onFocus={event => { prefetchRoute(router, href); onFocus?.(event) }}
    onTouchStart={event => { prefetchRoute(router, href); onTouchStart?.(event) }} />
}
