import { describe, expect, it } from 'vitest'

import {
  buildJetimobConsultPrefill,
  type JetimobConsultModeDraft,
} from './jetimob-consult-prefill'

const MODE: JetimobConsultModeDraft = {
  available: true,
  form: { entryPath: 'address' },
  initial_flow: 'address',
}

describe('buildJetimobConsultPrefill', () => {
  it('carrega o opt-in de writeback escolhido pelo corretor', () => {
    const prefill = buildJetimobConsultPrefill('34462', MODE, 'address', '42', true)
    expect(prefill.writeback).toBe(true)
    expect(prefill.propertyCode).toBe('34462')
    expect(prefill.systemId).toBe('42')
  })

  it('preserva o opt-out explícito', () => {
    expect(buildJetimobConsultPrefill('1', MODE, 'address', '42', false).writeback).toBe(false)
  })

  it('sem o argumento, o padrão é não enviar nada de volta à Jetimob', () => {
    expect(buildJetimobConsultPrefill('1', MODE, 'address').writeback).toBe(false)
  })
})
