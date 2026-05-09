'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Files, Lock } from 'lucide-react'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { useOrderEventsQuery } from '@/hooks/use-order-events-query'

import { cn } from '@/utils/tailwind'
import Badge from '@/components/badge'
import Button from '@/components/button'
import OrderHeader from '@/sections/orders/order-header'
import { OrderJourneyPanel } from '@/components/order-journey'

import { STATUS_THEME } from '@/sections/orders/constants'
import type { SemaphoreStatus } from '@/services/orders/orders'

export default function OrderPage() {
  const { id } = useParams()
  const orderId = id as string

  const { data: order } = useOrderDetailQuery(orderId)
  const { data: orderEvents = [], isFetching: eventsFetching } =
    useOrderEventsQuery(orderId, order?.status?.value)

  const SEMAPHORE_STATUS_THEME_MAP: Record<
    SemaphoreStatus,
    keyof typeof STATUS_THEME
  > = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    blue: 'info',
    gray: 'info'
  }

  const showJourney = order && order.status?.value !== 'FINISHED'
  const isAnalysisComplete = order?.status?.value === 'FINISHED'

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {showJourney && (
          <OrderJourneyPanel
            order={order}
            orderId={orderId}
            events={orderEvents}
            eventsFetching={eventsFetching}
          />
        )}

        {order && (
          <section
            className={cn(
              'flex flex-col gap-3 p-4 rounded-xl border transition-colors',
              isAnalysisComplete
                ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                : 'border-dashed border-gray-200 bg-gray-50/90'
            )}
            aria-label="Acesso a documentos e dados da consulta"
          >
            <div className="flex items-start gap-3">
              {isAnalysisComplete ? (
                <Files
                  className="size-6 text-primary shrink-0 mt-0.5"
                  aria-hidden
                />
              ) : (
                <Lock
                  className="size-6 text-gray-400 shrink-0 mt-0.5"
                  aria-hidden
                />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-[130%]">
                  Dados da consulta
                </p>
                <p className="text-xs text-gray-500 leading-[140%]">
                  {isAnalysisComplete
                    ? 'Acesse resultado completo, documentos e proprietários.'
                    : 'Disponível quando a análise for concluída. Acompanhe o andamento acima.'}
                </p>
              </div>
            </div>
            {isAnalysisComplete ? (
              <Button
                href={`/consultas/${orderId}/opcoes`}
                variant="primary"
                className="!mt-1"
                icon={<Files className="size-5" />}
              >
                Abrir documentos e dados
              </Button>
            ) : null}
          </section>
        )}

        {order?.analysis?.map(item => {
          const themekey = SEMAPHORE_STATUS_THEME_MAP[item.status.value]
          const theme = STATUS_THEME[themekey]

          return (
            <Link
              key={item.id}
              href="#"
              className={cn(
                'flex flex-col gap-2 p-4 border rounded-sm transition-colors group',
                theme.border,
                'hover:border-primary'
              )}
            >

              <div className="flex items-center gap-4.5">
                <div className={cn('size-2 rounded-full', theme.dot)} />
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {item.title}
                </p>
              </div>

              <Badge
                variant={theme.variant}
                className={cn('bg-transparent border', theme.badge)}
              >
                {item.status.label}
              </Badge>

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
