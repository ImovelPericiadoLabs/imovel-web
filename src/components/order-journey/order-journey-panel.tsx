'use client'

import { useMemo } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

import Button from '@/components/button'
import { cn } from '@/utils/tailwind'
import { formatDateWithTime, formatRelativePastShort } from '@/utils/date'
import type { Order, OrderEvent } from '@/services/orders'
import {
  buildAnalysisSubsteps,
  resolveAnalysisProgressLabel,
} from '@/domain/order-analysis-progress'
import {
  filterCustomerFacingOrderEvents,
  filterOrderHistoryEvents,
  formatOrderEventLabel,
} from '@/domain/order-event-labels'
import {
  getOrderTimelineRows,
  isOrderPaymentConfirmed,
  resolveOrderStatusUI,
  type TimelineDotState,
} from '@/domain/order-journey'

type Props = {
  order: Order
  orderId: string
  events?: OrderEvent[]
  eventsFetching?: boolean
  className?: string
}

function dotClass(state: TimelineDotState) {
  switch (state) {
    case 'done':
      return 'bg-green-500 border-green-600'
    case 'current':
      return 'bg-primary border-[#5741d8] animate-pulse'
    case 'attention':
      return 'bg-amber-400 border-amber-600'
    default:
      return 'bg-gray-200 border-gray-300'
  }
}

function lineClass(segmentDone: boolean) {
  return segmentDone ? 'bg-green-400' : 'bg-gray-200'
}

function latestActivityIso(order: Order, visibleEvents: OrderEvent[]): string {
  const orderTs = order.modified || order.created
  if (!visibleEvents.length) return orderTs
  const lastEv = visibleEvents[visibleEvents.length - 1]!.created_at
  return Date.parse(lastEv) >= Date.parse(orderTs) ? lastEv : orderTs
}

export default function OrderJourneyPanel({
  order,
  orderId,
  events = [],
  eventsFetching = false,
  className,
}: Props) {
  const statusValue = order.status?.value
  const journeyOpts = {
    paymentConfirmed: isOrderPaymentConfirmed(order.payment_status),
  }
  const ui = resolveOrderStatusUI(statusValue, journeyOpts)
  const rows = getOrderTimelineRows(statusValue, journeyOpts)
  const updatedAt = order.modified || order.created

  const visibleEvents = useMemo(
    () => filterCustomerFacingOrderEvents(events),
    [events],
  )

  const historyEvents = useMemo(
    () => filterOrderHistoryEvents(events),
    [events],
  )

  const activityIso = useMemo(
    () => latestActivityIso(order, visibleEvents),
    [order, visibleEvents],
  )

  const analysisProgressLabel = useMemo(
    () =>
      resolveAnalysisProgressLabel(
        statusValue,
        order.analysis_progress,
        events,
      ),
    [statusValue, order.analysis_progress, events],
  )

  const analysisSubsteps = useMemo(
    () => (statusValue === 'IN_PROGRESS' ? buildAnalysisSubsteps(events) : []),
    [statusValue, events],
  )

  const showPulse =
    statusValue === 'SEARCHING_DOCUMENT' ||
    statusValue === 'IN_PROGRESS' ||
    (statusValue === 'PENDING' && journeyOpts.paymentConfirmed)

  const showActionCta =
    order.can_rerequest &&
    (statusValue === 'REJECTED_DATA' ||
      statusValue === 'RETURNED_BY_NOTARY')

  return (
    <section
      className={cn(
        'flex flex-col gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm',
        className,
      )}
      aria-labelledby="order-journey-heading"
    >
      <div className="flex gap-3 items-start">
        <div className="bg-[rgba(133,91,251,0.16)] p-2 rounded-full shrink-0">
          <Info className="size-5 text-[#7132f5]" aria-hidden />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h2
            id="order-journey-heading"
            className="text-sm font-semibold text-[#101114] leading-snug"
          >
            {ui.headline}
          </h2>
          {ui.expectation && (
            <p className="text-xs text-[#686b82] leading-relaxed">{ui.expectation}</p>
          )}
          <p className="text-[0.65rem] text-[#9497a9] mt-1">
            Atualização do pedido: {formatDateWithTime(updatedAt)}
          </p>
        </div>
      </div>

      {showPulse && (
        <div
          className="flex flex-col gap-2 rounded-xl border border-[#7132f5]/15 bg-[#7132f5]/[0.06] px-3 py-2.5"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#686b82]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7132f5] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7132f5]" />
            </span>
            <span className="font-medium text-[#101114]">Processamento ativo</span>
            <span className="text-[#9497a9]">
              · última atividade {formatRelativePastShort(activityIso)}
              {eventsFetching ? ' · sincronizando…' : ''}
            </span>
          </div>
          {analysisProgressLabel && (
            <p className="text-xs font-semibold text-[#101114] leading-snug">
              Agora: {analysisProgressLabel}
            </p>
          )}
        </div>
      )}

      {showActionCta && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-amber-950 flex items-start gap-2">
            <AlertTriangle
              className="size-4 shrink-0 text-amber-700 mt-0.5"
              aria-hidden
            />
            Sem essas informações não conseguimos seguir com a busca.
          </p>
          <Button
            href={`/consultas/${orderId}/opcoes/re-solicitar`}
            variant="primary"
            className="w-full justify-center"
          >
            Enviar dados agora
          </Button>
        </div>
      )}

      {historyEvents.length > 0 && (
        <div className="mt-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#9497a9] mb-1.5">
            Histórico recente
          </p>
          <ul className="flex flex-col gap-1 border-l border-[#dedee5] pl-2.5 ml-0.5">
            {historyEvents.map((ev) => (
              <li key={ev.id} className="text-[0.65rem] leading-snug">
                <span className="text-[#9497a9] tabular-nums">
                  {formatDateWithTime(ev.created_at)}
                </span>
                <span className="text-[#686b82] block">
                  {formatOrderEventLabel(ev.type, ev.payload)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#9497a9] mb-3">
          Próximas etapas esperadas
        </p>
        <ol className="flex flex-col gap-0">
          {rows.map((row, index) => {
            const showLine = index < rows.length - 1
            return (
              <li key={row.id} className="flex gap-3">
                <div className="flex flex-col items-center w-5 shrink-0">
                  <span
                    className={cn(
                      'size-3 rounded-full border-2 shrink-0',
                      dotClass(row.state),
                    )}
                    aria-hidden
                  />
                  {showLine && (
                    <span
                      className={cn(
                        'w-0.5 flex-1 min-h-[1.25rem]',
                        lineClass(row.state === 'done'),
                      )}
                      aria-hidden
                    />
                  )}
                </div>
                <div className={cn('pb-3', !showLine && 'pb-0')}>
                  <p
                    className={cn(
                      'text-xs font-medium leading-snug',
                      row.state === 'pending' && 'text-[#9497a9]',
                      row.state !== 'pending' && 'text-[#101114]',
                    )}
                  >
                    {row.title}
                  </p>
                  {row.state === 'current' &&
                    row.id === 'Busca da matrícula nos cartórios' &&
                    (statusValue === 'SEARCHING_DOCUMENT' ||
                      (statusValue === 'PENDING' && journeyOpts.paymentConfirmed)) && (
                    <p className="text-[0.65rem] text-[#686b82] mt-0.5">
                      {statusValue === 'PENDING'
                        ? 'Iniciando — em seguida pode levar até 72 horas nos cartórios'
                        : 'Em andamento — prazo pode chegar a 72 horas'}
                    </p>
                  )}
                  {row.state === 'current' &&
                    row.id === 'Análise do documento' &&
                    statusValue === 'IN_PROGRESS' && (
                    <div className="mt-1.5 flex flex-col gap-1">
                      {analysisProgressLabel && (
                        <p className="text-[0.65rem] font-medium text-[#7132f5]">
                          {analysisProgressLabel}
                        </p>
                      )}
                      {analysisSubsteps.length > 1 && (
                        <ul className="flex flex-col gap-0.5 border-l border-[#dedee5] pl-2 ml-0.5">
                          {analysisSubsteps.map((sub, idx) => {
                            const isLast = idx === analysisSubsteps.length - 1
                            return (
                              <li
                                key={sub.id}
                                className={cn(
                                  'text-[0.65rem] leading-snug',
                                  isLast
                                    ? 'text-[#101114] font-medium'
                                    : 'text-[#9497a9]',
                                )}
                              >
                                {sub.label}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
