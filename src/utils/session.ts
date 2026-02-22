import { getSession } from 'next-auth/react'
import type { Session } from 'next-auth'

/** Promessa em andamento de getSession, para deduplicar chamadas simultâneas a /api/auth/session. */
let sessionPromise: Promise<Session | null> | null = null

/**
 * getSession() deduplicado: chamadas simultâneas compartilham a mesma requisição.
 * Reduz múltiplos GET /api/auth/session quando vários serviços (orders, account, payments) usam a sessão em paralelo.
 */
export async function getSessionDeduplicated() {
  if (!sessionPromise) {
    sessionPromise = getSession().finally(() => {
      sessionPromise = null
    })
  }
  return sessionPromise
}
