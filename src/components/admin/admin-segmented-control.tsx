'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/tailwind'

export type AdminSegment = {
  id: string
  label: string
  icon?: LucideIcon
  badge?: number
}

type Props = {
  segments: readonly AdminSegment[]
  value: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

export default function AdminSegmentedControl({
  segments,
  value,
  onChange,
  className,
  'aria-label': ariaLabel = 'Seções',
}: Props) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-[rgba(113,50,245,0.14)] bg-[rgba(11,27,58,0.03)] p-1',
        className,
      )}
    >
      {segments.map(({ id, label, icon: Icon, badge }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
              active
                ? 'bg-[#7132f5] text-white shadow-[0_2px_8px_rgba(113,50,245,0.35)]'
                : 'text-[#686b82] hover:bg-white hover:text-[#101114]',
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />}
            {label}
            {badge != null && badge > 0 && (
              <span
                className={cn(
                  'min-w-[1.125rem] rounded-md px-1 text-center text-[10px] font-bold tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-[rgba(133,91,251,0.12)] text-[#5741d8]',
                )}
              >
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
