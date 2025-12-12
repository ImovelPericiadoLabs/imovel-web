'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import TrafficLight from '@/components/traffic-light'
import { formatDateWithTime } from '@/utils/date'
import { getOrder, Order } from '@/services/orders'

type Props = {
  Badge?: React.ReactNode
}

export default function OrderHeader({ Badge }: Props) {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHeaderData() {
      if (!id) return

      try {
        const data = await getOrder(id as string)
        setOrder(data)
      } catch (error) {
        console.error('Erro ao carregar cabeçalho:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeaderData()
  }, [id])

  // Lógica de visualização
  const displayId = order?.code ? `#${String(order.code).padStart(6, '0')}` : '...'
  const isApproved = order?.analysis_status === 'APPROVED'
  const isRejected = order?.analysis_status === 'REJECTED'
  const isPending = !isApproved && !isRejected

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto lg:max-w-lg" />
        <div className="h-16 bg-gray-200 rounded w-full mx-auto lg:max-w-lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background">
      <div className="flex align-middle justify-between w-full mx-auto lg:max-w-lg">
        <p className="text-base font-semibold leading-[130%] self-center">{displayId}</p>

        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">
            Solicitado em
          </p>

          <p className="text-base font-semibold leading-[130%]">
            {order?.created ? formatDateWithTime(order.created) : '...'}
          </p>
        </div>
      </div>

      <div className="bg-box rounded-sm px-4 py-5 w-full mx-auto lg:max-w-lg">
        <div className="flex gap-4">
          <MapPin className="size-6 shrink-0" />

          <p className="text-xs font-normal leading-[130%]">
            {order?.formatted_address || 'Endereço não informado'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center align-middle justify-center">
        <TrafficLight
          red={isRejected}
          green={isApproved}
          yellow={isPending}
        />
        {!!Badge && Badge}
      </div>
    </div>
  )
}