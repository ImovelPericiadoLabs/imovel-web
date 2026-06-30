import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { ADMIN_KPI } from './admin-styles'

export type AdminKpiItem = {
  id: string
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
}

const TONE: Record<NonNullable<AdminKpiItem['tone']>, string> = {
  default: 'text-[#101114]',
  brand: 'text-[#5741d8]',
  success: 'text-[#026b3f]',
  warning: 'text-amber-900',
  danger: 'text-[#D92D20]',
}

type Props = {
  items: AdminKpiItem[]
  className?: string
}

export default function AdminKpiStrip({ items, className }: Props) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map(({ id, label, value, hint, icon: Icon, tone = 'default' }) => (
        <div key={id} className={ADMIN_KPI}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9497a9]">
              {label}
            </p>
            {Icon && (
              <span className="flex size-6 items-center justify-center rounded-md bg-[rgba(133,91,251,0.1)]">
                <Icon className="size-3.5 text-[#7132f5]" strokeWidth={2} aria-hidden />
              </span>
            )}
          </div>
          <p className={cn('mt-1 text-xl font-bold tabular-nums leading-none', TONE[tone])}>
            {value}
          </p>
          {hint && <p className="mt-1 text-[11px] text-[#686b82]">{hint}</p>}
        </div>
      ))}
    </div>
  )
}
