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

export default function OrderPage() {
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

    

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order?.analysis?.map(item => {
          // const config = ITEM_STATUS_CONFIG[item.status.value]
          // const theme = STATUS_THEME[config.theme]

          return (
            <Link
              key={item.id}
              href={'#'}
              className="flex flex-col gap-2 p-4 border border-box rounded-sm transition-colors hover:border-primary group"
            >
              <div className="flex items-center gap-4.5">
                {/* <div className={cn('size-2 rounded-full', theme.dot)} /> */}
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {item.title}
                </p>
              </div>
{/* 
              <Badge
                variant={theme.variant}
                className={cn('bg-transparent border', theme.badge)}
              >
                {config.label}
              </Badge> */}

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
