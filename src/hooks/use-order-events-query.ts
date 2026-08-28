'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrderEventsRefetchIntervalMs } from '@/domain/order-journey'
import {
  getOrderEvents,
  orderEventsQueryKey,
} from '@/services/orders'

/**
 * Pipeline events timeline; polling slows down on terminal / action-required states.
 *
 * While the WebSocket is the active channel it invalidates this query on each new
 * event, so interval polling stays off. `pollingSuppressed` is `!fallbackActive` from
 * `useOrderRealtime` — a reconnecting socket keeps polling disabled, so a WS drop no
 * longer produces a burst of `GET /v1/orders/{id}/events/`.
 */
export function useOrderEventsQuery(
  orderId: string | undefined,
  statusValue: string | undefined,
  pollingSuppressed = false,
) {
  return useQuery({
    queryKey: orderEventsQueryKey(orderId ?? ''),
    queryFn: () => getOrderEvents(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () =>
      pollingSuppressed ? false : getOrderEventsRefetchIntervalMs(statusValue),
  })
}
