import Link from 'next/link'
import { useRouter } from 'next/router'
import { prefetchRoute } from '@/lib/backgroundPrefetch'

export default function PerformanceLink({ href, onMouseEnter, onFocus, onTouchStart, ...props }) {
  const router = useRouter()
  return <Link {...props} href={href} prefetch={false}
    onMouseEnter={event => { prefetchRoute(router, href); onMouseEnter?.(event) }}
    onFocus={event => { prefetchRoute(router, href); onFocus?.(event) }}
    onTouchStart={event => { prefetchRoute(router, href); onTouchStart?.(event) }} />
}
