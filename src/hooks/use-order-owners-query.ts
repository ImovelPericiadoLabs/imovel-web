'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrderOwners, orderOwnersQueryKey } from '@/services/orders'
import { isOrderPipelineActive } from '@/domain/order-journey'

/**
 * Order owners (GET /orders/:id/owners). Polls while the pipeline is active so the
 * list fills in when the order FINISHES; polling is suppressed while realtime is
 * connected (the WebSocket invalidates this key on new events instead).
 */
export function useOrderOwnersQuery(
  orderId: string | undefined,
  statusValue?: string,
  realtimeConnected = false,
) {
  return useQuery({
    queryKey: orderOwnersQueryKey(orderId ?? ''),
    queryFn: () => getOrderOwners(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () =>
      realtimeConnected ? false : isOrderPipelineActive(statusValue) ? 8_000 : false,
  })
}
