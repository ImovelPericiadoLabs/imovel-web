import { Search, SlidersHorizontal, X } from 'lucide-react'

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import {
  FILTER_ALL,
  hasActiveJetimobFilters,
  type JetimobPropertyFilters,
} from '@/lib/jetimob-property-filters'
import { cn } from '@/utils/tailwind'

type FilterOptions = {
  propertyTypes: string[]
  statuses: string[]
  cities: string[]
}

type PropertyFiltersBarProps = {
  filters: JetimobPropertyFilters
  onChange: (next: JetimobPropertyFilters) => void
  onClear: () => void
  options: FilterOptions
  resultCount: number
  className?: string
}

function OptionSelect({
  label,
  value,
  onValueChange,
  options,
  emptyLabel,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: string[]
  emptyLabel: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label} className="h-10">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={FILTER_ALL}>{emptyLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Filtros avançados do catálogo Jetimob — combináveis (AND): tipo, status, cidade, faixa
 * de preço e data de atualização, além da busca textual. Lógica de combinação em
 * `filterJetimobProperties` (src/lib/jetimob-property-filters.ts), testada isoladamente.
 */
export function PropertyFiltersBar({
  filters,
  onChange,
  onClear,
  options,
  resultCount,
  className,
}: PropertyFiltersBarProps) {
  const active = hasActiveJetimobFilters(filters)

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm', className)}>
      <label className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition focus-within:bg-gray-50">
        <Search className="size-4 shrink-0 text-gray-400 group-focus-within:text-primary" aria-hidden />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar por código, endereço ou título"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <OptionSelect
          label="Tipo de imóvel"
          value={filters.propertyType}
          onValueChange={(v) => onChange({ ...filters, propertyType: v })}
          options={options.propertyTypes}
          emptyLabel="Todos os tipos"
        />
        <OptionSelect
          label="Status"
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v })}
          options={options.statuses}
          emptyLabel="Todos os status"
        />
        <OptionSelect
          label="Cidade"
          value={filters.city}
          onValueChange={(v) => onChange({ ...filters, city: v })}
          options={options.cities}
          emptyLabel="Todas as cidades"
        />
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Preço mín."
          aria-label="Preço mínimo"
          value={filters.priceMin}
          onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
        />
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Preço máx."
          aria-label="Preço máximo"
          value={filters.priceMax}
          onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <SlidersHorizontal className="size-3.5 shrink-0" aria-hidden />
          Atualizado desde
          <input
            type="date"
            aria-label="Atualizado desde"
            value={filters.updatedSince}
            onChange={(e) => onChange({ ...filters, updatedSince: e.target.value })}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/5"
            >
              <X className="size-3.5" aria-hidden />
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
