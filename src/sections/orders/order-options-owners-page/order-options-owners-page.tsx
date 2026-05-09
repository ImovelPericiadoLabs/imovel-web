'use client'

import { Info, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'

export default function OrderOptionsOwnersPage() {
  const { id } = useParams()
  const orderId = id as string

  const { data: order, isLoading } = useOrderDetailQuery(orderId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <OrderHeader />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order && (!order.owners || order.owners.length === 0) && (
          <div className="flex flex-col items-center justify-center p-6 border border-blue-100 rounded-2xl bg-blue-50/60 text-center gap-4 shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full">
              <Info className="size-8 text-blue-600" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Consulta em Análise
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Esta consulta ainda está sendo processada pela nossa equipe.
                <br />
                As opções de visualização serão liberadas em breve.
              </p>
            </div>
          </div>
        )}

        {order?.owners?.map((owner) => (
          <div
            key={owner.id}
            className="flex flex-col p-4 border border-box rounded-sm group hover:border-primary transition-colors"
          >
            <div className="flex gap-4 items-center">
              <User className="size-6 text-primary" />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {owner.name ?? 'Não Disponível'}
                </p>

                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary">
                  {owner.tax_id ?? 'Não Disponível'}
                </p>

                <BadgeComponent>
                  Possui{' '}
                  {owner.undivided_interest !== null &&
                  owner.undivided_interest !== undefined
                    ? `${owner.undivided_interest}%`
                    : 'Não Disponível'}
                </BadgeComponent>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}