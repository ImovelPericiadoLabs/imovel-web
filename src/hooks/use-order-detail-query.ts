'use client'

import { useQuery } from '@tanstack/react-query'

import { getOrder, orderQueryKey } from '@/services/orders'
import {
  getOrderRefetchIntervalMs,
  isOrderPaymentConfirmed,
} from '@/domain/order-journey'

/**
 * Shared order detail query with adaptive polling by `status.value`
 * (SEARCHING_DOCUMENT / IN_PROGRESS vs terminals).
 *
 * `pollingSuppressed` is the WebSocket's veto over the HTTP fallback. Callers pass
 * `!fallbackActive` (see `useOrderRealtime`), NOT `!connected`: a socket that is
 * merely reconnecting must keep polling off, otherwise every drop turns into a burst
 * of `GET /v1/orders/{id}/`. Polling only resumes once the realtime channel has
 * failed repeatedly.
 */
export function useOrderDetailQuery(
  orderId: string | undefined,
  pollingSuppressed = false,
) {
  return useQuery({
    queryKey: orderQueryKey(orderId ?? ''),
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: (q) => {
      if (pollingSuppressed) return false
      return getOrderRefetchIntervalMs(q.state.data?.status?.value, {
        paymentConfirmed: isOrderPaymentConfirmed(q.state.data?.payment_status),
      })
    },
  })
}
