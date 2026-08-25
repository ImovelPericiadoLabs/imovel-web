import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight } from 'lucide-react'

import type { JetimobPropertyRow } from '@/services/jetimob'
import { cn } from '@/utils/tailwind'

import { PropertyPhoto } from './property-photo'

const ROW_HEIGHT_PX = 96
const ROW_GAP_PX = 8
const LIST_MAX_HEIGHT_PX = 640

type PropertyCatalogListProps = {
  items: JetimobPropertyRow[]
  selectedCode?: string
  onSelect: (row: JetimobPropertyRow) => void
}

/**
 * Renderiza só as linhas visíveis (+ overscan) via `@tanstack/react-virtual`, mantendo
 * performance de scroll com milhares de imóveis carregados (spec 06 — Jetimob). O DOM
 * nunca cresce com o tamanho do catálogo, só com o viewport.
 */
export function PropertyCatalogList({ items, selectedCode, onSelect }: PropertyCatalogListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX + ROW_GAP_PX,
    overscan: 8,
  })

  return (
    <div
      ref={parentRef}
      data-testid="jetimob-catalog-list"
      className="overflow-y-auto"
      style={{ maxHeight: LIST_MAX_HEIGHT_PX }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = items[virtualRow.index]
          const code = String(row.code || '')
          const isSelected = Boolean(code) && selectedCode === code
          const title = row.title || (code ? `Imóvel ${code}` : `Imóvel ${virtualRow.index + 1}`)

          return (
            <div
              key={code || virtualRow.index}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: ROW_GAP_PX,
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(row)}
                disabled={!code}
                style={{ height: ROW_HEIGHT_PX }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-100 hover:border-primary/40 hover:shadow-md',
                )}
              >
                <span className="size-16 shrink-0 overflow-hidden rounded-xl md:size-20">
                  <PropertyPhoto photo={row.photo} title={title} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{title}</span>
                  {row.address && (
                    <span className="mt-0.5 block truncate text-xs text-gray-500">{row.address}</span>
                  )}
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {code && (
                      <span className="inline-block rounded-md bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                        #{code}
                      </span>
                    )}
                    {row.property_type && (
                      <span className="inline-block rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        {row.property_type}
                      </span>
                    )}
                    {row.status && (
                      <span className="inline-block rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        {row.status}
                      </span>
                    )}
                  </span>
                </span>

                <ChevronRight
                  className={cn('size-5 shrink-0 transition', isSelected ? 'text-primary' : 'text-gray-300')}
                  aria-hidden
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
