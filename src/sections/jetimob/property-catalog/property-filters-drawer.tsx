import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import type { JetimobPropertyFilters } from '@/lib/jetimob-property-filters'

import { PropertyFiltersPanel } from './property-filters-panel'

type FilterOptions = {
  propertyTypes: string[]
  statuses: string[]
  cities: string[]
  neighborhoods: string[]
}

type PropertyFiltersDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: JetimobPropertyFilters
  onApply: (next: JetimobPropertyFilters) => void
  options: FilterOptions
}

/**
 * Sheet mobile para os filtros — mesmo `PropertyFiltersPanel` do desktop, só a moldura
 * muda (bottom sheet em vez de sidebar fixa). Fecha sozinho ao aplicar/limpar
 * (`onDone`), então o usuário já vê o resultado sem precisar de um segundo toque.
 */
export function PropertyFiltersDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
  options,
}: PropertyFiltersDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="jetimob-drawer-backdrop-in fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="jetimob-drawer-panel-in fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl bg-background shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="relative flex shrink-0 items-center justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-gray-200" aria-hidden />
            <DialogPrimitive.Close className="absolute right-3 top-2 flex size-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <X className="size-4" aria-hidden />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">Filtros do catálogo</DialogPrimitive.Title>

          <div className="overflow-y-auto px-4 pb-6">
            <PropertyFiltersPanel
              filters={filters}
              onApply={onApply}
              options={options}
              onDone={() => onOpenChange(false)}
              className="border-0 p-0 shadow-none"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
