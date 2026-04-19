import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { signOut } from 'next-auth/react'
import { getSessionDeduplicated } from '@/utils/session'

async function handleUnauthorized() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('auth:unauthorized'))
  await signOut({ redirect: false })
}

async function guard<T>(callback: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  if (!token) {
    throw new Error(
      'Não foi possível obter a sessão. Verifique sua conexão ou entre novamente.',
    )
  }

  return callback(token)
}

export type RegistryTemplateMeta = {
  id: string
  requires_media: boolean
  required_vars: string[]
  required_vars_whatsapp: string[] | null
  required_vars_email: string[] | null
}

export type WhatsAppSpec = {
  id: string
  template_name: string
  lang: string
  body_parameter_names: string[]
  header_requires_media: boolean
  header_format: string
  meta_template_id: string
  is_active: boolean
}

export type EmailTemplate = {
  id: string
  name: string
  subject_template: string
  body_html: string
  is_active: boolean
}

export type RecipientRules = {
  empty_fill?: Record<string, string>
  by_row?: Record<string, Record<string, string>>
  skip_rows?: number[]
}

export type DatasetQualityColumnStat = {
  empty: number
  non_empty: number
  empty_pct: number
}

export type DatasetQuality = {
  row_count: number
  columns: Record<string, DatasetQualityColumnStat>
  channel_gaps: Record<string, unknown>
  template_variables: {
    whatsapp: Array<{
      variable: string
      empty_rows: number
      empty_pct: number
      mapped_csv_column: string | null
    }>
    email: Array<{
      variable: string
      empty_rows: number
      empty_pct: number
      mapped_csv_column: string | null
    }>
    whatsapp_error?: string
    email_error?: string
  }
  rows_with_any_issue: number
  rows_with_any_issue_pct: number
  sample_problem_row_indices: number[]
  skip_rows_count?: number
  skip_row_indices_sample?: number[]
  estimated_rows_to_process?: number
}

export type OutreachCampaign = {
  id: string
  status: string
  is_active: boolean
  channels: string[]
  column_mapping: Record<string, string>
  recipient_rules?: RecipientRules
  email_column: string
  phone_column: string
  csv_columns: string[]
  row_count: number
  dry_run_sample_limit: number
  registry_template_id: string
  email_template: string | null
  whatsapp_spec: string | null
  header_media_url: string
  pixel_base_url: string
  /** ISO8601 da API (listagem e detalhe). */
  created?: string
  /** ISO8601 da API (listagem e detalhe). */
  modified?: string
}

export type OutreachRecipientLog = {
  id: string
  row_index: number
  email: string
  phone: string
  email_status: string
  email_opened_at: string | null
  whatsapp_msg_id: string
  whatsapp_status: string
  whatsapp_delivered_at: string | null
  whatsapp_read_at: string | null
  error_message: string
  rendered_summary: Record<string, unknown>
}

export type CampaignListParams = {
  status?: string
  channel?: string
  search?: string
  ordering?: 'created' | '-created'
  limit?: number
  offset?: number
  /** Inclui campanhas com is_active=false (desativadas). */
  include_inactive?: boolean
}

export type CampaignListResponse = {
  results: OutreachCampaign[]
  total: number
  limit: number
  offset: number
  status_counts: Record<string, number>
}

function outreachQueryString(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    sp.set(k, String(v))
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export async function listRegistryTemplates(): Promise<{ templates: RegistryTemplateMeta[] }> {
  return guard((token) => api.get(endpoint.outreach.registryTemplates, token) as Promise<{ templates: RegistryTemplateMeta[] }>)
}

export async function listWhatsappSpecs(): Promise<WhatsAppSpec[]> {
  return guard((token) => api.get(endpoint.outreach.whatsappSpecs, token) as Promise<WhatsAppSpec[]>)
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  return guard((token) => api.get(endpoint.outreach.emailTemplates, token) as Promise<EmailTemplate[]>)
}

export async function syncMetaTemplates(category?: string): Promise<{
  created: number
  updated: number
  skipped: number
  errors: string[]
}> {
  return guard((token) =>
    api.post(endpoint.outreach.metaWaSync, category ? { category } : {}, token) as Promise<{
      created: number
      updated: number
      skipped: number
      errors: string[]
    }>,
  )
}

export type CreateCampaignFromRowsBody = {
  channels: string[]
  columns: string[]
  rows: Record<string, unknown>[]
  dry_run_sample_limit?: number
  registry_template_id?: string
  email_template_id?: string | null
  whatsapp_spec_id?: string | null
  email_column?: string
  phone_column?: string
  header_media_url?: string
  pixel_base_url?: string
}

/** Cria campanha sem multipart; cada pedido transporta um lote de linhas (o front fragmenta para evitar limites de proxy). */
export async function createCampaignFromRows(body: CreateCampaignFromRowsBody): Promise<{
  campaign: OutreachCampaign
  sample_rows: Record<string, string>[]
}> {
  return guard((token) =>
    api.post(endpoint.outreach.campaignsCreateFromRows, body, token) as Promise<{
      campaign: OutreachCampaign
      sample_rows: Record<string, string>[]
    }>,
  )
}

/** Acrescenta linhas ao CSV existente (lotes), respeitando o limite total da campanha. */
export async function appendCampaignRows(
  id: string,
  rows: Record<string, unknown>[],
): Promise<OutreachCampaign> {
  return guard((token) =>
    api.post(endpoint.outreach.campaignAppendRows(id), { rows }, token) as Promise<OutreachCampaign>,
  )
}

export async function patchCampaign(
  id: string,
  body: Record<string, unknown>,
): Promise<OutreachCampaign> {
  return guard((token) => api.patch(endpoint.outreach.campaign(id), body, token) as Promise<OutreachCampaign>)
}

export async function deleteCampaign(id: string): Promise<void> {
  return guard((token) => api.delete(endpoint.outreach.campaign(id), token) as Promise<void>)
}

export async function previewCampaign(id: string): Promise<{
  previews: Array<{
    row_index: number
    whatsapp: Record<string, unknown> | null
    email: Record<string, unknown> | null
    errors: string[]
  }>
  mapping_errors: string[]
  dataset_quality?: DatasetQuality
}> {
  return guard((token) => api.post(endpoint.outreach.campaignPreview(id), {}, token) as Promise<{
    previews: Array<{
      row_index: number
      whatsapp: Record<string, unknown> | null
      email: Record<string, unknown> | null
      errors: string[]
    }>
    mapping_errors: string[]
    dataset_quality?: DatasetQuality
  }>)
}

export async function sendCampaign(id: string, pixelBaseUrl?: string): Promise<unknown> {
  return guard((token) =>
    api.post(endpoint.outreach.campaignSend(id), pixelBaseUrl ? { pixel_base_url: pixelBaseUrl } : {}, token),
  )
}

export async function listCampaigns(params?: CampaignListParams): Promise<CampaignListResponse> {
  const q = outreachQueryString({
    include_inactive: params?.include_inactive ? 1 : undefined,
    status: params?.status,
    channel: params?.channel,
    search: params?.search,
    ordering: params?.ordering,
    limit: params?.limit,
    offset: params?.offset,
  })
  return guard((token) => api.get(`${endpoint.outreach.campaigns}${q}`, token) as Promise<CampaignListResponse>)
}

export async function getCampaign(id: string): Promise<OutreachCampaign> {
  return guard((token) => api.get(endpoint.outreach.campaign(id), token) as Promise<OutreachCampaign>)
}

export type CampaignRecipientsResponse = {
  results: OutreachRecipientLog[]
  total: number
  limit: number
  offset: number
}

export async function listCampaignRecipients(
  id: string,
  params?: { limit?: number; offset?: number },
): Promise<CampaignRecipientsResponse> {
  const q = outreachQueryString({
    limit: params?.limit,
    offset: params?.offset,
  })
  return guard(
    (token) => api.get(`${endpoint.outreach.campaignRecipients(id)}${q}`, token) as Promise<CampaignRecipientsResponse>,
  )
}
