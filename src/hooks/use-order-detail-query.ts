'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrder, orderQueryKey } from '@/services/orders'
import {
  getOrderRefetchIntervalMs,
  isOrderPaymentConfirmed,
} from '@/domain/order-journey'

/**
 * Shared order detail query with adaptive polling by `status.value`
 * (SEARCHING_DOCUMENT / IN_PROGRESS vs terminals). Polling is suppressed
 * while `realtimeConnected` is true (WebSocket drives updates instead) and
 * automatically resumes as a fallback if the realtime channel drops.
 */
export function useOrderDetailQuery(
  orderId: string | undefined,
  realtimeConnected = false,
) {
  return useQuery({
    queryKey: orderQueryKey(orderId ?? ''),
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: (q) => {
      if (realtimeConnected) return false
      return getOrderRefetchIntervalMs(q.state.data?.status?.value, {
        paymentConfirmed: isOrderPaymentConfirmed(q.state.data?.payment_status),
      })
    },
  })
}
