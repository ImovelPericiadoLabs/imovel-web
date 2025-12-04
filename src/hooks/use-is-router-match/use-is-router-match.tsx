'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

function patternToRegex(pattern: string) {
  const regexString =
    '^' + pattern.replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)').replace(/\//g, '\\/') + '$'

  return new RegExp(regexString)
}

export default function useIsRouteMatch() {
  const pathname = usePathname()

  const isMatch = useCallback(
    (pattern: string) => {
      const regex = patternToRegex(pattern)
      return regex.test(pathname)
    },
    [pathname],
  )

  return {
    isMatch,
    pathname,
  }
}
