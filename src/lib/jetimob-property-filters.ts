import type { JetimobPropertyRow } from '@/services/jetimob'

/** Sentinela usado nos `<Select>` (Radix não aceita `value=""` em `SelectItem`). */
export const FILTER_ALL = 'all'

export type JetimobPropertyFilters = {
  search: string
  propertyType: string
  status: string
  city: string
  priceMin: string
  priceMax: string
  /** ISO `YYYY-MM-DD`; filtra imóveis atualizados NESTA data ou depois. */
  updatedSince: string
}

export const EMPTY_JETIMOB_FILTERS: JetimobPropertyFilters = {
  search: '',
  propertyType: FILTER_ALL,
  status: FILTER_ALL,
  city: FILTER_ALL,
  priceMin: '',
  priceMax: '',
  updatedSince: '',
}

export function hasActiveJetimobFilters(filters: JetimobPropertyFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.propertyType !== FILTER_ALL ||
    filters.status !== FILTER_ALL ||
    filters.city !== FILTER_ALL ||
    filters.priceMin.trim() !== '' ||
    filters.priceMax.trim() !== '' ||
    filters.updatedSince.trim() !== ''
  )
}

/** Preço de referência do imóvel para o filtro de faixa: venda se houver, senão locação. */
function referencePrice(row: JetimobPropertyRow): number | null {
  if (typeof row.sale_price === 'number') return row.sale_price
  if (typeof row.rent_price === 'number') return row.rent_price
  return null
}

function matchesText(value: string | undefined, query: string): boolean {
  return (value || '').toLocaleLowerCase().includes(query)
}

/**
 * Filtro combinado (AND) sobre o catálogo já carregado. Roda inteiramente no cliente
 * sobre dados normalizados pelo backend — nenhum critério é repassado como parâmetro
 * adivinhado para a API real da Jetimob (evita imprecisão por nome de campo incorreto).
 *
 * Precisão: quando um imóvel não tem o dado necessário para avaliar um filtro ativo
 * (ex.: `updated_at` vazio com `updatedSince` preenchido), ele é EXCLUÍDO — nunca incluído
 * por omissão — para não sugerir um resultado que não foi de fato verificado.
 */
export function filterJetimobProperties(
  items: JetimobPropertyRow[],
  filters: JetimobPropertyFilters,
): JetimobPropertyRow[] {
  const search = filters.search.trim().toLocaleLowerCase()
  const priceMin = filters.priceMin.trim() ? Number(filters.priceMin) : null
  const priceMax = filters.priceMax.trim() ? Number(filters.priceMax) : null
  const updatedSince = filters.updatedSince.trim() || null

  return items.filter((row) => {
    if (search) {
      const matches =
        matchesText(row.code, search) ||
        matchesText(row.title, search) ||
        matchesText(row.address, search)
      if (!matches) return false
    }

    if (filters.propertyType !== FILTER_ALL && row.property_type !== filters.propertyType) {
      return false
    }

    if (filters.status !== FILTER_ALL && row.status !== filters.status) {
      return false
    }

    if (filters.city !== FILTER_ALL && row.city !== filters.city) {
      return false
    }

    if (priceMin !== null || priceMax !== null) {
      const price = referencePrice(row)
      if (price === null) return false
      if (priceMin !== null && price < priceMin) return false
      if (priceMax !== null && price > priceMax) return false
    }

    if (updatedSince) {
      if (!row.updated_at) return false
      const updatedDate = row.updated_at.slice(0, 10)
      if (updatedDate < updatedSince) return false
    }

    return true
  })
}

/** Opções distintas encontradas no catálogo carregado — evita hardcode de vocabulário Jetimob. */
export function collectFilterOptions(items: JetimobPropertyRow[]) {
  const types = new Set<string>()
  const statuses = new Set<string>()
  const cities = new Set<string>()

  for (const row of items) {
    if (row.property_type) types.add(row.property_type)
    if (row.status) statuses.add(row.status)
    if (row.city) cities.add(row.city)
  }

  const sortBR = (a: string, b: string) => a.localeCompare(b, 'pt-BR')

  return {
    propertyTypes: Array.from(types).sort(sortBR),
    statuses: Array.from(statuses).sort(sortBR),
    cities: Array.from(cities).sort(sortBR),
  }
}
