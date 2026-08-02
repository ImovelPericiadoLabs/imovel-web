import type { Session } from 'next-auth'

const SESSION_PATH = '/api/auth/session'
const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 280

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * GET /api/auth/session com várias tentativas e backoff leve (rede instável, ERR_NETWORK_CHANGED).
 * Espelha a semântica do NextAuth: corpo vazio ou sem user => null.
 */
export async function fetchSessionJsonWithRetry(): Promise<Session | null> {
  if (typeof window === 'undefined') return null

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(SESSION_PATH, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        lastError = new Error(`session_http_${res.status}`)
        await sleep(BASE_DELAY_MS * (attempt + 1))
        continue
      }
      const data = (await res.json()) as Record<string, unknown>
      if (!data || Object.keys(data).length === 0) return null
      if (!('user' in data) || data.user == null) return null
      return data as unknown as Session
    } catch (e) {
      lastError = e
      await sleep(BASE_DELAY_MS * (attempt + 1))
    }
  }
  if (process.env.NODE_ENV === 'development') {
    console.warn('[session] fetchSessionJsonWithRetry esgotou tentativas', lastError)
  }
  return null
}

/** Promessa em andamento, para deduplicar chamadas simultâneas a /api/auth/session. */
let sessionPromise: Promise<Session | null> | null = null

/** Limpa dedupe após re-auth para a próxima chamada ler o cookie novo. */
export function resetSessionDedupeCache() {
  sessionPromise = null
}

/**
 * Sessão deduplicada com retry (evita logout falso quando a rede falha uma vez).
 */
export async function getSessionDeduplicated() {
  if (!sessionPromise) {
    sessionPromise = fetchSessionJsonWithRetry().finally(() => {
      sessionPromise = null
    })
  }
  return sessionPromise
}
