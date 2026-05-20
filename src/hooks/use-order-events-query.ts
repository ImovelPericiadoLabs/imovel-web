'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrderEventsRefetchIntervalMs } from '@/domain/order-journey'
import {
  getOrderEvents,
  orderEventsQueryKey,
} from '@/services/orders'

/**
 * Pipeline events timeline; polling slows down on terminal / action-required states.
 */
export function useOrderEventsQuery(
  orderId: string | undefined,
  statusValue: string | undefined,
) {
  return useQuery({
    queryKey: orderEventsQueryKey(orderId ?? ''),
    queryFn: () => getOrderEvents(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () => getOrderEventsRefetchIntervalMs(statusValue),
  })
}
