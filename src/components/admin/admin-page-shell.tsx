'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'

type Props = {
  title?: string
  description?: string
  actions?: ReactNode
  metrics?: ReactNode
  children: ReactNode
  className?: string
  /** Sem toolbar — filho preenche altura (inbox). */
  flush?: boolean
}

/** Layout de página admin — título na topbar; métricas e ações compactas. */
export default function AdminPageShell({
  title,
  description,
  actions,
  metrics,
  children,
  className,
  flush = false,
}: Props) {
  if (flush) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>{children}</div>
    )
  }

  const showToolbar = Boolean(description || actions || title || metrics)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {showToolbar && (
        <div className="flex flex-col gap-3">
          {(description || actions || title) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {title && (
                  <h2 className="text-sm font-semibold text-[#101114] lg:hidden">{title}</h2>
                )}
                {description && (
                  <p className="text-xs text-[#9497a9] sm:max-w-xl">{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
              )}
            </div>
          )}
          {metrics}
        </div>
      )}
      {children}
    </div>
  )
}
