'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import { ADMIN_COMMAND_BAR } from './admin-styles'

type Props = {
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
}

export default function AdminToolbar({ leading, trailing, className }: Props) {
  if (!leading && !trailing) return null

  return (
    <div className={cn(ADMIN_COMMAND_BAR, className)} role="toolbar">
      {leading && <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{leading}</div>}
      {trailing && <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>}
    </div>
  )
}
