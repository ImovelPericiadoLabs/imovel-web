'use client'

import dynamic from 'next/dynamic'

const OrdersPage = dynamic(() => import('@/sections/orders/orders-page'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  )
})

export default function OrdersPageClient() {
  return <OrdersPage />
}
