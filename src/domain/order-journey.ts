/**
 * Maps backend `Order.status.value` to journey UX (timeline, polling, copy).
 * Aligns UI with the async pipeline / FSM — prefer steps over fake linear %.
 */

export type BackendOrderStatus =
  | 'PENDING'
  | 'SEARCHING_DOCUMENT'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELED'
  | 'REJECTED_DATA'
  | 'RETURNED_BY_NOTARY'
  | 'FAILED'

export type JourneyStepId =
  | 'payment'
  | 'search'
  | 'analysis'
  | 'report'
  | 'action_required'
  | 'stopped'

export type OrderStatusUIConfig = {
  /** Primary label for badges / summaries */
  label: string
  /** Indicative only — use `step` + timeline, not as a real progress bar */
  progress: number
  step: JourneyStepId
  headline: string
  expectation?: string
}

/** Stable timeline titles (order matters). */
export const ORDER_PIPELINE_TIMELINE_TITLES = [
  'Pagamento confirmado',
  'Busca da matrícula nos cartórios',
  'Análise do documento',
  'Relatório disponível',
] as const

export type TimelineDotState = 'done' | 'current' | 'pending' | 'attention'

export type OrderTimelineRow = {
  id: (typeof ORDER_PIPELINE_TIMELINE_TITLES)[number]
  title: string
  state: TimelineDotState
}

const DEFAULT_UI: OrderStatusUIConfig = {
  label: 'Em processamento',
  progress: 35,
  step: 'analysis',
  headline: 'Estamos processando sua consulta.',
  expectation:
    'Os prazos dependem de cartórios e validações. Esta página atualiza automaticamente.',
}

/** PENDING com pagamento já confirmado (ex.: re-solicitação após falha — backend mantém CONFIRMED). */
export const ORDER_PENDING_PAYMENT_CONFIRMED_UI: OrderStatusUIConfig = {
  label: 'Em processamento',
  progress: 20,
  step: 'search',
  headline: 'Pagamento confirmado. Estamos retomando sua consulta.',
  expectation:
    'Em instantes iniciamos ou continuamos a busca nos cartórios. Esta página atualiza sozinha.',
}

export const ORDER_STATUS_UI: Record<
  BackendOrderStatus,
  OrderStatusUIConfig
> = {
  PENDING: {
    label: 'Aguardando pagamento',
    progress: 5,
    step: 'payment',
    headline: 'Finalize o pagamento para iniciarmos a consulta.',
    expectation:
      'Depois da confirmação do pagamento, iniciamos a busca nos cartórios.',
  },
  SEARCHING_DOCUMENT: {
    label: 'Buscando matrícula nos cartórios',
    progress: 40,
    step: 'search',
    headline: 'Consultando bases e cartórios.',
    expectation:
      'Esse passo pode levar até 72 horas em alguns casos. Você receberá aviso quando avançarmos.',
  },
  IN_PROGRESS: {
    label: 'Analisando documento',
    progress: 70,
    step: 'analysis',
    headline: 'Análise em andamento.',
    expectation:
      'Nossa equipe e sistemas estão gerando o relatório técnico. Atualizamos esta página conforme houver novidades.',
  },
  FINISHED: {
    label: 'Relatório pronto',
    progress: 100,
    step: 'report',
    headline: 'Consulta concluída.',
    expectation: undefined,
  },
  CANCELED: {
    label: 'Cancelado',
    progress: 0,
    step: 'stopped',
    headline: 'Este pedido foi cancelado.',
    expectation: undefined,
  },
  REJECTED_DATA: {
    label: 'Precisamos de mais informações',
    progress: 25,
    step: 'action_required',
    headline: 'Precisamos de mais informações para continuar.',
    expectation:
      'Sem os dados corretos não conseguimos localizar a matrícula nos cartórios. Envie os ajustes agora para retomarmos a busca.',
  },
  RETURNED_BY_NOTARY: {
    label: 'Retorno do cartório',
    progress: 35,
    step: 'action_required',
    headline: 'O cartório devolveu o pedido.',
    expectation:
      'Revise a mensagem do cartório e envie os ajustes necessários via Re-solicitar, se aplicável.',
  },
  FAILED: {
    label: 'Pagamento não concluído',
    progress: 5,
    step: 'payment',
    headline: 'Não identificamos pagamento confirmado para este pedido.',
    expectation: undefined,
  },
}

export function isBackendOrderStatus(
  value: string | undefined,
): value is BackendOrderStatus {
  return value !== undefined && value in ORDER_STATUS_UI
}

export type OrderJourneyOptions = {
  /** True quando a API indica pagamento já coberto (CONFIRMED) mas o status analítico ainda é PENDING. */
  paymentConfirmed?: boolean
}

export function isOrderPaymentConfirmed(
  paymentStatus: { value?: string } | undefined,
): boolean {
  return paymentStatus?.value === 'CONFIRMED'
}

export function resolveOrderStatusUI(
  statusValue: string | undefined,
  options?: OrderJourneyOptions,
): OrderStatusUIConfig {
  if (
    statusValue === 'PENDING' &&
    options?.paymentConfirmed
  ) {
    return ORDER_PENDING_PAYMENT_CONFIRMED_UI
  }
  if (isBackendOrderStatus(statusValue)) {
    return ORDER_STATUS_UI[statusValue]
  }
  return DEFAULT_UI
}

/** Statuses where the pipeline is actively running (worth polling). */
export function isOrderPipelineActive(statusValue: string | undefined): boolean {
  return (
    statusValue === 'SEARCHING_DOCUMENT' || statusValue === 'IN_PROGRESS'
  )
}

/** Terminal order statuses — polling must be off. */
export function isOrderTerminalStatus(statusValue: string | undefined): boolean {
  return (
    statusValue === 'FINISHED' ||
    statusValue === 'CANCELED' ||
    statusValue === 'MANUAL_REVIEW_PENDING'
  )
}

/** Polling interval for pipeline events timeline (ms); `false` = off. */
export function getOrderEventsRefetchIntervalMs(
  statusValue: string | undefined,
): number | false {
  if (isOrderTerminalStatus(statusValue)) return false
  if (
    statusValue === 'REJECTED_DATA' ||
    statusValue === 'RETURNED_BY_NOTARY'
  ) {
    return 90_000
  }
  if (isOrderPipelineActive(statusValue)) {
    return 12_000
  }
  return false
}

/**
 * Adaptive polling (ms). Returns `false` when idle polling should stop.
 */
export function getOrderRefetchIntervalMs(
  statusValue: string | undefined,
  options?: OrderJourneyOptions,
): number | false {
  switch (statusValue) {
    case 'SEARCHING_DOCUMENT':
      return 15_000
    case 'IN_PROGRESS':
      return 10_000
    case 'PENDING':
      if (options?.paymentConfirmed) {
        return 15_000
      }
      return 45_000
    case 'FINISHED':
    case 'CANCELED':
    case 'MANUAL_REVIEW_PENDING':
      return false
    case 'REJECTED_DATA':
    case 'RETURNED_BY_NOTARY':
      return 90_000
    default:
      return false
  }
}

function rowsFromStates(
  states: [TimelineDotState, TimelineDotState, TimelineDotState, TimelineDotState],
): OrderTimelineRow[] {
  return ORDER_PIPELINE_TIMELINE_TITLES.map((title, i) => ({
    id: title,
    title,
    state: states[i]!,
  }))
}

/**
 * Step-based timeline (honest states — no fake %).
 */
export function getOrderTimelineRows(
  statusValue: string | undefined,
  options?: OrderJourneyOptions,
): OrderTimelineRow[] {
  switch (statusValue) {
    case 'PENDING':
      if (options?.paymentConfirmed) {
        return rowsFromStates(['done', 'current', 'pending', 'pending'])
      }
      return rowsFromStates(['current', 'pending', 'pending', 'pending'])
    case 'FAILED':
      return rowsFromStates(['current', 'pending', 'pending', 'pending'])
    case 'SEARCHING_DOCUMENT':
      return rowsFromStates(['done', 'current', 'pending', 'pending'])
    case 'IN_PROGRESS':
      return rowsFromStates(['done', 'done', 'current', 'pending'])
    case 'FINISHED':
      return rowsFromStates(['done', 'done', 'done', 'done'])
    case 'CANCELED':
      return rowsFromStates(['attention', 'pending', 'pending', 'pending'])
    case 'REJECTED_DATA':
      return rowsFromStates(['done', 'attention', 'pending', 'pending'])
    case 'RETURNED_BY_NOTARY':
      return rowsFromStates(['done', 'attention', 'pending', 'pending'])
    default:
      return rowsFromStates(['pending', 'pending', 'pending', 'pending'])
  }
}
