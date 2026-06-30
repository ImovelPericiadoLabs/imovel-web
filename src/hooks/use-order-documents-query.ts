'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrderDocuments, orderDocumentsQueryKey } from '@/services/orders'
import { isOrderPipelineActive } from '@/domain/order-journey'

/**
 * Related documents (GET /orders/:id/documents): matrícula, certidões and the laudo
 * with signed download URLs. Polls while the pipeline is active; suppressed when
 * realtime is connected (the WebSocket invalidates this key on new events).
 */
export function useOrderDocumentsQuery(
  orderId: string | undefined,
  statusValue?: string,
  realtimeConnected = false,
) {
  return useQuery({
    queryKey: orderDocumentsQueryKey(orderId ?? ''),
    queryFn: () => getOrderDocuments(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () =>
      realtimeConnected ? false : isOrderPipelineActive(statusValue) ? 8_000 : false,
  })
}
