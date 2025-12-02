'use client'

import { MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TrafficLight from '@/components/traffic-light'
import TrafficLightModal from '@/components/traffic-light-modal'
import Badge from '@/components/badge'
import { mapCircleStatus, mapBadgeStatus } from '@/sections/orders/constants'

export default function OrderResultPage() {
  const boxes = [
    {
      id: 1,
      title: 'Hipoteca',
      text: 'Há irregularidades graves que impedem compra, venda ou regularização imediata. É necessário correção documental antes de seguir qualquer processo.',
      status: 'PURCHASE_AND_SALE_BLOCKED',
    },
    {
      id: 2,
      title: 'Penhora',
      text: 'Sem problemas. Pode seguir com a operação.',
      status: 'ALL_GOOD',
    },
  ]

  const mapBadgeText: Record<string, string> = {
    ALL_GOOD: 'Sinal verde',
    IRREGULARITIES_FOUND: 'Sinal amarelo',
    PURCHASE_AND_SALE_BLOCKED: 'Sinal vermelho',
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex align-middle justify-between">
        <p className="text-base font-semibold leading-[130%] self-center">#000001</p>

        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">
            Solicitado em
          </p>

          <p className="text-base font-semibold leading-[130%]">26/11/2025 16:23</p>
        </div>
      </div>

      <div className="bg-box rounded-sm px-4 py-5">
        <div className="flex gap-4">
          <MapPin className="size-6" />

          <p className="text-xs font-normal leading-[130%]">
            Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002.
          </p>
        </div>
      </div>

      <div className="flex align-middle justify-center">
        <TrafficLight red />
      </div>

      <div className="flex flex-col gap-2">
        {boxes.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 p-4 border border-box rounded-sm">
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
          </div>
        ))}
      </div>
    </div>
  )
}
