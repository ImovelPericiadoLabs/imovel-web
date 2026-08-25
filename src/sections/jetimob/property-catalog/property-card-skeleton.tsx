import { Skeleton } from '@/components/ui'
import { cn } from '@/utils/tailwind'

/**
 * Espelha exatamente a estrutura/dimensões de `PropertyCard` (mesma aspect-ratio de
 * foto, mesmas alturas de linha) — troca de skeleton → card real não causa layout
 * shift porque cada bloco já ocupa o espaço final antes do conteúdo chegar.
 */
export function PropertyCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <Skeleton className="size-16 shrink-0 rounded-xl md:size-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm')}>
      <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <div className="min-h-8 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-1 h-6 w-28" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-2 h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
