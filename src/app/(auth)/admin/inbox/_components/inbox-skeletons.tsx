'use client'

import { cn } from '@/utils/tailwind'

export function InboxListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 p-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2.5 rounded-lg px-2 py-2.5">
          <div className="size-10 shrink-0 animate-pulse rounded-full bg-[rgba(148,151,169,0.2)]" />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[rgba(148,151,169,0.2)]" />
            <div className="h-2.5 w-full animate-pulse rounded bg-[rgba(148,151,169,0.14)]" />
            <div className="h-2 w-1/3 animate-pulse rounded bg-[rgba(148,151,169,0.12)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InboxThreadSkeleton() {
  return (
    <div className={cn('flex flex-1 flex-col gap-3 px-4 py-6')} aria-hidden>
      <div className="ml-auto h-14 w-[55%] animate-pulse rounded-2xl bg-[rgba(113,50,245,0.12)]" />
      <div className="h-12 w-[50%] animate-pulse rounded-2xl bg-[rgba(148,151,169,0.16)]" />
      <div className="ml-auto h-10 w-[40%] animate-pulse rounded-2xl bg-[rgba(113,50,245,0.12)]" />
    </div>
  )
}
