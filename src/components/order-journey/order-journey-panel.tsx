'use client'

import { useMemo } from 'react'
import { AlertTriangle, Check, Info, Loader2 } from 'lucide-react'

import Button from '@/components/button'
import { RollingTitle } from '@/components/order-journey/rolling-title'
import { cn } from '@/utils/tailwind'
import { formatDateWithTime, formatRelativePastShort } from '@/utils/date'
import type { Order, OrderEvent } from '@/services/orders'
import { resolveLiveProcessView } from '@/domain/journey-live-process'
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
      return 'bg-primary border-[#5741d8] shadow-[0_0_0_4px_rgba(113,50,245,0.2)]'
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

type JourneyProgressBarProps = {
  progress: number
  active: boolean
}

function JourneyProgressBar({ progress, active }: JourneyProgressBarProps) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[#edeef3]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-violet-500 via-[#7132f5] to-[#5741d8] transition-[width] duration-700 ease-out',
          active && 'journey-progress-active',
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}

type JourneyLiveCardProps = {
  processTitle: string
  marco: string
  activityIso: string
  eventsFetching: boolean
  themeKey: string
  theme: ReturnType<typeof resolveLiveProcessView>['theme']
}

function JourneyLiveCard({
  processTitle,
  marco,
  activityIso,
  eventsFetching,
  themeKey,
  theme,
}: JourneyLiveCardProps) {
  const Icon = theme.Icon

  return (
    <div
      key={themeKey}
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 shadow-sm',
        'transition-colors duration-500 animate-in fade-in zoom-in-95 duration-500 fill-mode-both',
        theme.card,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-500',
            theme.iconWrap,
          )}
        >
          <Icon className={cn('size-4 transition-colors duration-500', theme.iconColor)} aria-hidden />
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-25',
              theme.iconWrap,
            )}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[0.65rem] font-bold uppercase tracking-wide', theme.accent)}>
            Ao vivo
          </p>
          <p className="text-[0.65rem] text-[#9497a9]">
            Marco: {marco}
            {eventsFetching ? (
              <Loader2 className={cn('ml-1 inline size-3 animate-spin', theme.iconColor)} aria-hidden />
            ) : null}
          </p>
        </div>
      </div>

      <RollingTitle text={processTitle} className={theme.title} />

      <p className="text-[0.65rem] text-[#9497a9] tabular-nums">
        Última atividade {formatRelativePastShort(activityIso)}
      </p>
    </div>
  )
}

type TimelineRowProps = {
  row: { id: string; title: string; state: TimelineDotState }
  showLine: boolean
  hint?: string | null
  index: number
}

function TimelineRow({ row, showLine, hint, index }: TimelineRowProps) {
  const isCurrent = row.state === 'current'
  const isDone = row.state === 'done'

  return (
    <li
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-left-3 duration-400 fill-mode-both',
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex w-5 shrink-0 flex-col items-center">
        <span
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
            dotClass(row.state),
            isCurrent && 'scale-110',
          )}
          aria-hidden
        >
          {isDone && row.id === 'Relatório disponível' ? (
            <Check className="size-2 text-white stroke-[3]" />
          ) : null}
        </span>
        {showLine && (
          <span
            className={cn(
              'w-0.5 flex-1 min-h-[1.35rem] transition-colors duration-500',
              lineClass(isDone),
            )}
            aria-hidden
          />
        )}
      </div>
      <div className={cn('pb-3 min-w-0', !showLine && 'pb-0')}>
        <p
          className={cn(
            'text-xs font-medium leading-snug transition-colors duration-300',
            row.state === 'pending' && 'text-[#9497a9]',
            row.state !== 'pending' && 'text-[#101114]',
            isCurrent && 'font-semibold',
          )}
        >
          {row.title}
        </p>
        {hint && isCurrent && (
          <p className="mt-1 text-[0.65rem] leading-snug text-[#686b82] animate-in fade-in duration-300">
            {hint}
          </p>
        )}
      </div>
    </li>
  )
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

  const liveProcess = useMemo(
    () =>
      resolveLiveProcessView(
        statusValue,
        ui,
        order.analysis_progress,
        events,
        journeyOpts.paymentConfirmed,
      ),
    [statusValue, ui, order.analysis_progress, events, journeyOpts.paymentConfirmed],
  )

  const liveThemeKey = `${statusValue}-${order.analysis_progress?.step || ''}-${liveProcess.processTitle}`

  const showLiveCard =
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
        'flex flex-col gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500',
        className,
      )}
      aria-labelledby="order-journey-heading"
    >
      <JourneyProgressBar progress={ui.progress} active={showLiveCard} />

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
          <p className="text-[0.65rem] text-[#9497a9] mt-1 tabular-nums">
            Atualizado {formatDateWithTime(updatedAt)}
          </p>
        </div>
      </div>

      {showLiveCard && (
        <JourneyLiveCard
          processTitle={liveProcess.processTitle}
          marco={liveProcess.marco}
          activityIso={activityIso}
          eventsFetching={eventsFetching}
          themeKey={liveThemeKey}
          theme={liveProcess.theme}
        />
      )}

      {showActionCta && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-400">
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

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#9497a9] mb-3">
          Etapas do processo
        </p>
        <ol className="flex flex-col gap-0">
          {rows.map((row, index) => {
            const hint =
              row.state === 'current' &&
              row.id === 'Busca da matrícula nos cartórios'
                ? statusValue === 'PENDING' && journeyOpts.paymentConfirmed
                  ? 'Iniciando — em seguida pode levar até 72 horas nos cartórios'
                  : statusValue === 'SEARCHING_DOCUMENT'
                    ? 'Em andamento — prazo pode chegar a 72 horas'
                    : null
                : null

            return (
              <TimelineRow
                key={row.id}
                row={row}
                showLine={index < rows.length - 1}
                hint={hint}
                index={index}
              />
            )
          })}
        </ol>
      </div>

      {historyEvents.length > 0 && (
        <div className="border-t border-[#edeef3] pt-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#9497a9] mb-2">
            Registro de atividades
          </p>
          <ul className="flex flex-col gap-1.5 border-l border-[#dedee5] pl-2.5 ml-0.5">
            {historyEvents.map((ev, idx) => (
              <li
                key={ev.id}
                className="text-[0.65rem] leading-snug animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
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
    </section>
  )
}
