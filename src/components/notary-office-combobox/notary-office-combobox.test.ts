import { describe, it, expect } from 'vitest'
import { formatNotaryForOrder } from './notary-office-combobox'
import type { NotaryOfficeRow } from '@/types/notaries-compact'

describe('formatNotaryForOrder', () => {
  it('não duplica ordinal quando o label já traz o grau (ex.: São Paulo)', () => {
    const row: NotaryOfficeRow = [
      'SP',
      'São Paulo',
      4,
      '12º OFICIAL DE REGISTRO DE IMÓVEIS DA COMARCA DE SÃO PAULO - SP',
    ]
    expect(formatNotaryForOrder(row)).toBe(
      '12º OFICIAL DE REGISTRO DE IMÓVEIS DA COMARCA DE SÃO PAULO - SP',
    )
  })

  it('prefixa o número da linha quando o label não tem grau no início', () => {
    const row: NotaryOfficeRow = ['AC', 'Acrelândia', 1, 'OFICIAL DE REGISTRO DE IMÓVEIS DE ACRELÂNDIA - AC']
    expect(formatNotaryForOrder(row)).toBe('1º OFICIAL DE REGISTRO DE IMÓVEIS DE ACRELÂNDIA - AC')
  })

  it('aceita grau com símbolo de grau (U+00B0) no label', () => {
    const row: NotaryOfficeRow = ['SP', 'São Paulo', 99, '3° OFICIAL DE TESTE - SP']
    expect(formatNotaryForOrder(row)).toBe('3° OFICIAL DE TESTE - SP')
  })
})
