'use client'

import { useEffect, useRef, useState } from 'react'

import type { JetimobPropertyRow } from '@/services/jetimob'
import { cn } from '@/utils/tailwind'

import { PropertyCard } from './property-card'
import { PropertyCardSkeleton } from './property-card-skeleton'

export type PropertyCatalogView = 'grid' | 'list'

/** Quantos cards entram no DOM por vez (revelação progressiva ao rolar). */
const PAGE_SIZE = 24

type PropertyCatalogGridProps = {
  items: JetimobPropertyRow[]
  view: PropertyCatalogView
  selectedCode?: string
  onSelect: (row: JetimobPropertyRow) => void
  /** Skeletons no fim enquanto o catálogo completo ainda carrega em background. */
  loadingMore?: boolean
}

/**
 * Grade responsiva em fluxo normal (1 → 2 → 3 colunas), como no design de referência:
 * a página rola naturalmente, sem caixa de scroll interna nem posicionamento absoluto.
 *
 * Para não montar milhares de cards de uma vez, revela em blocos de `PAGE_SIZE`
 * conforme o sentinel entra na viewport. Isso mantém o DOM enxuto sem a matemática
 * frágil de altura de linha da virtualização — que, com cards de altura variável,
 * produzia sobras de espaço entre as linhas.
 */
export function PropertyCatalogGrid({
  items,
  view,
  selectedCode,
  onSelect,
  loadingMore,
}: PropertyCatalogGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Nova lista (filtro/ordenação/busca) volta ao primeiro bloco — ajuste de estado
  // durante o render, sem effect.
  const [committedItems, setCommittedItems] = useState(items)
  if (items !== committedItems) {
    setCommittedItems(items)
    setVisibleCount(PAGE_SIZE)
  }

  const hasMore = visibleCount < items.length

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, items.length])

  const visible = items.slice(0, visibleCount)

  return (
    <div data-testid="jetimob-catalog-grid">
      <div
        className={cn(
          'grid gap-[var(--gap-jetimob-grid)]',
          view === 'grid'
            ? // Colunas por largura do CONTAINER: o grid divide espaço com a sidebar de
              // filtros, então media query do viewport daria o número errado.
              '@container [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]'
            : 'grid-cols-1',
        )}
      >
        {visible.map((row, index) => {
          const code = String(row.code || '')
          return (
            <PropertyCard
              key={code || index}
              property={row}
              layout={view}
              selected={Boolean(code) && selectedCode === code}
              onSelect={onSelect}
              animationDelayMs={Math.min((index % PAGE_SIZE) * 25, 200)}
            />
          )
        })}

        {/* Skeletons do carregamento em background ocupam o mesmo espaço do card final. */}
        {loadingMore &&
          Array.from({ length: view === 'list' ? 2 : 3 }).map((_, i) => (
            <PropertyCardSkeleton key={`sk-${i}`} layout={view} />
          ))}
      </div>

      {hasMore && <div ref={sentinelRef} aria-hidden className="h-1 w-full" />}
    </div>
  )
}
