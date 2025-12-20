'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TrafficLightModal from '@/components/traffic-light-modal'
import Badge from '@/components/badge'
import { mapCircleStatus, mapBadgeStatus } from '@/sections/orders/constants'
import OrderHeader from '@/sections/orders/order-header'

export default function OrderPage() {
  const { id } = useParams()

  const boxes = [
    {
      id: 1,
      title: 'Hipoteca',
      text: 'Há irregularidades graves que impedem compra, venda ou regularização imediata. É necessário correção documental antes de seguir qualquer processo.',
      status: 'PURCHASE_AND_SALE_BLOCKED',
      href: `/consultas/${id}/opcoes`,
    },
    {
      id: 2,
      title: 'Penhora',
      text: 'Sem problemas. Pode seguir com a operação.',
      status: 'ALL_GOOD',
      href: `/consultas/${id}/opcoes`,
    },
  ]

  const mapBadgeText: Record<string, string> = {
    ALL_GOOD: 'Sinal verde',
    IRREGULARITIES_FOUND: 'Sinal amarelo',
    PURCHASE_AND_SALE_BLOCKED: 'Sinal vermelho',
  }

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {boxes.map((item) => (
          <Link
            key={item.id}
            className="flex flex-col gap-2 p-4 border border-box rounded-sm"
            href={item.href}
          >
            <div className="flex items-center gap-4.5">
              <div className={cn('size-2 rounded-full', mapCircleStatus[item.status])} />
              <p className="text-sm font-semibold leading-[130%]">{item.title}</p>
            </div>

            <Badge variant={mapBadgeStatus[item.status]}>{mapBadgeText[item.status]}</Badge>

            <p className="text-gray-2 text-xs font-normal leading-[130%]">{item.text}</p>

            <TrafficLightModal>
              <div className="cursor-pointer flex gap-2 text-primary">
                <p className="text-xs font-normal leading-[130%]">Entender</p>
                <ChevronRight className="size-4" />
              </div>
            </TrafficLightModal>
          </Link>
        ))}
      </div>
    </div>
  )
}