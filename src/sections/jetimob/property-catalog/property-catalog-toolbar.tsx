import { LayoutGrid, List, ListFilter, Search } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
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

function ViewToggle({
  view,
  onViewChange,
}: {
  view: PropertyCatalogView
  onViewChange: (view: PropertyCatalogView) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
      {(
        [
          { key: 'grid' as const, Icon: LayoutGrid, label: 'Ver em grade' },
          { key: 'list' as const, Icon: List, label: 'Ver em lista' },
        ]
      ).map(({ key, Icon, label }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          aria-pressed={view === key}
          onClick={() => onViewChange(key)}
          className={cn(
            'flex size-8 items-center justify-center rounded-md transition-colors',
            view === key ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
          )}
        >
          <Icon className="size-4" aria-hidden />
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
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/40 lg:hidden"
      >
        <ListFilter className="size-4" aria-hidden />
        Filtros
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2">
        <label className="group flex h-11 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-sm transition focus-within:border-primary/40">
          <Search className="size-4 shrink-0 text-gray-400 group-focus-within:text-primary" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por endereço, referência ou código…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </label>
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {resultCount} {resultCount === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="hidden sm:inline">Ordenar por</span>
          <Select value={sort} onValueChange={(v) => onSortChange(v as JetimobSortKey)}>
            <SelectTrigger aria-label="Ordenar por" className="h-8 w-auto min-w-32 gap-1.5 border-none bg-transparent px-2 text-xs font-medium text-gray-600 shadow-none hover:bg-gray-50">
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
        </div>
      </div>
    </div>
  )
}
