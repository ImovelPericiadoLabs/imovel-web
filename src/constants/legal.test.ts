import { describe, expect, it } from 'vitest'
import { getLegalDocument } from './legal'

describe('getLegalDocument', () => {
  it('normaliza maiúsculas e barras finais', () => {
    expect(getLegalDocument('Politica-de-privacidade')).toMatchObject({
      slug: 'politica-de-privacidade',
    })
    expect(getLegalDocument('termos-de-servico/')).toMatchObject({ slug: 'termos-de-servico' })
  })

  it('resolve aliases comuns', () => {
    expect(getLegalDocument('privacidade')).toMatchObject({ slug: 'politica-de-privacidade' })
    expect(getLegalDocument('termos')).toMatchObject({ slug: 'termos-de-servico' })
  })

  it('retorna null para slug desconhecido', () => {
    expect(getLegalDocument('inexistente-xyz')).toBeNull()
  })
})
