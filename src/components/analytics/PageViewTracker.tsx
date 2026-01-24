'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackGtmEvent } from '@/utils/analytics/gtm'

export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const search = searchParams?.toString()
    const url = search ? `${pathname}?${search}` : pathname

    if (lastUrlRef.current === url) return
    lastUrlRef.current = url

    const fullUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${url}`
        : url

    trackGtmEvent('page_view', {
      event_category: 'navigation',
      event_label: url,
      event_description: 'Visualização de página no app.',
      page_path: url,
      page_location: fullUrl,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      flow_step: typeof window !== 'undefined' ? window.currentFlowStep : undefined,
    })
  }, [pathname, searchParams])

  return null
}
