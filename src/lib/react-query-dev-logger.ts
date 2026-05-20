import type { QueryClient, QueryKey } from '@tanstack/react-query'

const WINDOW_MS = 60_000
const FETCH_WARN_THRESHOLD = 18
const RETRY_WARN_THRESHOLD = 4

type FetchWindow = {
  count: number
  windowStart: number
  lastReason: string
}

const fetchWindows = new Map<string, FetchWindow>()

function isDevLoggingEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_RQ_DEBUG === '1'
  )
}

function keyLabel(queryKey: QueryKey): string {
  try {
    return JSON.stringify(queryKey)
  } catch {
    return String(queryKey)
  }
}

function pruneWindow(entry: FetchWindow, now: number): FetchWindow {
  if (now - entry.windowStart > WINDOW_MS) {
    return { count: 0, windowStart: now, lastReason: entry.lastReason }
  }
  return entry
}

function recordFetch(queryKey: QueryKey, reason: string): void {
  const label = keyLabel(queryKey)
  const now = Date.now()
  const prev = fetchWindows.get(label) ?? { count: 0, windowStart: now, lastReason: reason }
  const entry = pruneWindow(prev, now)
  entry.count += 1
  entry.lastReason = reason
  fetchWindows.set(label, entry)

  if (entry.count === FETCH_WARN_THRESHOLD) {
    console.warn(
      `[react-query] possível polling/refetch excessivo | key=${label} | fetches=${entry.count}/${WINDOW_MS / 1000}s | last=${reason}`,
    )
  }
}

function recordRetry(queryKey: QueryKey, failureCount: number): void {
  if (failureCount < RETRY_WARN_THRESHOLD) return
  console.warn(
    `[react-query] retries elevados | key=${keyLabel(queryKey)} | failures=${failureCount}`,
  )
}

/**
 * Dev-only: alerta refetch/retry agressivos no console (sem telemetria externa).
 */
export function attachReactQueryDevLogger(queryClient: QueryClient): void {
  if (!isDevLoggingEnabled()) return

  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return

    const { query } = event
    const actionType = event.action?.type

    if (actionType === 'fetch' && query.state.fetchStatus === 'fetching') {
      const reason = String(event.action?.meta?.reason ?? actionType)
      recordFetch(query.queryKey, reason)
    }

    if (query.state.fetchFailureCount >= RETRY_WARN_THRESHOLD) {
      recordRetry(query.queryKey, query.state.fetchFailureCount)
    }
  })
}

export function isAggressivePollingInterval(
  intervalMs: number | false | undefined,
): boolean {
  return typeof intervalMs === 'number' && intervalMs > 0 && intervalMs < 8_000
}
