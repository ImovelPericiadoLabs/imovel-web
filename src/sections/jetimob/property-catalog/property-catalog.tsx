import { useMemo, useState } from 'react'
import { AlertTriangle, Home, RefreshCw, SearchX } from 'lucide-react'

import { useJetimobCatalog } from '@/hooks/use-jetimob-catalog'
import {
  collectFilterOptions,
  EMPTY_JETIMOB_FILTERS,
  filterJetimobProperties,
  sortJetimobProperties,
  type JetimobSortKey,
} from '@/lib/jetimob-property-filters'
import type { JetimobPropertyRow } from '@/services/jetimob'

import { CatalogLoadingIllustration } from './catalog-loading-illustration'
import { PropertyCardSkeleton } from './property-card-skeleton'
import { PropertyCatalogGrid, type PropertyCatalogView } from './property-catalog-grid'
import { PropertyCatalogToolbar } from './property-catalog-toolbar'
import { PropertyFiltersDrawer } from './property-filters-drawer'
import { PropertyFiltersPanel } from './property-filters-panel'

export { PropertyPhoto } from './property-photo'

type PropertyCatalogProps = {
  /** Controla se o hook busca o catálogo (ex.: só quando há sessão Jetimob ativa). */
  enabled: boolean
  selectedCode?: string
  onSelect: (row: JetimobPropertyRow) => void
}

const SKELETON_ROWS_INITIAL = 6

function EmptyState({ hasItems, onClear }: { hasItems: boolean; onClear?: () => void }) {
  return (
    <div className="jetimob-card-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
      {hasItems ? (
        <SearchX className="size-9 text-gray-300" aria-hidden />
      ) : (
        <Home className="size-9 text-gray-300" aria-hidden />
      )}
      <p className="mt-3 text-sm font-medium text-gray-700">
        {hasItems ? 'Nenhum imóvel encontrado para esses filtros.' : 'Sua carteira Jetimob ainda não tem imóveis.'}
      </p>
      <p className="mt-1 max-w-xs text-xs text-gray-400">
        {hasItems
          ? 'Tente ajustar a faixa de preço, cidade ou limpar os filtros aplicados.'
          : 'Cadastre um imóvel no painel da Jetimob e ele aparece aqui automaticamente.'}
      </p>
      {hasItems && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="jetimob-card-in flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-8 text-center shadow-sm">
      <AlertTriangle className="size-8 text-red-400" aria-hidden />
      <p className="text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Tentar de novo
      </button>
    </div>
  )
}

/**
 * Catálogo de imóveis Jetimob: filtros avançados combináveis (cidade, bairro, tipo,
 * status, faixa de preço, atualizado desde), busca textual instantânea, ordenação,
 * alternância grade/lista e renderização virtualizada — suporta milhares de imóveis
 * sem degradar performance de scroll/memória (spec 06). Sidebar fixa no desktop,
 * drawer no mobile — mesmo componente de filtros nos dois (`PropertyFiltersPanel`).
 */
export function PropertyCatalog({ enabled, selectedCode, onSelect }: PropertyCatalogProps) {
  const { items, loading, complete, totalItems, loadedCount, error, reload } =
    useJetimobCatalog(enabled)
  const [filters, setFilters] = useState(EMPTY_JETIMOB_FILTERS)
  const [view, setView] = useState<PropertyCatalogView>('grid')
  const [sort, setSort] = useState<JetimobSortKey>('recent')
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)

  const options = useMemo(() => collectFilterOptions(items), [items])
  const filtered = useMemo(() => filterJetimobProperties(items, filters), [items, filters])
  const sorted = useMemo(() => sortJetimobProperties(filtered, sort), [filtered, sort])

  const activeFilterCount = [
    filters.city,
    filters.neighborhood,
    filters.propertyType,
    filters.status,
  ].filter((v) => v !== 'all').length + (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.updatedSince ? 1 : 0)

  const isInitialLoading = loading && items.length === 0
  const showEmpty = !error && complete && sorted.length === 0
  const showGrid = !error && !isInitialLoading && !showEmpty

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* Sidebar de filtros — fixa no desktop, oculta no mobile (vira drawer). */}
      <aside className="hidden shrink-0 lg:block lg:w-72 lg:sticky lg:top-6">
        <PropertyFiltersPanel filters={filters} onApply={setFilters} options={options} />
      </aside>

      <PropertyFiltersDrawer
        open={filtersDrawerOpen}
        onOpenChange={setFiltersDrawerOpen}
        filters={filters}
        onApply={setFilters}
        options={options}
      />

      <div className="min-w-0 flex-1">
        <PropertyCatalogToolbar
          search={filters.search}
          onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={setSort}
          resultCount={sorted.length}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFiltersDrawerOpen(true)}
        />

        <div className="mt-3">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : isInitialLoading ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <CatalogLoadingIllustration className="size-24 text-primary" />
                <p className="text-xs font-medium text-gray-500">
                  Carregando sua carteira Jetimob{loadedCount ? ` — ${loadedCount} encontrados…` : '…'}
                </p>
              </div>
              <div
                className="grid w-full gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
              >
                {Array.from({ length: SKELETON_ROWS_INITIAL }).map((_, i) => (
                  <PropertyCardSkeleton key={i} layout={view} />
                ))}
              </div>
            </div>
          ) : showEmpty ? (
            <EmptyState
              hasItems={items.length > 0}
              onClear={items.length > 0 ? () => setFilters(EMPTY_JETIMOB_FILTERS) : undefined}
            />
          ) : (
            showGrid && (
              <PropertyCatalogGrid
                items={sorted}
                view={view}
                selectedCode={selectedCode}
                onSelect={onSelect}
                loadingMore={loading}
              />
            )
          )}

          {!error && !isInitialLoading && loading && (
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Carregando mais imóveis… {loadedCount}
              {totalItems ? ` de ${totalItems}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
