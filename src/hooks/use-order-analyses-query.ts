'use client'

import { useQuery } from '@tanstack/react-query'

import {
  getOrderAnalyses,
  orderAnalysesQueryKey,
  toOrderAnalysisResult,
  type OrderAnalysisResult,
} from '@/services/orders'
import { isOrderPipelineActive } from '@/domain/order-journey'

/**
 * Per-agent analysis verdicts (GET /orders/:id/analyses) mapped to the
 * OrderAnalysisList shape (title + semaphore color + reason). Polls while the
 * pipeline is active; suppressed when realtime is connected.
 */
export function useOrderAnalysesQuery(
  orderId: string | undefined,
  statusValue?: string,
  realtimeConnected = false,
) {
  return useQuery<OrderAnalysisResult[]>({
    queryKey: orderAnalysesQueryKey(orderId ?? ''),
    queryFn: async () => (await getOrderAnalyses(orderId!)).map(toOrderAnalysisResult),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: () =>
      realtimeConnected ? false : isOrderPipelineActive(statusValue) ? 8_000 : false,
  })
}
