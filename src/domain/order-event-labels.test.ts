import { describe, expect, it } from 'vitest'

import type { OrderEvent } from '@/services/orders'
import { filterOrderHistoryEvents } from './order-event-labels'

function ev(
  id: string,
  type: string,
  payload?: Record<string, unknown>,
): OrderEvent {
  return {
    id,
    type,
    payload: payload ?? {},
    source: '',
    created_at: '2026-05-22T21:00:00Z',
  }
}

describe('filterOrderHistoryEvents', () => {
  it('omits per-agent ANALYSIS_STEP lines', () => {
    const events = [
      ev('1', 'POST_PAYMENT_DISPATCH_STARTED'),
      ev('2', 'ANALYSIS_STEP', { step: 'started', label: 'Iniciando análise do documento' }),
      ev('3', 'ANALYSIS_STEP', { step: 'owners', label: 'Identificando proprietários' }),
      ev('4', 'ANALYSIS_STEP', {
        step: 'agent',
        label: 'Analisando: Hipoteca',
      }),
      ev('5', 'ANALYSIS_STEP', {
        step: 'agent',
        label: 'Analisando: Penhora',
      }),
      ev('6', 'ANALYSIS_STEP', { step: 'finalizing', label: 'Finalizando relatório' }),
    ]

    const out = filterOrderHistoryEvents(events)
    const labels = out.map((e) => e.payload?.label ?? e.type)

    expect(labels).not.toContain('Analisando: Hipoteca')
    expect(labels).not.toContain('Analisando: Penhora')
    expect(labels).toContain('Iniciando análise do documento')
    expect(labels).toContain('Identificando proprietários')
    expect(labels).toContain('Finalizando relatório')
  })

  it('dedupes consecutive identical labels', () => {
    const events = [
      ev('1', 'ANALYSIS_STEP', { step: 'started', label: 'Iniciando análise do documento' }),
      ev('2', 'ANALYSIS_STEP', { step: 'started', label: 'Iniciando análise do documento' }),
      ev('3', 'ANALYSIS_STEP', { step: 'owners', label: 'Identificando proprietários' }),
    ]

    const out = filterOrderHistoryEvents(events)
    expect(out.filter((e) => e.payload?.label === 'Iniciando análise do documento')).toHaveLength(1)
  })
})
