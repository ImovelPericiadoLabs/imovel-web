import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { JetimobPropertyRow } from '@/services/jetimob'

import { PropertyCard } from './property-card'
import { PropertyCardSkeleton } from './property-card-skeleton'

export type PropertyCatalogView = 'grid' | 'list'

const GRID_ROW_HEIGHT_ESTIMATE = 400
const LIST_ROW_HEIGHT_ESTIMATE = 104
const ROW_GAP_PX = 16
const CONTAINER_MAX_HEIGHT_PX = 900

type PropertyCatalogGridProps = {
  items: JetimobPropertyRow[]
  view: PropertyCatalogView
  selectedCode?: string
  onSelect: (row: JetimobPropertyRow) => void
  /** Skeletons extras no fim da lista enquanto o catálogo completo ainda está carregando. */
  loadingMore?: boolean
}

/** Colunas por largura do CONTAINER (não do viewport) — funciona igual dentro de layouts
 * com sidebar de largura variável, sem depender de media query do documento inteiro. */
function columnsForWidth(width: number): number {
  if (width >= 900) return 3
  if (width >= 560) return 2
  return 1
}

/**
 * Grid/lista virtualizada por LINHA: o número de colunas é medido via ResizeObserver do
 * próprio container (não do viewport), então o grid se adapta corretamente mesmo
 * compartilhando espaço com outra coluna (ex.: painel de consulta ao lado). Cada linha
 * vira um item do virtualizer — o DOM nunca cresce com o tamanho do catálogo.
 */
export function PropertyCatalogGrid({
  items,
  view,
  selectedCode,
  onSelect,
  loadingMore,
}: PropertyCatalogGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const el = parentRef.current
    if (!el) return undefined

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth
      setColumns(view === 'list' ? 1 : columnsForWidth(width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [view])

  const effectiveColumns = view === 'list' ? 1 : columns
  const rowCount = Math.ceil(items.length / effectiveColumns) + (loadingMore ? 1 : 0)
  const estimateRowHeight = view === 'list' ? LIST_ROW_HEIGHT_ESTIMATE : GRID_ROW_HEIGHT_ESTIMATE

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight + ROW_GAP_PX,
    overscan: 4,
  })

  const isSkeletonRow = (rowIndex: number) => loadingMore && rowIndex === rowCount - 1

  return (
    <div
      ref={parentRef}
      data-testid="jetimob-catalog-grid"
      className="overflow-y-auto"
      style={{ maxHeight: CONTAINER_MAX_HEIGHT_PX }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowStart = virtualRow.index * effectiveColumns
          const rowItems = isSkeletonRow(virtualRow.index)
            ? []
            : items.slice(rowStart, rowStart + effectiveColumns)

          return (
            <div
              key={virtualRow.key}
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
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}
              >
                {isSkeletonRow(virtualRow.index)
                  ? Array.from({ length: effectiveColumns }).map((_, i) => (
                      <PropertyCardSkeleton key={i} layout={view} />
                    ))
                  : rowItems.map((row, colIndex) => {
                      const code = String(row.code || '')
                      return (
                        <PropertyCard
                          key={code || `${virtualRow.index}-${colIndex}`}
                          property={row}
                          layout={view}
                          selected={Boolean(code) && selectedCode === code}
                          onSelect={onSelect}
                          animationDelayMs={Math.min(colIndex * 40, 160)}
                        />
                      )
                    })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
