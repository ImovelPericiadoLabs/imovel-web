import { useState } from 'react'
import { Bookmark, Check, Trash2, X } from 'lucide-react'

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import {
  useJetimobSavedSearches,
  type JetimobSavedSearch,
} from '@/hooks/use-jetimob-saved-searches'
import {
  EMPTY_JETIMOB_FILTERS,
  FILTER_ALL,
  hasActiveJetimobFilters,
  type JetimobPropertyFilters,
} from '@/lib/jetimob-property-filters'
import { cn } from '@/utils/tailwind'

type FilterOptions = {
  propertyTypes: string[]
  statuses: string[]
  cities: string[]
  neighborhoods: string[]
}

type PropertyFiltersPanelProps = {
  filters: JetimobPropertyFilters
  onApply: (next: JetimobPropertyFilters) => void
  options: FilterOptions
  className?: string
  /** Fecha o drawer no mobile após aplicar/limpar — no-op no desktop (sidebar fixa). */
  onDone?: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-gray-500">{children}</label>
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
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className="h-11 w-full transition-shadow focus:ring-2">
          <SelectValue placeholder={emptyLabel} />
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
    </div>
  )
}

function SavedSearchChip({
  entry,
  onApply,
  onRemove,
}: {
  entry: JetimobSavedSearch
  onApply: () => void
  onRemove: () => void
}) {
  return (
    <span className="group inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1 text-xs text-gray-600 transition hover:border-primary/40">
      <button type="button" onClick={onApply} className="truncate font-medium hover:text-primary">
        {entry.label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover busca salva"
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600"
      >
        <Trash2 className="size-3" aria-hidden />
      </button>
    </span>
  )
}

/**
 * Filtros combináveis (AND) — Cidade, Bairro, Tipo, Faixa de preço, Status, Atualizado
 * desde. Estado "rascunho": edições só valem para o catálogo ao clicar "Aplicar filtros"
 * (ou pressionar Enter), espelhando o botão explícito da referência de design. Lógica de
 * combinação em `filterJetimobProperties` (src/lib/jetimob-property-filters.ts).
 */
export function PropertyFiltersPanel({
  filters,
  onApply,
  options,
  className,
  onDone,
}: PropertyFiltersPanelProps) {
  const [draft, setDraft] = useState(filters)
  // Reajusta o rascunho quando `filters` muda por fora (limpar/aplicar busca salva) —
  // ajuste de estado durante o render (padrão oficial do React para "resetar estado
  // quando uma prop muda"), sem precisar de um effect.
  const [committedFilters, setCommittedFilters] = useState(filters)
  if (filters !== committedFilters) {
    setCommittedFilters(filters)
    setDraft(filters)
  }
  const [justSaved, setJustSaved] = useState(false)
  const { searches, saveSearch, removeSearch } = useJetimobSavedSearches()

  const draftActive = hasActiveJetimobFilters(draft)

  const apply = (next: JetimobPropertyFilters) => {
    onApply(next)
    onDone?.()
  }

  const handleSaveSearch = () => {
    saveSearch(draft)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 1800)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        apply(draft)
      }}
      className={cn('flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm', className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Filtros</h2>
        {hasActiveJetimobFilters(filters) && (
          <button
            type="button"
            onClick={() => apply(EMPTY_JETIMOB_FILTERS)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
          >
            <X className="size-3.5" aria-hidden />
            Limpar filtros
          </button>
        )}
      </div>

      {searches.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">Buscas salvas</span>
          <div className="flex flex-wrap gap-1.5">
            {searches.map((entry) => (
              <SavedSearchChip
                key={entry.id}
                entry={entry}
                onApply={() => {
                  setDraft(entry.filters)
                  apply(entry.filters)
                }}
                onRemove={() => removeSearch(entry.id)}
              />
            ))}
          </div>
        </div>
      )}

      <OptionSelect
        label="Cidade"
        value={draft.city}
        onValueChange={(v) => setDraft({ ...draft, city: v })}
        options={options.cities}
        emptyLabel="Todas"
      />

      <OptionSelect
        label="Bairro"
        value={draft.neighborhood}
        onValueChange={(v) => setDraft({ ...draft, neighborhood: v })}
        options={options.neighborhoods}
        emptyLabel="Todos"
      />

      <OptionSelect
        label="Tipo de imóvel"
        value={draft.propertyType}
        onValueChange={(v) => setDraft({ ...draft, propertyType: v })}
        options={options.propertyTypes}
        emptyLabel="Todos"
      />

      <div>
        <FieldLabel>Faixa de preço</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Mínimo"
            aria-label="Preço mínimo"
            value={draft.priceMin}
            onChange={(e) => setDraft({ ...draft, priceMin: e.target.value })}
            className="h-11"
          />
          <span className="shrink-0 text-xs text-gray-400">até</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Máximo"
            aria-label="Preço máximo"
            value={draft.priceMax}
            onChange={(e) => setDraft({ ...draft, priceMax: e.target.value })}
            className="h-11"
          />
        </div>
      </div>

      <OptionSelect
        label="Status do imóvel"
        value={draft.status}
        onValueChange={(v) => setDraft({ ...draft, status: v })}
        options={options.statuses}
        emptyLabel="Todos"
      />

      <div>
        <FieldLabel>Atualizado desde</FieldLabel>
        <Input
          type="date"
          aria-label="Atualizado desde"
          value={draft.updatedSince}
          onChange={(e) => setDraft({ ...draft, updatedSince: e.target.value })}
          className="h-11"
        />
      </div>

      <Button type="submit" className="h-11 w-full justify-center rounded-xl">
        Aplicar filtros
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!draftActive}
        onClick={handleSaveSearch}
        className="h-11 w-full justify-center gap-2 rounded-xl"
      >
        {justSaved ? <Check className="size-4 text-emerald-600" /> : <Bookmark className="size-4" />}
        {justSaved ? 'Busca salva!' : 'Salvar busca'}
      </Button>
    </form>
  )
}
