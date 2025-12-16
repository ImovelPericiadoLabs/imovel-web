type BadgeStatus = 'success' | 'warning' | 'danger'

export const mapBadgeStatus: Record<string, BadgeStatus> = {
  ALL_GOOD: 'success',
  IRREGULARITIES_FOUND: 'warning',
  PURCHASE_AND_SALE_BLOCKED: 'danger',
}

export const mapBadgeText: Record<string, string> = {
  ALL_GOOD: 'Tudo certo',
  IRREGULARITIES_FOUND: 'Irregularidades encontradas',
  PURCHASE_AND_SALE_BLOCKED: 'Impeditivo de compra e venda',
}

export const mapCircleStatus: Record<string, string> = {
  ALL_GOOD: 'bg-green-600',
  IRREGULARITIES_FOUND: 'bg-yellow-400',
  PURCHASE_AND_SALE_BLOCKED: 'bg-red-500',
}
