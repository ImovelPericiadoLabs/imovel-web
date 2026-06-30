'use client'

import { useParams, useRouter } from 'next/navigation'
import OrderHeader from '@/sections/orders/order-header'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import ReRequestForm from '@/sections/orders/order-options-page/re-request-form'

export default function OrderOptionsResolicitarPage() {
  const { id } = useParams()
  const router = useRouter()
  const orderId = id as string

  const { data: order, isLoading } = useOrderDetailQuery(orderId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <OrderHeader />
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="flex flex-col gap-3">
      <OrderHeader />
      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        <ReRequestForm
          orderId={orderId}
          order={{
            place_response: order.place_response,
            formatted_address: order.formatted_address,
            place_id: order.place_id,
            lot_number: order.lot_number,
            block_number: order.block_number,
            lot_name: order.lot_name,
            complement: order.complement
          }}
          onClose={() => router.back()}
        />
      </div>
    </div>
  )
}
