'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MapPin } from 'lucide-react'

import TrafficLight from '@/components/traffic-light'
import Badge from '@/components/badge'

import { formatDateWithTime } from '@/utils/date'
import { cn } from '@/utils/tailwind'

// service
import { getOrder, type Order } from '@/services/orders'

// domínio (nível sênior)
import {
  resolveOrderTheme,
  resolveBadgeLabel
} from '@/sections/orders/constants'

type Props = {
  Badge?: React.ReactNode
}

export default function OrderHeader({ Badge: ExtraBadge }: Props) {
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto lg:max-w-lg" />
        <div className="h-24 bg-gray-200 rounded w-full mx-auto lg:max-w-lg" />
      </div>
    )
  }

  if (!order) return null

  const theme = resolveOrderTheme(order)
  const badgeLabel = resolveBadgeLabel(order)
  const isFinished = order.status?.value === 'FINISHED'

  const displayId = order.code
    ? `#${String(order.code).padStart(6, '0')}`
    : '...'

  return (
    <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background">
      {/* ID e Data */}
      <div className="flex items-center justify-between w-full mx-auto lg:max-w-lg">
        <p className="text-base font-semibold leading-[130%]">
          {displayId}
        </p>

        <div className="flex flex-col text-right">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%]">
            {isFinished ? 'Analisado em' : 'Solicitado em'}
          </p>
          <p className="text-base font-semibold leading-[130%]">
            {formatDateWithTime(order.modified || order.created)}
          </p>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-box rounded-sm px-4 py-5 w-full mx-auto lg:max-w-lg">
        <div className="flex gap-4">
          <MapPin className={cn('size-6 shrink-0', theme.text)} />

          <div className="flex flex-col gap-1">
            <p className="text-xs font-normal leading-[130%] break-words text-gray-900">
              {order.formatted_address || 'Endereço não informado'}
            </p>

            {order.complement && (
              <p className="text-[10px] text-gray-400 italic">
                {order.complement}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status / Semáforo */}
      <div className="flex flex-col gap-4 items-center justify-center text-center">
        {/* Semáforo só quando finalizado */}
        {isFinished && (
          <TrafficLight
            red={order.semaphore === 'red'}
            green={order.semaphore === 'green'}
            yellow={order.semaphore === 'yellow'}
          />
        )}

        {/* Badge principal */}
        <Badge
          variant={theme.variant}
          size="md"
          className={cn('bg-transparent border', theme.badge)}
        >
          {badgeLabel}
        </Badge>

        {/* Badge extra opcional */}
        {!!ExtraBadge && ExtraBadge}

        {/* Falha de pagamento */}
        {order.status?.value === 'FAILED' && (
          <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">
            Pagamento falhou
          </span>
        )}
      </div>
    </div>
  )
}
