'use client'

import { Info, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { useOrderOwnersQuery } from '@/hooks/use-order-owners-query'
import { useOrderRealtime } from '@/hooks/use-order-realtime'

const OWNER_TYPE_LABELS: Record<string, string> = {
  proprietario_pleno: 'Proprietário pleno',
  nua_propriedade: 'Nua-propriedade',
  usufrutuario: 'Usufrutuário',
  outro_titular_nao_proprietario: 'Outro titular',
}

export default function OrderOptionsOwnersPage() {
  const { id } = useParams()
  const orderId = id as string

  const { connected: realtimeConnected } = useOrderRealtime(orderId)
  const { data: order } = useOrderDetailQuery(orderId, realtimeConnected)
  const { data: owners, isLoading } = useOrderOwnersQuery(
    orderId,
    order?.status?.value,
    realtimeConnected,
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <OrderHeader />
      </div>
    )
  }

  const hasOwners = Boolean(owners && owners.length > 0)

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {!hasOwners && (
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

        {owners?.map((owner) => (
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

                <div className="flex flex-wrap gap-2">
                  {owner.owner_type && (
                    <BadgeComponent>
                      {OWNER_TYPE_LABELS[owner.owner_type] ?? owner.owner_type}
                    </BadgeComponent>
                  )}

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
          </div>
        ))}
      </div>
    </div>
  )
}
