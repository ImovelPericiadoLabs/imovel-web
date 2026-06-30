'use client'

import Link from 'next/link'

import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import { STATUS_THEME } from '@/sections/orders/constants'
import type { OrderAnalysisResult, SemaphoreStatus } from '@/services/orders/orders'

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
  items: OrderAnalysisResult[]
  className?: string
}

export default function OrderAnalysisList({ items, className }: Props) {
  if (!items.length) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map(item => {
        const themekey = SEMAPHORE_STATUS_THEME_MAP[item.status.value]
        const theme = STATUS_THEME[themekey]

        return (
          <Link
            key={item.id}
            href="#"
            className={cn(
              'flex flex-col gap-2 p-4 border rounded-sm transition-colors group',
              theme.border,
              'hover:border-primary',
            )}
          >
            <div className="flex items-center gap-4.5">
              <div className={cn('size-2 rounded-full', theme.dot)} />
              <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                {item.title}
              </p>
            </div>

            <Badge
              variant={theme.variant}
              className={cn('bg-transparent border', theme.badge)}
            >
              {item.status.label}
            </Badge>

            <p className="text-gray-2 text-xs font-normal leading-[130%]">
              {item.reason}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
