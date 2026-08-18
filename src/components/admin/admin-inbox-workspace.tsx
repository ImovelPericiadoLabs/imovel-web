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

/** Shell 3 colunas — altura via flex (sem calc frágil). */
export default function AdminInboxWorkspace({ rail, thread, intelligence, className }: Props) {
  return (
    <div
      className={cn(
        'grid h-full min-h-0 flex-1 gap-2 overflow-hidden',
        intelligence
          ? 'lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)_minmax(260px,300px)]'
          : 'lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]',
        className,
      )}
    >
      <div className={cn(ADMIN_PANEL, 'flex min-h-0 flex-col overflow-hidden')}>{rail}</div>
      <div className={cn(ADMIN_PANEL, 'relative flex min-h-0 flex-col overflow-hidden')}>{thread}</div>
      {intelligence ? (
        <div className="hidden h-full min-h-0 overflow-hidden xl:block">{intelligence}</div>
      ) : null}
    </div>
  )
}
