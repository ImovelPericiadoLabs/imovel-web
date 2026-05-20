'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function AdminPageShell({
  title,
  description,
  actions,
  children,
  className,
}: Props) {
  return (
    <div className={cn('space-y-6', className)}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-[#101114] sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-[#686b82]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      {children}
    </div>
  )
}
