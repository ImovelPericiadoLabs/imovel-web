'use client'

import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import { STATUS_THEME } from '@/sections/orders/constants'
import type { OrderCertificateResult, SemaphoreStatus } from '@/services/orders/orders'

const SEMAPHORE_STATUS_THEME_MAP: Record<
  SemaphoreStatus,
  keyof typeof STATUS_THEME
> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'info',
}

type Props = {
  items: OrderCertificateResult[]
  className?: string
}

export default function OrderCertificateList({ items, className }: Props) {
  if (!items.length) return null

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {items.map(item => {
        const themekey = SEMAPHORE_STATUS_THEME_MAP[item.status.value]
        const theme = STATUS_THEME[themekey]

        return (
          <div
            key={item.id}
            className={cn(
              'flex flex-col gap-1 rounded-md border border-gray-5/60 bg-gray-6/40 px-3 py-2.5',
              'border-l-[3px]',
              theme.border,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold leading-[130%] text-primary">
                {item.kind_label ?? item.title}
              </p>
              <Badge
                variant={theme.variant}
                className={cn('shrink-0 bg-transparent border text-[10px] px-2 py-0.5', theme.badge)}
              >
                {item.status.label}
              </Badge>
            </div>

            {(item.subject || item.tax_id) && (
              <p className="text-[11px] font-medium leading-[130%] text-gray-1">
                {[item.subject, item.tax_id].filter(Boolean).join(' · ')}
              </p>
            )}

            <p className="text-gray-2 text-[11px] font-normal leading-[140%]">
              {item.summary ?? item.reason}
            </p>

            {item.footnote ? (
              <p className="text-gray-3 text-[10px] font-normal leading-[130%]">
                {item.footnote}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
