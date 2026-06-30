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

  it('usa titulos profissionais por etapa do pipeline', () => {
    expect(formatProcessTitle('Identificando proprietários', 'owners')).toBe(
      'Identificação de proprietários',
    )
    expect(formatProcessTitle('Finalizando relatório', 'finalizing')).toBe(
      'Finalização do relatório',
    )
    expect(formatProcessTitle('Extraindo dados da matrícula', 'enrollment')).toBe(
      'Dados da matrícula',
    )
  })

  it('capitaliza nomes de agente em minusculo', () => {
    expect(formatProcessTitle('Analisando: usufruto', 'agent')).toBe('Usufruto')
    expect(formatProcessTitle('Analisando: ação de publicidade', 'agent')).toBe(
      'Ação de Publicidade',
    )
  })
})
