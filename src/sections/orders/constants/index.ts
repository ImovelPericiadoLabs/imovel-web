export type SemaphoreStatus = 'green' | 'yellow' | 'red' | 'blue'

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info'

export type OrderStatus =
  | 'ALL_GOOD'
  | 'IRREGULARITIES_FOUND'
  | 'PURCHASE_AND_SALE_BLOCKED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'FINISHED'


export const STATUS_THEME = {
  success: {
    variant: 'success' as BadgeStatus,
    dot: 'bg-green-600',
    border: 'border-green-500',
    text: 'text-green-600',
    badge: 'text-green-600 border-green-500'
  },
  warning: {
    variant: 'warning' as BadgeStatus,
    dot: 'bg-yellow-400',
    border: 'border-yellow-400',
    text: 'text-yellow-600',
    badge: 'text-yellow-600 border-yellow-400'
  },
  danger: {
    variant: 'danger' as BadgeStatus,
    dot: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-600',
    badge: 'text-red-600 border-red-500'
  },
  info: {
    variant: 'info' as BadgeStatus,
    dot: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-blue-500',
    badge: 'text-blue-500 border-blue-500'
  }
} as const

export type ThemeKey = keyof typeof STATUS_THEME

export const SEMAPHORE_CONFIG: Record<
  SemaphoreStatus,
  {
    label: string
    theme: ThemeKey
  }
> = {
  green: {
    label: 'Sinal Verde',
    theme: 'success'
  },
  yellow: {
    label: 'Sinal Amarelo',
    theme: 'warning'
  },
  red: {
    label: 'Sinal Vermelho',
    theme: 'danger'
  },
  blue: {
    label: 'Sinal Azul',
    theme: 'info'
  }
}

export const STATUS_LABEL: Record<
  Exclude<OrderStatus, 'FINISHED'>,
  string
> = {
  ALL_GOOD: 'Tudo certo',
  IRREGULARITIES_FOUND: 'Irregularidades encontradas',
  PURCHASE_AND_SALE_BLOCKED: 'Impeditivo de compra e venda',
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento'
}


export interface OrderLike {
  status?: {
    value?: string
  }
  semaphore?: unknown
}

export function isSemaphore(value: unknown): value is SemaphoreStatus {
  return (
    value === 'green' ||
    value === 'yellow' ||
    value === 'red' ||
    value === 'blue'
  )
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'ALL_GOOD' ||
    value === 'IRREGULARITIES_FOUND' ||
    value === 'PURCHASE_AND_SALE_BLOCKED' ||
    value === 'PENDING' ||
    value === 'IN_PROGRESS' ||
    value === 'FINISHED'
  )
}

export function resolveOrderTheme(order: OrderLike) {
  const status = order.status?.value

  if (status === 'FINISHED' && isSemaphore(order.semaphore)) {
    const config = SEMAPHORE_CONFIG[order.semaphore]
    return STATUS_THEME[config.theme]
  }

  return STATUS_THEME.info
}

export function resolveBadgeLabel(order: OrderLike) {
  const status = order.status?.value

  if (status === 'FINISHED' && isSemaphore(order.semaphore)) {
    return SEMAPHORE_CONFIG[order.semaphore].label
  }

  if (isOrderStatus(status) && status !== 'FINISHED') {
    return STATUS_LABEL[status]
  }

  return '—'
}

export function resolveListBadgeLabel(order: OrderLike) {
  const status = order.status?.value

  if (!status) return '—'

  if (status === 'FINISHED') {
    if (order.semaphore === 'green') return 'Tudo certo'
    if (order.semaphore === 'red') return 'Impeditivo de compra e venda'
    if (order.semaphore === 'yellow') return 'Irregularidades encontradas'
  }

  if (status !== 'FINISHED') {
    return STATUS_LABEL[status as Exclude<OrderStatus, 'FINISHED'>] ?? '—'
  }

  return '—'
}

export function resolveDetailBadgeLabel(order: OrderLike) {
  const status = order.status?.value

  if (status === 'FINISHED' && isSemaphore(order.semaphore)) {
    return SEMAPHORE_CONFIG[order.semaphore].label
  }

  if (isOrderStatus(status) && status !== 'FINISHED') {
    return STATUS_LABEL[status]
  }

  return '—'
}
