'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TrafficLightModal from '@/components/traffic-light-modal'
import Badge from '@/components/badge'
import LoadingOverlay from '@/components/loading-overlay'
import { mapCircleStatus, mapBadgeStatus } from '@/sections/orders/constants'
import OrderHeader from '@/sections/orders/order-header'
import { getOrder, Order } from '@/services/orders'

export default function OrderPage() {
  const { id } = useParams()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrderData() {
      if (!id) return

      setIsLoading(true)
      try {
        const data = await getOrder(id as string)
        setOrder(data)
      } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [id])

  const boxes = [
    {
      id: 1,
      title: 'Hipoteca',
      text: 'Há irregularidades graves que impedem compra, venda ou regularização imediata. É necessário correção documental antes de seguir qualquer processo.',
      status: 'PURCHASE_AND_SALE_BLOCKED',
      href: `/pedidos/${id}/opcoes`,
    },
    {
      id: 2,
      title: 'Penhora',
      text: 'Sem problemas. Pode seguir com a operação.',
      status: 'ALL_GOOD',
      href: `/pedidos/${id}/opcoes`,
    },
  ]

  const mapBadgeText: Record<string, string> = {
    ALL_GOOD: 'Sinal verde',
    IRREGULARITIES_FOUND: 'Sinal amarelo',
    PURCHASE_AND_SALE_BLOCKED: 'Sinal vermelho',
  }

  if (isLoading) {
    return <LoadingOverlay isLoading={true} message="Carregando detalhes..." />
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <p className="text-gray-500">Pedido não encontrado.</p>
        <Link href="/pedidos" className="text-primary mt-4 underline">
          Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-10">
      {/* Header agora recebe dados dinâmicos do pedido */}
      <OrderHeader
        code={order.code}
        created={order.created}
        address={order.formatted_address}
        analysisStatus={order.analysis_status}
      />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {boxes.map((item) => (
          <Link
            key={item.id}
            className="flex flex-col gap-2 p-4 border border-box rounded-sm"
            href={item.href}
          >
            <div className="flex items-center gap-4.5">
              <div className={cn('size-2 rounded-full', mapCircleStatus[item.status])} />
              <p className="text-sm font-semibold leading-[130%]">{item.title}</p>
            </div>

            <Badge variant={mapBadgeStatus[item.status]}>{mapBadgeText[item.status]}</Badge>

            <p className="text-gray-2 text-xs font-normal leading-[130%]">{item.text}</p>

            <TrafficLightModal>
              <div className="cursor-pointer flex gap-2 text-primary">
                <p className="text-xs font-normal leading-[130%]">Entender</p>
                <ChevronRight className="size-4" />
              </div>
            </TrafficLightModal>
          </Link>
        ))}
      </div>
    </div>
  )
}