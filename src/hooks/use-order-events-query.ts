'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrderEventsRefetchIntervalMs } from '@/domain/order-journey'
import {
  getOrderEvents,
  orderEventsQueryKey,
} from '@/services/orders'

/**
 * Pipeline events timeline; polling slows down on terminal / action-required states.
 * While `realtimeConnected` is true the WebSocket invalidates this query on new
 * events, so interval polling is disabled and only resumes as a fallback.
 */
export function useOrderEventsQuery(
  orderId: string | undefined,
  statusValue: string | undefined,
  realtimeConnected = false,
) {
  return useQuery({
    queryKey: orderEventsQueryKey(orderId ?? ''),
    queryFn: () => getOrderEvents(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () =>
      realtimeConnected ? false : getOrderEventsRefetchIntervalMs(statusValue),
  })
}
