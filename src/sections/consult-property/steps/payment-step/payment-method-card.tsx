'use client'

import type { ComponentType, SVGProps } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

export type StatusTone = 'ok' | 'info' | 'warn' | 'bad' | 'muted'

const STATUS_TONE: Record<StatusTone, string> = {
  ok: 'text-emerald-600',
  info: 'text-blue-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
  muted: 'text-slate-500',
}

export function PaymentMethodCard({
  title,
  status,
  statusTone = 'muted',
  description,
  icon: Icon,
  available,
  selected,
  onSelect,
  testId,
  delayMs = 0,
  className,
}: {
  title: string
  status?: string
  statusTone?: StatusTone
  description: string
  icon: Icon
  available: boolean
  selected: boolean
  onSelect: () => void
  testId: string
  delayMs?: number
  className?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!available}
      aria-disabled={!available}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        'pay-method-card group relative w-full text-left',
        'flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        'transition-[transform,box-shadow,border-color] duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        available && 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.18)]',
        available && selected && 'border-primary/40 shadow-[0_8px_20px_-10px_rgba(11,27,58,0.22)]',
        !available && 'cursor-not-allowed',
        className,
      )}
    >
      <span
        className={cn(
          'relative size-12 shrink-0 overflow-hidden rounded-[14px]',
          'transition-transform duration-200',
          available && 'group-hover:scale-105',
          selected && 'pay-method-icon-pop',
        )}
      >
        <Icon className="size-full" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold leading-tight text-[#0b1b3a]">{title}</span>
        {status ? (
          <span className={cn('mt-0.5 text-[13px] font-semibold leading-snug', STATUS_TONE[statusTone])}>
            {status}
          </span>
        ) : null}
        <span className="mt-0.5 text-xs leading-snug text-slate-500">{description}</span>
      </span>

      <ChevronRight
        className={cn('size-5 shrink-0 text-slate-300', available && 'group-hover:text-slate-400')}
        aria-hidden
      />
    </button>
  )
}
