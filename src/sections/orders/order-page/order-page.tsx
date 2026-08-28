'use client'

import { useParams } from 'next/navigation'
import { Files, Lock } from 'lucide-react'
import { useOrderDetailQuery } from '@/hooks/use-order-detail-query'
import { useOrderEventsQuery } from '@/hooks/use-order-events-query'
import { useOrderRealtime } from '@/hooks/use-order-realtime'

import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import OrderHeader from '@/sections/orders/order-header'
import { OrderJourneyPanel } from '@/components/order-journey'

export default function OrderPage() {
  const { id } = useParams()
  const orderId = id as string

  // Suprime o polling enquanto o WS ainda é o canal viável (inclusive durante
  // reconexões); `fallbackActive` só liga após N falhas consecutivas.
  const { fallbackActive } = useOrderRealtime(orderId)
  const suppressPolling = !fallbackActive

  const { data: order } = useOrderDetailQuery(orderId, suppressPolling)
  const { data: orderEvents = [], isFetching: eventsFetching } =
    useOrderEventsQuery(orderId, order?.status?.value, suppressPolling)

  const isAnalysisComplete = order?.status?.value === 'FINISHED'

  return (
    <div className="flex flex-col gap-3 pb-10">
      <OrderHeader suppressPolling={suppressPolling} />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {order && (
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
              'flex flex-col gap-2.5 p-3.5 rounded-xl border transition-colors',
              isAnalysisComplete
                ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                : 'border-dashed border-gray-200 bg-gray-50/90',
            )}
            aria-label="Acesso a documentos e dados da consulta"
          >
            <div className="flex items-start gap-2.5">
              {isAnalysisComplete ? (
                <Files
                  className="size-5 text-primary shrink-0 mt-0.5"
                  aria-hidden
                />
              ) : (
                <Lock
                  className="size-5 text-gray-400 shrink-0 mt-0.5"
                  aria-hidden
                />
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  Dados da consulta
                </p>
                <p className="text-xs text-gray-500 leading-snug">
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
                className={cn(
                  '!mt-0 !w-auto !self-start',
                  '!text-sm !font-medium !leading-none tracking-tight',
                  '!px-3 !py-2 !rounded-lg',
                  '!shadow-none hover:brightness-105',
                  'active:!translate-y-0 active:!shadow-none',
                  '[&>span]:!mr-1.5',
                )}
                icon={<Files className="size-3.5" aria-hidden />}
              >
                Abrir documentos e dados
              </Button>
            ) : null}
          </section>
        )}
      </div>
    </div>
  )
}
