'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Home, RefreshCw, SearchX } from 'lucide-react'

import { useJetimobCatalog } from '@/hooks/use-jetimob-catalog'
import {
  collectFilterOptions,
  EMPTY_JETIMOB_FILTERS,
  FILTER_ALL,
  filterJetimobProperties,
  sortJetimobProperties,
  type JetimobSortKey,
} from '@/lib/jetimob-property-filters'
import type { JetimobPropertyRow } from '@/services/jetimob'
import { cn } from '@/utils/tailwind'

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

const INITIAL_SKELETON_COUNT = 6

const STATE_PANEL_CLASS = cn(
  'jetimob-card-in flex flex-col items-center justify-center rounded-[var(--radius-jetimob-panel)]',
  'bg-[var(--color-jetimob-surface)] px-6 py-14 text-center shadow-[var(--shadow-jetimob-panel)]',
)

function EmptyState({ hasItems, onClear }: { hasItems: boolean; onClear?: () => void }) {
  const Icon = hasItems ? SearchX : Home

  return (
    <div className={cn(STATE_PANEL_CLASS, 'border border-dashed border-[var(--color-jetimob-border-strong)]')}>
      <Icon className="size-9 text-[var(--color-jetimob-text-subtle)]" aria-hidden />
      <p className="mt-4 text-[14px] font-semibold text-[var(--color-jetimob-text-title)]">
        {hasItems
          ? 'Nenhum imóvel encontrado para esses filtros.'
          : 'Sua carteira Jetimob ainda não tem imóveis.'}
      </p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--color-jetimob-text-subtle)]">
        {hasItems
          ? 'Tente ajustar a faixa de preço, a cidade, ou limpar os filtros aplicados.'
          : 'Cadastre um imóvel no painel da Jetimob e ele aparece aqui automaticamente.'}
      </p>
      {hasItems && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-[var(--radius-jetimob-field)] bg-[var(--color-jetimob-accent)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-jetimob-accent-hover)]"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={cn(STATE_PANEL_CLASS, 'border border-red-100 bg-red-50/60')}>
      <AlertTriangle className="size-9 text-red-400" aria-hidden />
      <p className="mt-4 max-w-sm text-[14px] text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-jetimob-field)] border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        <RefreshCw className="size-4" aria-hidden />
        Tentar de novo
      </button>
    </div>
  )
}

function LoadingState({ view, loadedCount }: { view: PropertyCatalogView; loadedCount: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CatalogLoadingIllustration className="size-24 text-[var(--color-jetimob-accent)]" />
        <p className="text-[13px] font-medium text-[var(--color-jetimob-text-muted)]">
          Carregando sua carteira Jetimob{loadedCount ? ` — ${loadedCount} encontrados…` : '…'}
        </p>
      </div>
      <div
        className="grid gap-[var(--gap-jetimob-grid)]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
          <PropertyCardSkeleton key={i} layout={view} />
        ))}
      </div>
    </div>
  )
}

/**
 * Catálogo de imóveis Jetimob: sidebar de filtros fixa no desktop (vira sheet no
 * mobile, mesmo componente), busca instantânea, ordenação, alternância grade/lista e
 * grid virtualizado na janela — suporta milhares de imóveis sem caixa de scroll
 * interna, rolando com a página como no design de referência.
 */
export function PropertyCatalog({ enabled, selectedCode, onSelect }: PropertyCatalogProps) {
  const { items, loading, complete, totalItems, loadedCount, error, reload } =
    useJetimobCatalog(enabled)
  const [filters, setFilters] = useState(EMPTY_JETIMOB_FILTERS)
  const [view, setView] = useState<PropertyCatalogView>('grid')
  const [sort, setSort] = useState<JetimobSortKey>('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const options = useMemo(() => collectFilterOptions(items), [items])
  const filtered = useMemo(() => filterJetimobProperties(items, filters), [items, filters])
  const sorted = useMemo(() => sortJetimobProperties(filtered, sort), [filtered, sort])

  const activeFilterCount =
    [filters.city, filters.neighborhood, filters.propertyType, filters.status].filter(
      (v) => v !== FILTER_ALL,
    ).length +
    (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.updatedSince ? 1 : 0)

  const isInitialLoading = loading && items.length === 0
  const isEmpty = !error && complete && sorted.length === 0

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* Sidebar fixa a partir de lg; abaixo disso vira o sheet abaixo. */}
      <aside className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-[var(--size-jetimob-sidebar)]">
        <PropertyFiltersPanel filters={filters} onApply={setFilters} options={options} />
      </aside>

      <PropertyFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={setFilters}
        options={options}
        sort={sort}
        onSortChange={setSort}
      />

      <section className="min-w-0 flex-1" aria-label="Catálogo de imóveis">
        <PropertyCatalogToolbar
          search={filters.search}
          onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={setSort}
          resultCount={sorted.length}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <div className="mt-5">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : isInitialLoading ? (
            <LoadingState view={view} loadedCount={loadedCount} />
          ) : isEmpty ? (
            <EmptyState
              hasItems={items.length > 0}
              onClear={items.length > 0 ? () => setFilters(EMPTY_JETIMOB_FILTERS) : undefined}
            />
          ) : (
            <>
              <PropertyCatalogGrid
                items={sorted}
                view={view}
                selectedCode={selectedCode}
                onSelect={onSelect}
                loadingMore={loading}
              />
              {loading && (
                <p className="mt-1 text-center text-[12px] text-[var(--color-jetimob-text-subtle)]">
                  Carregando mais imóveis… {loadedCount}
                  {totalItems ? ` de ${totalItems}` : ''}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
