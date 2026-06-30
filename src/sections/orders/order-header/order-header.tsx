'use client'

import { useParams } from 'next/navigation'
import { MapPin, Hash, Box, Layout, Package } from 'lucide-react'

import TrafficLight from '@/components/traffic-light'
import Badge from '@/components/badge'

import { formatDateWithTime } from '@/utils/date'
import { cn } from '@/utils/tailwind'
import { SummaryItemsList, type SummaryItems } from '@/components/summary-items-list'

import type { Order } from '@/services/orders'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import {
  resolveOrderTheme,
  resolveBadgeLabel
} from '@/sections/orders/constants'

type Props = {
  Badge?: React.ReactNode
  /** Quando true, o header não faz polling próprio (o WebSocket da página dirige as atualizações). */
  realtimeConnected?: boolean
}

export default function OrderHeader({ Badge: ExtraBadge, realtimeConnected = false }: Props) {
  const { id } = useParams()
  const orderId = id as string

  const { data: order, isLoading } = useOrderDetailQuery(orderId, realtimeConnected)

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

  const summaryItems: SummaryItems = [
    {
      key: 'address',
      title: 'Endereço selecionado',
      icon: MapPin,
      value: (
        <div className="flex flex-col gap-1">
          <span>{order.formatted_address || 'Endereço não informado'}</span>
          {order.complement && (
            <span className="text-[10px] text-gray-400 italic">
              {order.complement}
            </span>
          )}
        </div>
      )
    }
  ]

  if (order.registration_number) {
    summaryItems.push({
      key: 'registration_number',
      title: 'Matrícula',
      value: order.registration_number,
      icon: Hash
    })
  }

  if (order.lot_name) {
    summaryItems.push({
      key: 'lot_name',
      title: 'Loteamento',
      value: order.lot_name,
      icon: Box
    })
  }

  if (order.block_number && order.lot_number) {
    summaryItems.push({
      key: 'block-lot',
      isGroup: true,
      items: [
        {
          key: 'block_number',
          title: 'Quadra',
          value: order.block_number,
          icon: Layout
        },
        {
          key: 'lot_number',
          title: 'Lote',
          value: order.lot_number,
          icon: Package
        }
      ]
    })
  } else {
    if (order.block_number) {
      summaryItems.push({
        key: 'block_number',
        title: 'Quadra',
        value: order.block_number,
        icon: Layout
      })
    }

    if (order.lot_number) {
      summaryItems.push({
        key: 'lot_number',
        title: 'Lote',
        value: order.lot_number,
        icon: Package
      })
    }
  }

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

      {/* Resumo do imóvel */}
      <div className="w-full mx-auto lg:max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SummaryItemsList items={summaryItems} />
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
