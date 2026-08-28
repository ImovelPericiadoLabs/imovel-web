'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'

import { wsUrl } from '@/constants/api'
import {
  orderAnalysesQueryKey,
  orderDocumentsQueryKey,
  orderEventsQueryKey,
  orderOwnersQueryKey,
  orderQueryKey,
  type Order,
  type SemaphoreStatus,
} from '@/services/orders'
import { isOrderTerminalStatus } from '@/domain/order-journey'

/** Realtime message sent over `GET /v1/orders/{order_id}/events` (mirrors backend producer). */
export type OrderRealtimeMessage = {
  type: 'snapshot' | 'status' | 'heartbeat' | string
  order_id?: string
  status?: string
  semaphore?: SemaphoreStatus
  step?: string
  detail?: string
  at?: string
}

export type OrderRealtimeState = {
  /** True while the WebSocket is open — callers disable polling fallback. */
  connected: boolean
  /**
   * True only after the WebSocket has failed `FALLBACK_AFTER_ATTEMPTS` times in a row.
   * This — not `!connected` — is what enables HTTP polling. A single dropped frame
   * must not turn the page into a request storm.
   */
  fallbackActive: boolean
  status?: string
  semaphore?: SemaphoreStatus
  step?: string
  lastMessageAt?: string
}

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

/**
 * Consecutive failed WebSocket attempts before HTTP polling is allowed to start.
 * The WS is the primary channel; polling exists for the case where it is genuinely
 * unavailable (blocked proxy, no Channels in the running image), not for blips.
 */
const FALLBACK_AFTER_ATTEMPTS = 3

/**
 * A connection is only "healthy" once it has stayed open this long. Without it, a
 * socket that is accepted and then killed 5s later by the server keeps resetting the
 * backoff counter in `onopen` — which is exactly how a ~5s reconnect loop ran forever
 * at attempt 0, hammering the backend and re-enabling polling on every cycle.
 */
const HEALTHY_AFTER_MS = 20_000

/** No frame at all (not even the server heartbeat) for this long ⇒ half-open socket. */
const STALE_AFTER_MS = 90_000

/** Randomise the backoff so N open tabs do not reconnect in the same instant. */
function withJitter(delay: number): number {
  return Math.round(delay * (0.5 + Math.random() / 2))
}

/**
 * Subscribes to the order realtime channel via WebSocket and patches the
 * react-query cache (status/semaphore + timeline) as events arrive.
 *
 * Reconnects with jittered exponential backoff. `fallbackActive` only flips true
 * after several consecutive failures, so the detail/events queries stay quiet while
 * the socket is merely reconnecting.
 */
export function useOrderRealtime(orderId: string | undefined): OrderRealtimeState {
  const { data: session } = useSession()
  const token = session?.accessToken
  const queryClient = useQueryClient()

  const [state, setState] = useState<OrderRealtimeState>({
    connected: false,
    fallbackActive: false,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const healthyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const closedByUsRef = useRef(false)

  const applyMessage = useCallback(
    (msg: OrderRealtimeMessage) => {
      if (!orderId) return

      // Heartbeat only proves liveness; it carries no order state and must never
      // trigger cache invalidation (that would be a self-inflicted poll every 25s).
      if (msg.type === 'heartbeat') {
        setState((prev) => ({ ...prev, connected: true, fallbackActive: false }))
        return
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        fallbackActive: false,
        status: msg.status ?? prev.status,
        semaphore: msg.semaphore ?? prev.semaphore,
        step: msg.step ?? prev.step,
        lastMessageAt: msg.at ?? prev.lastMessageAt,
      }))

      // Patch the detail cache optimistically so the UI reflects the new state at once.
      if (msg.status || msg.semaphore) {
        queryClient.setQueryData<Order>(orderQueryKey(orderId), (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: msg.status
              ? { ...prev.status, value: msg.status }
              : prev.status,
            semaphore: msg.semaphore ?? prev.semaphore,
          }
        })
      }

      // Reconcile against the authoritative payload (owners, analysis, documents, timeline).
      // `refetchType: 'active'` keeps this to the queries actually mounted on screen —
      // the default also refetches inactive ones, which is where part of the duplicate
      // GET bursts came from.
      if (msg.type !== 'snapshot') {
        const invalidate = { refetchType: 'active' } as const
        void queryClient.invalidateQueries({ queryKey: orderQueryKey(orderId), ...invalidate })
        void queryClient.invalidateQueries({ queryKey: orderEventsQueryKey(orderId), ...invalidate })
        void queryClient.invalidateQueries({ queryKey: orderOwnersQueryKey(orderId), ...invalidate })
        void queryClient.invalidateQueries({ queryKey: orderAnalysesQueryKey(orderId), ...invalidate })
        void queryClient.invalidateQueries({ queryKey: orderDocumentsQueryKey(orderId), ...invalidate })
      }

      // Pipeline finished/canceled — backend closes the channel; stop reconnecting.
      if (isOrderTerminalStatus(msg.status)) {
        closedByUsRef.current = true
        wsRef.current?.close()
      }
    },
    [orderId, queryClient],
  )

  useEffect(() => {
    // No order/token (or SSR): stay disconnected. Without a token the WebSocket can
    // never succeed, so polling is the only option — enable the fallback immediately.
    if (!orderId || !token || typeof window === 'undefined') {
      return
    }

    closedByUsRef.current = false

    const clearTimer = (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
      if (ref.current) {
        clearTimeout(ref.current)
        ref.current = null
      }
    }

    const clearAllTimers = () => {
      clearTimer(reconnectTimerRef)
      clearTimer(healthyTimerRef)
      clearTimer(staleTimerRef)
    }

    const armStaleWatchdog = () => {
      clearTimer(staleTimerRef)
      staleTimerRef.current = setTimeout(() => {
        // Server heartbeat stopped arriving: the socket is half-open. Force a close so
        // `onclose` runs the normal reconnect path instead of the UI freezing silently.
        wsRef.current?.close()
      }, STALE_AFTER_MS)
    }

    const scheduleReconnect = () => {
      if (closedByUsRef.current) return
      clearTimer(reconnectTimerRef)
      const delay = withJitter(
        Math.min(INITIAL_BACKOFF_MS * 2 ** attemptRef.current, MAX_BACKOFF_MS),
      )
      attemptRef.current += 1
      // Only now — after N consecutive failures — is HTTP polling allowed to run.
      if (attemptRef.current >= FALLBACK_AFTER_ATTEMPTS) {
        setState((prev) =>
          prev.fallbackActive ? prev : { ...prev, fallbackActive: true },
        )
      }
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    const connect = () => {
      const endpointUrl = `${wsUrl}/orders/${orderId}/events?token=${encodeURIComponent(
        token,
      )}`

      let ws: WebSocket
      try {
        ws = new WebSocket(endpointUrl)
      } catch {
        scheduleReconnect()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        setState((prev) => ({ ...prev, connected: true }))
        armStaleWatchdog()
        // The backoff counter is NOT reset here. `onopen` only means the handshake
        // succeeded; the previous loop reset it here and, because the server dropped
        // the socket a few seconds later, the delay never grew past 1s. Reset only
        // once the connection has proven it can stay up.
        clearTimer(healthyTimerRef)
        healthyTimerRef.current = setTimeout(() => {
          attemptRef.current = 0
          setState((prev) => {
            if (!prev.fallbackActive) return prev
            // Coming back from fallback: abort the polling requests still in flight so
            // their (already stale) responses cannot overwrite the fresher WebSocket
            // state, and so the burst does not keep hitting the server after recovery.
            void queryClient.cancelQueries({ queryKey: orderQueryKey(orderId) })
            void queryClient.cancelQueries({ queryKey: orderEventsQueryKey(orderId) })
            return { ...prev, fallbackActive: false }
          })
        }, HEALTHY_AFTER_MS)
      }

      ws.onmessage = (event) => {
        armStaleWatchdog()
        if (event.data === 'pong') return
        try {
          applyMessage(JSON.parse(event.data) as OrderRealtimeMessage)
        } catch {
          // Ignore malformed frames; keep the connection alive.
        }
      }

      ws.onerror = () => {
        // `onclose` follows and handles reconnection.
        ws.close()
      }

      ws.onclose = () => {
        clearTimer(healthyTimerRef)
        clearTimer(staleTimerRef)
        setState((prev) => ({ ...prev, connected: false }))
        if (!closedByUsRef.current) scheduleReconnect()
      }
    }

    connect()

    return () => {
      closedByUsRef.current = true
      clearAllTimers()
      attemptRef.current = 0
      const ws = wsRef.current
      wsRef.current = null
      if (ws) {
        ws.onopen = null
        ws.onmessage = null
        ws.onerror = null
        ws.onclose = null
        ws.close()
      }
      setState((prev) => ({ ...prev, connected: false, fallbackActive: false }))
    }
  }, [orderId, token, applyMessage, queryClient])

  return state
}
