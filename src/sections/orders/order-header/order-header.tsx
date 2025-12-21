'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import TrafficLight from '@/components/traffic-light'
import Badge from '@/components/badge' 
import { formatDateWithTime } from '@/utils/date'
import { getOrder, Order, SemaphoreStatus } from '@/services/orders'

type Props = {
  Badge?: React.ReactNode
}

export default function OrderHeader({ Badge: ExtraBadge }: Props) {
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

  // Função para definir o texto e a variante do Badge
  const getBadgeConfig = (semaphore?: SemaphoreStatus, isFinished?: boolean) => {
    // Se NÃO estiver concluído, mostra o status normal (ex: "Criado", "Processando")
    if (!isFinished) {
      return {
        label: order?.status?.label || 'Pendente',
        variant: 'info' as const
      }
    }

    // Se ESTIVER concluído, mostra o texto baseado no sinalizador
    switch (semaphore) {
      case 'red':
        return { label: 'Sinal Vermelho', variant: 'danger' as const }
      case 'yellow':
        return { label: 'Sinal Amarelo', variant: 'warning' as const }
      case 'green':
        return { label: 'Sinal Verde', variant: 'success' as const }
      case 'blue':
        return { label: 'Sinal Azul', variant: 'info' as const }
      default:
        return { label: order?.status?.label || 'Concluído', variant: 'info' as const }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto lg:max-w-lg" />
        <div className="h-16 bg-gray-200 rounded w-full mx-auto lg:max-w-lg" />
      </div>
    )
  }

  const displayId = order?.code ? `#${String(order.code).padStart(6, '0')}` : '...'
  const isFinished = order?.status?.value === 'FINISHED'
  const { label, variant } = getBadgeConfig(order?.semaphore, isFinished)

  return (
    <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background">
      {/* Informações de ID e Data */}
      <div className="flex align-middle justify-between w-full mx-auto lg:max-w-lg">
        <p className="text-base font-semibold leading-[130%] self-center">{displayId}</p>
        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">Solicitado em</p>
          <p className="text-base font-semibold leading-[130%]">
            {order?.created ? formatDateWithTime(order.created) : '...'}
          </p>
        </div>
      </div>

      {/* Box de Endereço */}
      <div className="bg-box rounded-sm px-4 py-5 w-full mx-auto lg:max-w-lg">
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <MapPin className="size-6 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-normal leading-[130%] break-words">
                {order?.formatted_address || 'Endereço não informado'}
              </p>
              {order?.complement && (
                <p className="text-[10px] text-gray-400 italic">{order.complement}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Status e Semáforo */}
      <div className="flex flex-col gap-4 items-center justify-center text-center">
        
        {/* Mostra o TrafficLight apenas quando concluído */}
        {isFinished && (
          <TrafficLight
            red={order?.semaphore === 'red'}
            green={order?.semaphore === 'green'}
            yellow={order?.semaphore === 'yellow'}
          />
        )}

        {/* Badge Customizado */}
        <Badge 
          variant={variant} 
          size="md" 
          className="bg-transparent"
        >
          {label}
        </Badge>

        {/* Badge Extra via Props */}
        {!!ExtraBadge && ExtraBadge}
        
        {/* Mensagem de erro caso o pagamento falhe */}
        {order?.status?.value === 'FAILED' && (
          <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">
            Pagamento Falhou
          </span>
        )}
      </div>
    </div>
  )
}