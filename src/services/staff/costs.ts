import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) throw new Error('Sessão não encontrada. Entre novamente.')
  return fn(token)
}

export type CostTotals = {
  revenue: number
  cost: number
  profit: number
  commission: number
  refunds: number
  net_profit: number
  margin: number
  net_margin: number
  orders: number
  avg_ticket: number
  avg_cost_per_order: number
}

export type MarginRisk = {
  guard_pct: number
  orders_near_limit: number
  orders_over_limit: number
  excess_cost: number
  in_manual_review: number
}

export type CostSeriesPoint = { date: string; cost: number; revenue: number; profit: number }
export type CostByIntegration = { integration: string; cost: number; calls: number; avg_cost: number }
export type CostByPartner = {
  org_id: string
  name: string
  orders: number
  commissionable_orders: number
  cost: number
  revenue: number
  commission: number
  profit: number
  net_profit: number
  net_margin: number
}

export type CostOverview = {
  from: string
  to: string
  totals: CostTotals
  risk: MarginRisk
  series: CostSeriesPoint[]
  by_integration: CostByIntegration[]
  by_partner: CostByPartner[]
}

export type CostOverviewParams = {
  from?: string
  to?: string
  integration?: string
  org?: string
}

export async function getCostOverview(params: CostOverviewParams = {}): Promise<CostOverview> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.integration) search.set('integration', params.integration)
  if (params.org) search.set('org', params.org)
  const qs = search.toString()
  return withToken((token) =>
    api.get(`${endpoint.staff.costsOverview}${qs ? `?${qs}` : ''}`, token),
  ) as Promise<CostOverview>
}
