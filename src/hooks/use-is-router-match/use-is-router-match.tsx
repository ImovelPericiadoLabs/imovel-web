'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

function escapeRegex(input: string): string {
  // Escape characters that have special meaning in regular expressions, including backslash.
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function patternToRegex(pattern: string) {
  const segments = pattern.split('/')
  const regexSegments = segments.map((segment) => {
    const paramMatch = /^:([a-zA-Z0-9_]+)$/.exec(segment)
    if (paramMatch) {
      // Parameter segment (e.g., ":id") should match any characters except "/".
      return '([^/]+)'
    }
    // Non-parameter segment: escape all regex metacharacters so it is treated literally.
    return escapeRegex(segment)
  })

  const regexString = '^' + regexSegments.join('/') + '$'

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
