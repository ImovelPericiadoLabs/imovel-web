import type { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import { ADMIN_PANEL_HEADER } from './admin-styles'

type Props = {
  title: string
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function AdminPanelHeader({ title, meta, actions, className }: Props) {
  return (
    <div className={cn(ADMIN_PANEL_HEADER, className)}>
      <div className="min-w-0">
        <h3 className="text-xs font-semibold text-[#101114]">{title}</h3>
        {meta && <div className="mt-0.5 text-[11px] text-[#9497a9]">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}
