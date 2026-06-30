import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) {
    throw new Error('Sessão não encontrada. Entre novamente.')
  }
  return fn(token)
}

export type PartnerGrantReason = 'INITIAL' | 'TOP_UP' | 'ADJUSTMENT'

export type PartnerGrant = {
  id: string
  amount: string
  balance_after: string
  reason: PartnerGrantReason
  notes: string
  granted_by_email: string | null
  created: string
}

export type PartnerAccount = {
  id: string
  email: string
  first_name: string
  last_name: string
  whatsapp: string
  credits_balance: string
  is_active: boolean
  is_partner_test: boolean
  created: string
  last_grant_at: string | null
}

export type PartnerAccountDetail = PartnerAccount & {
  grants: PartnerGrant[]
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listPartnerAccounts(
  page = 1,
  search = '',
): Promise<Paginated<PartnerAccount>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  if (search.trim()) params.set('search', search.trim())
  return withToken((token) =>
    api.get(`${endpoint.staff.partnerAccounts}?${params.toString()}`, token),
  ) as Promise<Paginated<PartnerAccount>>
}

export async function getPartnerAccount(id: string): Promise<PartnerAccountDetail> {
  return withToken((token) =>
    api.get(endpoint.staff.partnerAccount(id), token),
  ) as Promise<PartnerAccountDetail>
}

export type CreatePartnerAccountBody = {
  email: string
  first_name?: string
  last_name?: string
  whatsapp?: string
  initial_credits: number
  notes?: string
  send_invite_email?: boolean
}

export async function createPartnerAccount(
  body: CreatePartnerAccountBody,
): Promise<PartnerAccountDetail> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerAccounts, body, token),
  ) as Promise<PartnerAccountDetail>
}

export type TopUpPartnerCreditsBody = {
  amount: number
  notes?: string
}

export async function topUpPartnerCredits(
  id: string,
  body: TopUpPartnerCreditsBody,
): Promise<PartnerAccountDetail> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerAccountCredits(id), body, token),
  ) as Promise<PartnerAccountDetail>
}

/** Desativa conta de parceiro (soft delete no backend). */
export async function deletePartnerAccount(id: string): Promise<void> {
  await withToken((token) => api.delete(endpoint.staff.partnerAccount(id), token))
}
