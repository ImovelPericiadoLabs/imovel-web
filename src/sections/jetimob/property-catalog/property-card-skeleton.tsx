import { Skeleton } from '@/components/ui'

/**
 * Espelha a estrutura/dimensões exatas de `PropertyCard` (mesma aspect-ratio de foto,
 * mesmas alturas de linha e paddings) — a troca skeleton → card real não causa layout
 * shift, porque cada bloco já ocupa o espaço final antes do conteúdo chegar.
 */
export function PropertyCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius-jetimob-card)] border border-[var(--color-jetimob-border)] bg-[var(--color-jetimob-surface)] p-3 shadow-[var(--shadow-jetimob-card)]">
        <Skeleton className="size-[92px] shrink-0 rounded-[10px]" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-[15px] w-2/5" />
          <Skeleton className="h-[13px] w-3/5" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="hidden h-11 w-32 shrink-0 rounded-[var(--radius-jetimob-field)] sm:block" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-jetimob-card)] border border-[var(--color-jetimob-border)] bg-[var(--color-jetimob-surface)] shadow-[var(--shadow-jetimob-card)]">
      <Skeleton className="aspect-[3/2] w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-[15px] w-3/5" />
        <div className="mt-1.5 space-y-1">
          <Skeleton className="h-[13px] w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="mt-3 h-4 w-44" />
        <Skeleton className="mt-3 h-5 w-32" />
        <div className="mt-2.5 flex items-center gap-2">
          <Skeleton className="h-4 w-14 rounded-[var(--radius-jetimob-chip)]" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-[var(--radius-jetimob-field)]" />
      </div>
    </div>
  )
}
