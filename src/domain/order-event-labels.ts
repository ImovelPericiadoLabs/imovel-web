/**
 * Human-readable labels for backend `OrderEvent.type` values (pt-BR).
 */

import type { OrderEvent } from '@/services/orders'

/** Internal / noisy types — omitted from the customer timeline. */
const HIDDEN_EVENT_TYPES = new Set([
  'POST_PAYMENT_SKIPPED_IDEMPOTENT',
  'POST_PAYMENT_SKIPPED_PERSISTENT_LOCK',
  'FLOW_DISTRIBUTED_LOCK_SKIPPED',
])

const LABELS: Record<string, string> = {
  POST_PAYMENT_DISPATCH_STARTED: 'Consulta registrada — iniciando próxima etapa',
  POST_PAYMENT_DISPATCH_COMPLETED: 'Etapa do processamento concluída',
  POST_PAYMENT_DISPATCH_FAILED: 'Falha temporária — tentaremos novamente',
  POST_PAYMENT_SKIPPED_PAYMENT: 'Aguardando confirmação de pagamento',
  ENRICH_ENQUEUED: 'Enriquecimento do endereço na fila',
  ANALYSIS_ENQUEUED: 'Análise do documento na fila',
  ANALYSIS_STEP: 'Etapa da análise',
  ENRICH_ENQUEUED: 'Completando endereço do imóvel (IA)',
  INFOSIMPLES_SEARCH_ENQUEUED: 'Busca online da matrícula iniciada',
  ONR_SEARCH_ENQUEUED: 'Pedido enviado para busca em cartório (ONR)',
}

export function formatOrderEventLabel(
  type: string,
  payload?: Record<string, unknown>,
): string {
  if (type === 'ANALYSIS_STEP') {
    const label = String(payload?.label || '').trim()
    if (label) return label
  }
  if (type === 'ENRICH_ENQUEUED') {
    return LABELS.ENRICH_ENQUEUED
  }
  return LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase()
}

export function filterCustomerFacingOrderEvents(events: OrderEvent[]): OrderEvent[] {
  return events.filter((e) => !HIDDEN_EVENT_TYPES.has(e.type))
}
