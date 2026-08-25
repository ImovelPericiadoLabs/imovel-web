import { useMemo, useState } from 'react'
import { Home } from 'lucide-react'

import { useJetimobCatalog } from '@/hooks/use-jetimob-catalog'
import {
  collectFilterOptions,
  EMPTY_JETIMOB_FILTERS,
  filterJetimobProperties,
} from '@/lib/jetimob-property-filters'
import type { JetimobPropertyRow } from '@/services/jetimob'

import { PropertyCatalogList } from './property-catalog-list'
import { PropertyFiltersBar } from './property-filters-bar'

export { PropertyPhoto } from './property-photo'

type PropertyCatalogProps = {
  /** Controla se o hook busca o catálogo (ex.: só quando há sessão Jetimob ativa). */
  enabled: boolean
  selectedCode?: string
  onSelect: (row: JetimobPropertyRow) => void
}

/**
 * Catálogo de imóveis Jetimob com filtros avançados combináveis (tipo, status, cidade,
 * faixa de preço, atualizado desde) e renderização virtualizada — suporta milhares de
 * imóveis sem degradar a performance de scroll/memória (spec 06).
 */
export function PropertyCatalog({ enabled, selectedCode, onSelect }: PropertyCatalogProps) {
  const { items, loading, complete, totalItems, loadedCount, error, reload } =
    useJetimobCatalog(enabled)
  const [filters, setFilters] = useState(EMPTY_JETIMOB_FILTERS)

  const options = useMemo(() => collectFilterOptions(items), [items])
  const filtered = useMemo(() => filterJetimobProperties(items, filters), [items, filters])

  return (
    <div className="flex flex-col gap-3">
      <PropertyFiltersBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_JETIMOB_FILTERS)}
        options={options}
        resultCount={filtered.length}
      />

      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">Sua carteira</h2>
        <span className="text-xs text-gray-400">
          {loading
            ? `Carregando… ${loadedCount}${totalItems ? ` de ${totalItems}` : ''}`
            : `${totalItems ?? loadedCount} ${(totalItems ?? loadedCount) === 1 ? 'imóvel' : 'imóveis'}`}
        </span>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}{' '}
          <button type="button" onClick={reload} className="font-medium underline">
            Tentar de novo
          </button>
        </p>
      )}

      {!error && loading && items.length === 0 ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      ) : !error && complete && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <Home className="mx-auto size-8 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-700">
            {items.length === 0
              ? 'Sua carteira Jetimob ainda não tem imóveis.'
              : 'Nenhum imóvel encontrado para esses filtros.'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {items.length === 0
              ? 'Cadastre um imóvel no painel da Jetimob e ele aparece aqui.'
              : 'Tente ajustar ou limpar os filtros aplicados.'}
          </p>
        </div>
      ) : (
        !error && (
          <PropertyCatalogList items={filtered} selectedCode={selectedCode} onSelect={onSelect} />
        )
      )}
    </div>
  )
}
