import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { SORT_OPTIONS, type JetimobSortKey } from '@/lib/jetimob-property-filters'
import { cn } from '@/utils/tailwind'

import type { PropertyCatalogView } from './property-catalog-grid'

type PropertyCatalogToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  view: PropertyCatalogView
  onViewChange: (view: PropertyCatalogView) => void
  sort: JetimobSortKey
  onSortChange: (sort: JetimobSortKey) => void
  resultCount: number
  activeFilterCount: number
  onOpenFilters: () => void
}

/** Segmented control grade/lista — mesmo par de botões no desktop e no mobile. */
function ViewToggle({
  view,
  onViewChange,
  className,
}: {
  view: PropertyCatalogView
  onViewChange: (view: PropertyCatalogView) => void
  className?: string
}) {
  const items = [
    { key: 'grid' as const, Icon: LayoutGrid, label: 'Ver em grade' },
    { key: 'list' as const, Icon: List, label: 'Ver em lista' },
  ]

  return (
    <div
      role="group"
      aria-label="Modo de visualização"
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-[var(--radius-jetimob-field)]',
        'border border-[var(--color-jetimob-border-field)] bg-white p-1',
        className,
      )}
    >
      {items.map(({ key, Icon, label }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          aria-pressed={view === key}
          onClick={() => onViewChange(key)}
          className={cn(
            'flex size-9 items-center justify-center rounded-[7px] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
            view === key
              ? 'bg-[var(--color-jetimob-surface-muted)] text-[var(--color-jetimob-accent)]'
              : 'text-[var(--color-jetimob-text-subtle)] hover:text-[var(--color-jetimob-text-body)]',
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </button>
      ))}
    </div>
  )
}

export function PropertyCatalogToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
  sort,
  onSortChange,
  resultCount,
  activeFilterCount,
  onOpenFilters,
}: PropertyCatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: abre a sidebar de filtros como sheet. Oculto a partir de lg. */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'flex h-[var(--size-jetimob-field-h)] w-full items-center justify-center gap-2 lg:hidden',
          'rounded-[var(--radius-jetimob-field)] border border-[var(--color-jetimob-border-field)] bg-white',
          'text-[14px] font-semibold text-[var(--color-jetimob-text-title)] shadow-[var(--shadow-jetimob-panel)]',
          'transition-colors hover:border-[var(--color-jetimob-accent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtros
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--color-jetimob-accent)] text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Busca + toggle: no desktop dividem a linha; no mobile o toggle desce para a
          linha de resultados (como na referência). */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-[var(--size-jetimob-action-h)] flex-1 items-center gap-2.5 px-4',
            'rounded-[var(--radius-jetimob-field)] border border-[var(--color-jetimob-border-field)] bg-white',
            'transition-colors focus-within:border-[var(--color-jetimob-accent)]',
          )}
        >
          <Search className="size-[18px] shrink-0 text-[var(--color-jetimob-text-subtle)]" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por endereço, referência ou código..."
            aria-label="Buscar imóveis"
            className="w-full bg-transparent text-[14px] text-[var(--color-jetimob-text-title)] outline-none placeholder:text-[var(--color-jetimob-text-subtle)]"
          />
        </div>

        <ViewToggle view={view} onViewChange={onViewChange} className="hidden h-[var(--size-jetimob-action-h)] lg:flex" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="shrink-0 whitespace-nowrap text-[13px] text-[var(--color-jetimob-text-muted)]">
          <span className="font-bold text-[var(--color-jetimob-text-title)]">{resultCount}</span>{' '}
          {resultCount === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
        </p>

        <div className="flex min-w-0 items-center gap-2">
          {/* No mobile a ordenação vive dentro do sheet de Filtros (como na referência,
              onde esta linha tem apenas a contagem e o alternador de visualização). */}
          <span className="hidden text-[13px] text-[var(--color-jetimob-text-muted)] sm:inline">
            Ordenar por
          </span>
          <Select value={sort} onValueChange={(v) => onSortChange(v as JetimobSortKey)}>
            <SelectTrigger
              aria-label="Ordenar por"
              className={cn(
                'hidden h-10 w-auto gap-2 rounded-[var(--radius-jetimob-field)] sm:flex sm:min-w-[150px]',
                'border border-[var(--color-jetimob-border-field)] bg-white px-3.5',
                'text-[13px] font-normal text-[var(--color-jetimob-text-title)]',
                'transition-colors hover:border-[var(--color-jetimob-border-strong)]',
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ViewToggle view={view} onViewChange={onViewChange} className="h-10 lg:hidden" />
        </div>
      </div>
    </div>
  )
}
