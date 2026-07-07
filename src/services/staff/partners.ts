import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) throw new Error('Sessão não encontrada. Entre novamente.')
  return fn(token)
}

export type PartnerScope =
  | 'analysis:create'
  | 'analysis:read'
  | 'certificate:read'
  | 'webhook:manage'
  | 'integration:manage'

export const ALL_SCOPES: { value: PartnerScope; label: string }[] = [
  { value: 'analysis:create', label: 'Criar análises/pedidos' },
  { value: 'analysis:read', label: 'Ler análises/pedidos' },
  { value: 'certificate:read', label: 'Ler certidões' },
  { value: 'webhook:manage', label: 'Gerenciar webhooks' },
  { value: 'integration:manage', label: 'Gerenciar integração (redirect_uris + branding)' },
]

export type PartnerStatus = 'ACTIVE' | 'SUSPENDED'

export type Partner = {
  id: string
  name: string
  slug: string
  status: PartnerStatus
  is_partner: boolean
  credits_balance: string
  /** Credencial M2M (client_credentials). */
  client_id: string | null
  /** Credencial do consent delegado (authorization_code + PKCE); null se não provisionada. */
  consent_client_id: string | null
  /** redirect_uris (https) cadastrados no app de consent. */
  redirect_uris: string[]
  /** Branding da integração (exibido na tela de consent). */
  website: string | null
  description: string | null
  /** logo efetivo (upload tem precedência sobre link). */
  logo_url: string | null
  scopes: PartnerScope[]
  owner_email: string | null
  created: string
}

export type PartnerProvisioned = Partner & {
  client_secret: string
  /** Secret do app de consent; só presente quando redirect_uris foi enviado na criação. */
  consent_client_secret?: string
}

/** PATCH pode emitir o app de consent (e seu secret, uma vez) ao receber redirect_uris pela 1ª vez. */
export type PartnerUpdated = Partner & {
  consent_client_id?: string
  consent_client_secret?: string
}

export type RotatedSecret = { app: string; client_id: string; client_secret: string }

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
  /** Se enviado, provisiona também o app de consent delegado (authorization_code + PKCE). */
  redirect_uris?: string[]
  website?: string
  description?: string
  logo_url?: string
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
  /** Atualiza (ou cria, se ainda não existir) o app de consent delegado. */
  redirect_uris?: string[]
  website?: string
  description?: string
  logo_url?: string
}

export async function updatePartner(id: string, body: UpdatePartnerBody): Promise<PartnerUpdated> {
  return withToken((token) =>
    api.patch(endpoint.staff.partner(id), body, token),
  ) as Promise<PartnerUpdated>
}

/** app: 'm2m' (default) ou 'consent' — escolhe qual credencial rotacionar. */
export async function rotatePartnerSecret(
  id: string,
  app: 'm2m' | 'consent' = 'm2m',
): Promise<RotatedSecret> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerRotateSecret(id), { app }, token),
  ) as Promise<RotatedSecret>
}

/** Upload seguro do logo do parceiro (re-encodado no backend). Retorna o parceiro atualizado. */
export async function uploadPartnerLogo(id: string, file: File): Promise<Partner> {
  const form = new FormData()
  form.append('file', file)
  return withToken((token) =>
    api.post(endpoint.staff.partnerLogo(id), form, token),
  ) as Promise<Partner>
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
  body: { email?: string; client_secret?: string; consent_client_secret?: string } = {},
): Promise<{ detail: string; email: string }> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerSendOnboarding(id), body, token),
  ) as Promise<{ detail: string; email: string }>
}

export type PartnerIntegrationReportConfig = {
  weekly_enabled: boolean
  commission_on_credits: boolean
  recipient_emails: string[]
  commission_per_order: string | null
  last_sent_at: string | null
  last_error: string
  resolved_recipients: string[]
}

export async function getPartnerIntegrationReport(id: string): Promise<PartnerIntegrationReportConfig> {
  return withToken((token) =>
    api.get(endpoint.staff.partnerIntegrationReport(id), token),
  ) as Promise<PartnerIntegrationReportConfig>
}

export async function updatePartnerIntegrationReport(
  id: string,
  body: Partial<{
    weekly_enabled: boolean
    commission_on_credits: boolean
    recipient_emails: string[]
    commission_per_order: number | null
  }>,
): Promise<PartnerIntegrationReportConfig> {
  return withToken((token) =>
    api.patch(endpoint.staff.partnerIntegrationReport(id), body, token),
  ) as Promise<PartnerIntegrationReportConfig>
}

export async function previewPartnerIntegrationReport(
  id: string,
  format: 'html' | 'pdf' = 'html',
): Promise<Blob> {
  return withToken((token) =>
    api.getBlob(`${endpoint.staff.partnerIntegrationReportPreview(id)}?format=${format}`, token),
  )
}

export async function sendPartnerIntegrationReport(
  id: string,
  body: { email?: string; async?: boolean } = {},
): Promise<{ detail: string; recipients?: string[]; async?: boolean }> {
  return withToken((token) =>
    api.post(endpoint.staff.partnerIntegrationReportSend(id), body, token),
  ) as Promise<{ detail: string; recipients?: string[]; async?: boolean }>
}
