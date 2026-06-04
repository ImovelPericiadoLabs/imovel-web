'use client'

import { useParams } from 'next/navigation'

import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import OrderHeader from '@/sections/orders/order-header'
import { OrderAnalysisList } from '@/sections/orders/order-analysis-list'

export default function OrderVisualizarPage() {
  const { id } = useParams()
  const orderId = id as string

  const { data: order } = useOrderDetailQuery(orderId)

  const hasAnalysis = Boolean(order?.analysis?.length)
  const hasCertificates = Boolean(order?.certificates?.length)

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-4 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {hasAnalysis && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-gray-900 px-1">Análise do imóvel</h2>
            <OrderAnalysisList items={order!.analysis!} />
          </section>
        )}

        {hasCertificates && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-gray-900 px-1">Certidões oficiais</h2>
            <OrderAnalysisList items={order!.certificates!} />
          </section>
        )}

        {!hasAnalysis && !hasCertificates && (
          <p className="text-sm text-gray-500 px-1">
            O resultado ainda está sendo processado. Volte em alguns minutos.
          </p>
        )}
      </div>
    </div>
  )
}
