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
  margin: number
  orders: number
}

export type CostSeriesPoint = { date: string; cost: number; revenue: number }
export type CostByIntegration = { integration: string; cost: number }
export type CostByPartner = {
  org_id: string
  name: string
  cost: number
  revenue: number
  profit: number
}

export type CostOverview = {
  from: string
  to: string
  totals: CostTotals
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
