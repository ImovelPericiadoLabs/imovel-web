import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) throw new Error('Sessão não encontrada. Entre novamente.')
  return fn(token)
}

export type PartnerScope = 'analysis:create' | 'analysis:read' | 'certificate:read' | 'webhook:manage'

export const ALL_SCOPES: { value: PartnerScope; label: string }[] = [
  { value: 'analysis:create', label: 'Criar análises/pedidos' },
  { value: 'analysis:read', label: 'Ler análises/pedidos' },
  { value: 'certificate:read', label: 'Ler certidões' },
  { value: 'webhook:manage', label: 'Gerenciar webhooks' },
]

export type PartnerStatus = 'ACTIVE' | 'SUSPENDED'

export type Partner = {
  id: string
  name: string
  slug: string
  status: PartnerStatus
  is_partner: boolean
  credits_balance: string
  client_id: string | null
  scopes: PartnerScope[]
  owner_email: string | null
  created: string
}

export type PartnerProvisioned = Partner & { client_secret: string }

export type RotatedSecret = { client_id: string; client_secret: string }

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listPartners(page = 1, search = ''): Promise<Paginated<Partner>> {
  const params = new URLSearchParams({ page: String(page) })
  if (search.trim()) params.set('search', search.trim())
  return withToken((token) =>
    api.get(`${endpoint.staff.partners}?${params.toString()}`, token),
  ) as Promise<Paginated<Partner>>
}

export async function getPartner(id: string): Promise<Partner> {
  return withToken((token) => api.get(endpoint.staff.partner(id), token)) as Promise<Partner>
}

export type CreatePartnerBody = {
  name: string
  email?: string
  first_name?: string
  last_name?: string
  initial_credits?: number
  scopes?: PartnerScope[]
  notes?: string
}

export async function createPartner(body: CreatePartnerBody): Promise<PartnerProvisioned> {
  return withToken((token) =>
    api.post(endpoint.staff.partners, body, token),
  ) as Promise<PartnerProvisioned>
}

export type UpdatePartnerBody = {
  scopes?: PartnerScope[]
  status?: PartnerStatus
}

export async function updatePartner(id: string, body: UpdatePartnerBody): Promise<Partner> {
  return withToken((token) =>
    api.patch(endpoint.staff.partner(id), body, token),
  ) as Promise<Partner>
}

export async function rotatePartnerSecret(id: string): Promise<RotatedSecret> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerRotateSecret(id), {}, token),
  ) as Promise<RotatedSecret>
}

export async function topUpPartnerCredits(
  id: string,
  body: { amount: number; notes?: string },
): Promise<Partner> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerCredits(id), body, token),
  ) as Promise<Partner>
}

export async function sendPartnerOnboarding(
  id: string,
  body: { email?: string } = {},
): Promise<{ detail: string; email: string }> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerSendOnboarding(id), body, token),
  ) as Promise<{ detail: string; email: string }>
}
