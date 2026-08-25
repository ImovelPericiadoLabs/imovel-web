import { useState } from 'react'
import { Bookmark, Check, Trash2, X } from 'lucide-react'

import {
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
  SORT_OPTIONS,
  type JetimobPropertyFilters,
  type JetimobSortKey,
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
  /** Fecha o sheet no mobile após aplicar/limpar — no-op no desktop (sidebar fixa). */
  onDone?: () => void
  /** Ordenação: só renderizada no mobile, onde a toolbar não exibe o seletor. */
  sort?: JetimobSortKey
  onSortChange?: (sort: JetimobSortKey) => void
}

/** Campo de formulário: rótulo + controle, com o mesmo ritmo vertical da referência. */
function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-medium leading-none text-[var(--color-jetimob-text-body)]"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const FIELD_CLASS = cn(
  'h-[var(--size-jetimob-field-h)] w-full rounded-[var(--radius-jetimob-field)]',
  'border border-[var(--color-jetimob-border-field)] bg-white px-3.5',
  'text-[14px] text-[var(--color-jetimob-text-title)] placeholder:text-[var(--color-jetimob-text-subtle)]',
  'transition-colors hover:border-[var(--color-jetimob-border-strong)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-1',
)

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
    <Field label={label}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className={cn(FIELD_CLASS, 'justify-between font-normal')}>
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
    </Field>
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
    <span className="group inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--color-jetimob-border-field)] bg-[var(--color-jetimob-surface-muted)] py-1 pl-3 pr-1 text-[12px] text-[var(--color-jetimob-text-body)] transition-colors hover:border-[var(--color-jetimob-accent)]">
      <button
        type="button"
        onClick={onApply}
        className="truncate font-medium hover:text-[var(--color-jetimob-accent)]"
      >
        {entry.label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover busca salva ${entry.label}`}
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-jetimob-text-subtle)] transition hover:bg-[var(--color-jetimob-border)] hover:text-[var(--color-jetimob-text-body)]"
      >
        <Trash2 className="size-3" aria-hidden />
      </button>
    </span>
  )
}

/**
 * Filtros combináveis (AND) — Cidade, Bairro, Tipo, Faixa de preço, Status, Atualizado
 * desde. Estado "rascunho": edições só valem para o catálogo ao submeter o formulário
 * ("Aplicar filtros" ou Enter), espelhando o botão explícito da referência de design.
 * Um único componente serve a sidebar do desktop e o sheet do mobile.
 */
export function PropertyFiltersPanel({
  filters,
  onApply,
  options,
  className,
  onDone,
  sort,
  onSortChange,
}: PropertyFiltersPanelProps) {
  const [draft, setDraft] = useState(filters)
  // Reajusta o rascunho quando `filters` muda por fora (limpar / aplicar busca salva) —
  // ajuste de estado durante o render, o padrão oficial do React para "resetar estado
  // quando uma prop muda", sem effect.
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
      aria-label="Filtros do catálogo"
      className={cn(
        'flex flex-col gap-5 rounded-[var(--radius-jetimob-panel)] border border-[var(--color-jetimob-border)]',
        'bg-[var(--color-jetimob-surface)] p-6 shadow-[var(--shadow-jetimob-panel)]',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold leading-none text-[var(--color-jetimob-text-title)]">Filtros</h2>
        {hasActiveJetimobFilters(filters) && (
          <button
            type="button"
            onClick={() => apply(EMPTY_JETIMOB_FILTERS)}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-jetimob-text-muted)] transition-colors hover:text-[var(--color-jetimob-accent)]"
          >
            <X className="size-3.5" aria-hidden />
            Limpar filtros
          </button>
        )}
      </div>

      {searches.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium leading-none text-[var(--color-jetimob-text-body)]">
            Buscas salvas
          </span>
          <div className="flex flex-wrap gap-1.5">
            {searches.map((entry) => (
              <SavedSearchChip
                key={entry.id}
                entry={entry}
                onApply={() => apply(entry.filters)}
                onRemove={() => removeSearch(entry.id)}
              />
            ))}
          </div>
        </div>
      )}

      {sort && onSortChange && (
        <div className="lg:hidden">
          <Field label="Ordenar por">
            <Select value={sort} onValueChange={(v) => onSortChange(v as JetimobSortKey)}>
              <SelectTrigger aria-label="Ordenar por" className={cn(FIELD_CLASS, 'justify-between font-normal')}>
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
          </Field>
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

      <fieldset>
        <legend className="mb-2 block text-[13px] font-medium leading-none text-[var(--color-jetimob-text-body)]">
          Faixa de preço
        </legend>
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Mínimo"
            aria-label="Preço mínimo"
            value={draft.priceMin}
            onChange={(e) => setDraft({ ...draft, priceMin: e.target.value })}
            className={cn(FIELD_CLASS, 'min-w-0 flex-1')}
          />
          <span className="shrink-0 text-[13px] text-[var(--color-jetimob-text-muted)]">até</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Máximo"
            aria-label="Preço máximo"
            value={draft.priceMax}
            onChange={(e) => setDraft({ ...draft, priceMax: e.target.value })}
            className={cn(FIELD_CLASS, 'min-w-0 flex-1')}
          />
        </div>
      </fieldset>

      <OptionSelect
        label="Status do imóvel"
        value={draft.status}
        onValueChange={(v) => setDraft({ ...draft, status: v })}
        options={options.statuses}
        emptyLabel="Todos"
      />

      <Field label="Atualizado desde" htmlFor="jetimob-updated-since">
        <input
          id="jetimob-updated-since"
          type="date"
          value={draft.updatedSince}
          onChange={(e) => setDraft({ ...draft, updatedSince: e.target.value })}
          className={FIELD_CLASS}
        />
      </Field>

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="submit"
          className={cn(
            'flex h-[var(--size-jetimob-action-h)] w-full items-center justify-center rounded-[var(--radius-jetimob-field)]',
            'bg-[var(--color-jetimob-accent)] text-[14px] font-semibold text-white',
            'transition-colors hover:bg-[var(--color-jetimob-accent-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
          )}
        >
          Aplicar filtros
        </button>

        <button
          type="button"
          disabled={!draftActive}
          onClick={handleSaveSearch}
          className={cn(
            'flex h-[var(--size-jetimob-action-h)] w-full items-center justify-center gap-2 rounded-[var(--radius-jetimob-field)]',
            'border border-[var(--color-jetimob-border-field)] bg-white',
            'text-[14px] font-semibold text-[var(--color-jetimob-text-title)]',
            'transition-colors hover:border-[var(--color-jetimob-accent)] hover:bg-[var(--color-jetimob-surface-muted)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--color-jetimob-border-field)] disabled:hover:bg-white',
          )}
        >
          {justSaved ? (
            <Check className="size-4 text-emerald-600" aria-hidden />
          ) : (
            <Bookmark className="size-4" aria-hidden />
          )}
          {justSaved ? 'Busca salva!' : 'Salvar busca'}
        </button>
      </div>
    </form>
  )
}
