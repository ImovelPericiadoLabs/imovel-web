'use client'

import { useQuery } from '@tanstack/react-query'

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
    return 60_000
  }
  return 15_000
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
    refetchInterval: () => eventsPollMs(statusValue),
  })
}
