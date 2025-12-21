'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/utils/tailwind'
import TrafficLightModal from '@/components/traffic-light-modal'
import Badge from '@/components/badge'
import OrderHeader from '@/sections/orders/order-header'

import {
  STATUS_THEME,
  type BadgeStatus
} from '@/sections/orders/constants'

export default function OrderPage() {
  const { id } = useParams()

  const boxes: Array<{
    id: number
    title: string
    text: string
    status: 'ALL_GOOD' | 'IRREGULARITIES_FOUND' | 'PURCHASE_AND_SALE_BLOCKED'
    href: string
  }> = [
    {
      id: 1,
      title: 'Hipoteca',
      text: 'Há irregularidades graves que impedem compra, venda ou regularização imediata. É necessário correção documental antes de seguir qualquer processo.',
      status: 'PURCHASE_AND_SALE_BLOCKED',
      href: `/consultas/${id}/opcoes`
    },
    {
      id: 2,
      title: 'Penhora',
      text: 'Sem problemas. Pode seguir com a operação.',
      status: 'ALL_GOOD',
      href: `/consultas/${id}/opcoes`
    }
  ]

  const ITEM_STATUS_CONFIG: Record<
    typeof boxes[number]['status'],
    {
      theme: keyof typeof STATUS_THEME
      label: string
    }
  > = {
    ALL_GOOD: {
      theme: 'success',
      label: 'Tudo certo'
    },
    IRREGULARITIES_FOUND: {
      theme: 'warning',
      label: 'Irregularidades encontradas'
    },
    PURCHASE_AND_SALE_BLOCKED: {
      theme: 'danger',
      label: 'Impeditivo de compra e venda'
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {boxes.map(item => {
          const config = ITEM_STATUS_CONFIG[item.status]
          const theme = STATUS_THEME[config.theme]

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col gap-2 p-4 border border-box rounded-sm transition-colors hover:border-primary group"
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
                {config.label}
              </Badge>

              <p className="text-gray-2 text-xs font-normal leading-[130%]">
                {item.text}
              </p>

              <TrafficLightModal>
                <div className="cursor-pointer flex gap-2 text-primary items-center">
                  <p className="text-xs font-normal leading-[130%]">
                    Entender
                  </p>
                  <ChevronRight className="size-4" />
                </div>
              </TrafficLightModal>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
