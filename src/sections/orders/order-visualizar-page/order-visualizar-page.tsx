'use client'

import { useParams } from 'next/navigation'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import OrderHeader from '@/sections/orders/order-header'
import { OrderAnalysisList } from '@/sections/orders/order-analysis-list'

export default function OrderVisualizarPage() {
  const { id } = useParams()
  const orderId = id as string

  const { data: order } = useOrderDetailQuery(orderId)

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order?.analysis && (
          <OrderAnalysisList items={order.analysis} />
        )}
      </div>
    </div>
  )
}
