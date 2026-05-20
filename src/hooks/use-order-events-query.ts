'use client'

import { useQuery } from '@tanstack/react-query'

import { isOrderPipelineActive } from '@/domain/order-journey'
import {
  getOrderEvents,
  orderEventsQueryKey,
} from '@/services/orders'

function eventsPollMs(statusValue: string | undefined): number | false {
  if (statusValue === 'FINISHED' || statusValue === 'CANCELED') return false
  if (
    statusValue === 'REJECTED_DATA' ||
    statusValue === 'RETURNED_BY_NOTARY'
  ) {
    return 90_000
  }
  if (isOrderPipelineActive(statusValue)) {
    return 12_000
  }
  return false
}

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
    refetchInterval: () => eventsPollMs(statusValue),
  })
}
