import { describe, expect, it } from 'vitest'

import type { JetimobPropertyRow } from '@/services/jetimob'

import {
  collectFilterOptions,
  EMPTY_JETIMOB_FILTERS,
  FILTER_ALL,
  filterJetimobProperties,
  hasActiveJetimobFilters,
} from './jetimob-property-filters'

const APARTAMENTO: JetimobPropertyRow = {
  code: 'A1',
  title: 'Apartamento Centro',
  address: 'Rua das Flores, 100 — Centro — Fortaleza/CE',
  property_type: 'Apartamento',
  status: 'Disponível',
  city: 'Fortaleza',
  sale_price: 350_000,
  updated_at: '2026-08-01T10:00:00Z',
}

const CASA: JetimobPropertyRow = {
  code: 'C1',
  title: 'Casa de praia',
  address: 'Av. Beira Mar, 500 — Meireles — Fortaleza/CE',
  property_type: 'Casa',
  status: 'Vendido',
  city: 'Fortaleza',
  sale_price: 900_000,
  updated_at: '2026-06-01T10:00:00Z',
}

const TERRENO_SEM_DATA: JetimobPropertyRow = {
  code: 'T1',
  title: 'Terreno em Aquiraz',
  address: 'Estrada do Coco — Aquiraz/CE',
  property_type: 'Terreno',
  status: 'Disponível',
  city: 'Aquiraz',
  rent_price: 1_500,
}

const ALL = [APARTAMENTO, CASA, TERRENO_SEM_DATA]

describe('hasActiveJetimobFilters', () => {
  it('é false para o estado vazio', () => {
    expect(hasActiveJetimobFilters(EMPTY_JETIMOB_FILTERS)).toBe(false)
  })

  it('é true quando qualquer critério é preenchido', () => {
    expect(hasActiveJetimobFilters({ ...EMPTY_JETIMOB_FILTERS, search: 'casa' })).toBe(true)
    expect(hasActiveJetimobFilters({ ...EMPTY_JETIMOB_FILTERS, priceMin: '100' })).toBe(true)
    expect(hasActiveJetimobFilters({ ...EMPTY_JETIMOB_FILTERS, propertyType: 'Casa' })).toBe(true)
  })
})

describe('filterJetimobProperties', () => {
  it('sem filtros ativos retorna tudo', () => {
    expect(filterJetimobProperties(ALL, EMPTY_JETIMOB_FILTERS)).toEqual(ALL)
  })

  it('busca textual combina código, título e endereço (case-insensitive)', () => {
    expect(filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, search: 'PRAIA' })).toEqual([CASA])
    expect(filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, search: 'a1' })).toEqual([APARTAMENTO])
  })

  it('filtra por tipo de imóvel exato', () => {
    expect(
      filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, propertyType: 'Casa' }),
    ).toEqual([CASA])
  })

  it('filtra por status exato', () => {
    expect(
      filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, status: 'Disponível' }),
    ).toEqual([APARTAMENTO, TERRENO_SEM_DATA])
  })

  it('filtra por cidade exata', () => {
    expect(filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, city: 'Aquiraz' })).toEqual([
      TERRENO_SEM_DATA,
    ])
  })

  it('faixa de preço usa sale_price, com fallback para rent_price', () => {
    const result = filterJetimobProperties(ALL, {
      ...EMPTY_JETIMOB_FILTERS,
      priceMin: '1000',
      priceMax: '400000',
    })
    // Apartamento (350k venda) entra; Terreno (1.500 aluguel, sem venda) entra; Casa (900k) fica de fora.
    expect(result).toEqual([APARTAMENTO, TERRENO_SEM_DATA])
  })

  it('imóvel sem preço é excluído quando a faixa de preço está ativa', () => {
    const semPreco: JetimobPropertyRow = { code: 'X', title: 'Sem preço' }
    const result = filterJetimobProperties([semPreco], { ...EMPTY_JETIMOB_FILTERS, priceMin: '0' })
    expect(result).toEqual([])
  })

  it('updatedSince exclui imóveis sem updated_at (precisão: nunca inclui por omissão)', () => {
    const result = filterJetimobProperties(ALL, {
      ...EMPTY_JETIMOB_FILTERS,
      updatedSince: '2026-07-01',
    })
    expect(result).toEqual([APARTAMENTO])
  })

  it('combina múltiplos critérios com AND', () => {
    const result = filterJetimobProperties(ALL, {
      ...EMPTY_JETIMOB_FILTERS,
      city: 'Fortaleza',
      status: 'Disponível',
    })
    expect(result).toEqual([APARTAMENTO])
  })

  it('FILTER_ALL não restringe o resultado', () => {
    expect(
      filterJetimobProperties(ALL, { ...EMPTY_JETIMOB_FILTERS, propertyType: FILTER_ALL }),
    ).toEqual(ALL)
  })
})

describe('collectFilterOptions', () => {
  it('extrai valores distintos e ordenados sem hardcode de vocabulário', () => {
    expect(collectFilterOptions(ALL)).toEqual({
      propertyTypes: ['Apartamento', 'Casa', 'Terreno'],
      statuses: ['Disponível', 'Vendido'],
      cities: ['Aquiraz', 'Fortaleza'],
    })
  })

  it('lista vazia não quebra', () => {
    expect(collectFilterOptions([])).toEqual({ propertyTypes: [], statuses: [], cities: [] })
  })
})
