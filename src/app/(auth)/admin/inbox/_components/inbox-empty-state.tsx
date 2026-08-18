'use client'

import type { ReactNode } from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/utils/tailwind'

type Props = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function InboxEmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center px-6 py-16 text-center',
        'bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgba(133,91,251,0.08),transparent)]',
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[rgba(133,91,251,0.12)] ring-1 ring-[rgba(113,50,245,0.2)]">
        <MessageSquare className="size-6 text-[#5741d8]" />
      </div>
      <p className="text-sm font-bold text-[#101114]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#686b82]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
