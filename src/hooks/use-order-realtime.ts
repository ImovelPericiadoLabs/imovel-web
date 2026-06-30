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
  type: 'snapshot' | 'status' | string
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
  status?: string
  semaphore?: SemaphoreStatus
  step?: string
  lastMessageAt?: string
}

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

/**
 * Subscribes to the order realtime channel via WebSocket and patches the
 * react-query cache (status/semaphore + timeline) as events arrive.
 * Reconnects with exponential backoff; `connected === false` lets the
 * detail/events queries fall back to polling so the UX never stalls.
 */
export function useOrderRealtime(orderId: string | undefined): OrderRealtimeState {
  const { data: session } = useSession()
  const token = session?.accessToken
  const queryClient = useQueryClient()

  const [state, setState] = useState<OrderRealtimeState>({ connected: false })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const closedByUsRef = useRef(false)

  const applyMessage = useCallback(
    (msg: OrderRealtimeMessage) => {
      if (!orderId) return

      setState((prev) => ({
        connected: true,
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
      if (msg.type !== 'snapshot') {
        void queryClient.invalidateQueries({ queryKey: orderQueryKey(orderId) })
        void queryClient.invalidateQueries({
          queryKey: orderEventsQueryKey(orderId),
        })
        void queryClient.invalidateQueries({
          queryKey: orderOwnersQueryKey(orderId),
        })
        void queryClient.invalidateQueries({
          queryKey: orderAnalysesQueryKey(orderId),
        })
        void queryClient.invalidateQueries({
          queryKey: orderDocumentsQueryKey(orderId),
        })
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
    // No order/token (or SSR): stay disconnected; the previous effect's cleanup
    // already reset `connected`, so polling fallback remains active.
    if (!orderId || !token || typeof window === 'undefined') {
      return
    }

    closedByUsRef.current = false

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
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
        attemptRef.current = 0
        setState((prev) => ({ ...prev, connected: true }))
      }

      ws.onmessage = (event) => {
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
        setState((prev) => ({ ...prev, connected: false }))
        if (!closedByUsRef.current) scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (closedByUsRef.current) return
      clearReconnect()
      const delay = Math.min(
        INITIAL_BACKOFF_MS * 2 ** attemptRef.current,
        MAX_BACKOFF_MS,
      )
      attemptRef.current += 1
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    connect()

    return () => {
      closedByUsRef.current = true
      clearReconnect()
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
      setState((prev) => ({ ...prev, connected: false }))
    }
  }, [orderId, token, applyMessage])

  return state
}
