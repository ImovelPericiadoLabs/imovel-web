'use client'

import { useMemo } from 'react'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { toOrderRelatedDocuments, type OrderRelatedDocument } from '@/services/orders'

/**
 * Documentos do pedido (matrícula + certidões anexas + laudo). Derivados do detalhe
 * (GET /orders/:id/) na chave `documents` inline — o backend não expõe
 * /orders/:id/documents (404). O laudo (REPORT) é sintetizado quando a consulta está
 * FINISHED (download via GET /analysis/pdfview/:id). `statusValue` é mantido por
 * compatibilidade de assinatura.
 */
export function useOrderDocumentsQuery(
  orderId: string | undefined,
  _statusValue?: string,
  suppressPolling = false,
) {
  const query = useOrderDetailQuery(orderId, suppressPolling)
  const data = useMemo<OrderRelatedDocument[]>(
    () => toOrderRelatedDocuments(query.data),
    [query.data],
  )
  return { ...query, data }
}
