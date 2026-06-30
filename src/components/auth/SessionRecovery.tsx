'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef } from 'react'
import { fetchSessionJsonWithRetry } from '@/utils/session'
import { clearAuthClientFlag, hasAuthClientFlag, touchAuthClientFlag } from '@/utils/auth-client-flag'

const REMOUNT_COOLDOWN_MS = 8_000
const RECOVERY_DELAY_MS = 400

/**
 * Quando o NextAuth interpreta falha de rede como sessão nula, revalida com retry e força
 * remontagem do SessionProvider (novo bootstrap da sessão) se o cookie ainda for válido.
 */
export function SessionRecovery({ onRemountSession }: { onRemountSession: () => void }) {
  const { status } = useSession()
  const lastRemountAt = useRef(0)

  useEffect(() => {
    if (status === 'authenticated') touchAuthClientFlag()
  }, [status])

  const tryRecover = useCallback(async () => {
    const session = await fetchSessionJsonWithRetry()
    if (session?.user) {
      const now = Date.now()
      if (now - lastRemountAt.current < REMOUNT_COOLDOWN_MS) return
      lastRemountAt.current = now
      onRemountSession()
      return
    }
    clearAuthClientFlag()
  }, [onRemountSession])

  useEffect(() => {
    if (status !== 'unauthenticated') return
    if (!hasAuthClientFlag()) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      void tryRecover().then(() => {
        if (cancelled) return
      })
    }, RECOVERY_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [status, tryRecover])

  return null
}
