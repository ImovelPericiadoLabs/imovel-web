'use client'

import { useMemo } from 'react'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import type { OrderAnalysisResult } from '@/services/orders'

/**
 * Veredictos por agente (semáforo + justificativa). Derivados do detalhe
 * (GET /orders/:id/) na chave `analysis` (SINGULAR) inline — o backend não expõe
 * /orders/:id/analyses (404). O shape já vem como OrderAnalysisResult do backend.
 * `statusValue` é mantido por compatibilidade de assinatura.
 */
export function useOrderAnalysesQuery(
  orderId: string | undefined,
  _statusValue?: string,
  suppressPolling = false,
) {
  const query = useOrderDetailQuery(orderId, suppressPolling)
  const data = useMemo<OrderAnalysisResult[]>(
    () => query.data?.analysis ?? [],
    [query.data],
  )
  return { ...query, data }
}
