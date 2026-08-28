'use client'

import { useMemo } from 'react'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import type { OwnersDetails } from '@/services/orders'

/**
 * Proprietários do pedido. Derivados do detalhe (GET /orders/:id/) na chave `owners`
 * inline — o backend não expõe /orders/:id/owners (404). A query de detalhe é
 * compartilhada (mesma queryKey), então não há requisição extra; o polling/realtime
 * já é controlado por ela. `statusValue` é mantido por compatibilidade de assinatura.
 */
export function useOrderOwnersQuery(
  orderId: string | undefined,
  _statusValue?: string,
  suppressPolling = false,
) {
  const query = useOrderDetailQuery(orderId, suppressPolling)
  const data = useMemo<OwnersDetails[]>(
    () => query.data?.owners ?? [],
    [query.data],
  )
  return { ...query, data }
}
