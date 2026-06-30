'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import { ADMIN_PANEL } from './admin-styles'

type Props = {
  rail: ReactNode
  thread: ReactNode
  intelligence?: ReactNode
  className?: string
}

/** Layout inbox enterprise: rail + thread + painel de contexto opcional */
export default function AdminInboxWorkspace({ rail, thread, intelligence, className }: Props) {
  return (
    <div
      className={cn(
        'grid min-h-[min(32rem,68vh)] gap-2',
        intelligence
          ? 'lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(200px,260px)]'
          : 'lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]',
        className,
      )}
    >
      <div className={cn(ADMIN_PANEL, 'flex min-h-0 flex-col overflow-hidden')}>{rail}</div>
      <div className={cn(ADMIN_PANEL, 'flex min-h-0 flex-col overflow-hidden')}>{thread}</div>
      {intelligence && (
        <div className="hidden min-h-0 xl:block">{intelligence}</div>
      )}
    </div>
  )
}
