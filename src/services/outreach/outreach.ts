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
    await handleUnauthorized()
    throw new Error('Sessão inválida ou expirada.')
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

export type OutreachCampaign = {
  id: string
  status: string
  channels: string[]
  column_mapping: Record<string, string>
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

export async function createCampaignMultipart(form: FormData): Promise<{
  campaign: OutreachCampaign
  sample_rows: Record<string, string>[]
}> {
  return guard((token) =>
    api.post(endpoint.outreach.campaignsCreate, form, token) as Promise<{
      campaign: OutreachCampaign
      sample_rows: Record<string, string>[]
    }>,
  )
}

export async function patchCampaign(
  id: string,
  body: Record<string, unknown>,
): Promise<OutreachCampaign> {
  return guard((token) => api.patch(endpoint.outreach.campaign(id), body, token) as Promise<OutreachCampaign>)
}

export async function previewCampaign(id: string): Promise<{
  previews: Array<{
    row_index: number
    whatsapp: Record<string, unknown> | null
    email: Record<string, unknown> | null
    errors: string[]
  }>
  mapping_errors: string[]
}> {
  return guard((token) => api.post(endpoint.outreach.campaignPreview(id), {}, token) as Promise<{
    previews: Array<{
      row_index: number
      whatsapp: Record<string, unknown> | null
      email: Record<string, unknown> | null
      errors: string[]
    }>
    mapping_errors: string[]
  }>)
}

export async function sendCampaign(id: string, pixelBaseUrl?: string): Promise<unknown> {
  return guard((token) =>
    api.post(endpoint.outreach.campaignSend(id), pixelBaseUrl ? { pixel_base_url: pixelBaseUrl } : {}, token),
  )
}

export async function listCampaigns(): Promise<OutreachCampaign[]> {
  return guard((token) => api.get(endpoint.outreach.campaigns, token) as Promise<OutreachCampaign[]>)
}
