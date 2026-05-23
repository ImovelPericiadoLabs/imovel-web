import { describe, expect, it } from 'vitest'

import { formatProcessTitle } from './journey-live-process'

describe('formatProcessTitle', () => {
  it('remove prefixo Analisando e usa agent_title quando existir', () => {
    expect(
      formatProcessTitle('Analisando: Usufruto', 'agent', 'Usufruto'),
    ).toBe('Usufruto')
    expect(formatProcessTitle('Analisando: Ação de Publicidade', 'agent')).toBe(
      'Ação de Publicidade',
    )
  })

  it('encurta outros passos do pipeline', () => {
    expect(formatProcessTitle('Identificando proprietários', 'owners')).toBe(
      'proprietários',
    )
    expect(formatProcessTitle('Finalizando relatório', 'finalizing')).toBe(
      'relatório',
    )
  })
})
