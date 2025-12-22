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
import { useEffect, useState } from 'react'
import { getOrder, Order } from '@/services/orders'
import { SemaphoreStatus } from '@/services/orders/orders'

export default function OrderPage() {
  const { id } = useParams()

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    async function fetchHeaderData() {
      if (!id) return

      try {
        const data = await getOrder(id as string)
        setOrder(data)
      } catch (error) {
        console.error('Erro ao carregar cabeçalho:', error)
      }
    }

    fetchHeaderData()
  }, [id])


  const SEMAPHORE_STATUS_THEME_MAP: Record<
    SemaphoreStatus,
    keyof typeof STATUS_THEME
  > = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    blue: 'info',
    gray: 'info'
  }


  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order && (!order.analysis || order.analysis.length === 0) && (
          <div className="flex flex-col gap-2 p-4 border border-dashed rounded-sm text-center text-gray-2">
            <p className="text-sm font-semibold">
              Nenhuma análise disponível no momento
            </p>
            <p className="text-xs leading-[130%]">
              As informações deste pedido ainda estão sendo processadas.
              Tente novamente mais tarde.
            </p>
          </div>
        )}
        
        {order?.analysis?.map(item => {
          // const config = ITEM_STATUS_CONFIG[item.status.value]
          const themekey = SEMAPHORE_STATUS_THEME_MAP[item.status.value]
          const theme = STATUS_THEME[themekey]

          return (
            <Link
              key={item.id}
              href="#"
              className={cn(
                'flex flex-col gap-2 p-4 border rounded-sm transition-colors group',
                theme.border,
                'hover:border-primary'
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
    </div>
  )
}
