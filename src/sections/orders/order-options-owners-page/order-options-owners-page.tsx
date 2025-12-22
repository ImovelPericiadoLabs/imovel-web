'use client'

import { User } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getOrder, Order } from '@/services/orders'

export default function OrderOptionsOwnersPage() {

  const { id } = useParams()
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
  
    useEffect(() => {
      async function fetchData() {
        if (!id) return
        try {
          const data = await getOrder(id as string)
          setOrder(data)
        } catch (error) {
          console.error('Erro ao buscar pedido:', error)
        } finally {
          setIsLoading(false)
        }
      }
  
      fetchData()
    }, [id])

    
  return (
    <div className="flex flex-col gap-3">
      <OrderHeader/>

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order?.owners?.map((owner) => (
          <div
            key={owner.id}
            className="flex flex-col p-4 border border-box rounded-sm group hover:border-primary"
          >
            <div className="flex gap-4 items-center">
              <User className="size-6 text-primary" />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {owner.name || "Não Disponível"}
                </p>

                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary">
                  {owner.textId || "Não Disponível"}
                </p>

                <BadgeComponent>Possui {owner.undivided_interest + "%" || "Não Disponível"}</BadgeComponent>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
