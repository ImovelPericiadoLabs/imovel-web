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

function q(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export type ChatCampaign = {
  id: string
  name: string
  status: string
  ai_enabled: boolean
  system_prompt: string
  playbook: Record<string, unknown>
  disclosure_prefix: string
  phone_number_id: string
  created?: string
  modified?: string
}

export type ChatConversation = {
  id: string
  campaign: string
  campaign_name?: string
  customer_wa_id: string
  customer_display_name?: string
  state: string
  ai_active: boolean
  ai_disclosure_sent: boolean
  assigned_to: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
}

export type ChatMessage = {
  id: string
  conversation: string
  direction: string
  body: string
  wa_message_type?: string
  provider_msg_id: string | null
  raw: Record<string, unknown>
  sender: string | null
  created?: string
}

/** media_id Graph (imagem/vídeo/áudio/documento) a partir do payload ou do texto gerado pelo backend. */
export function extractWaMediaIdFromChatMessage(msg: ChatMessage): string | null {
  const fromBody = msg.body.match(/\(media_id=([^)]+)\)/)
  if (fromBody?.[1]) {
    const id = fromBody[1].trim()
    if (id) return id
  }
  const raw = msg.raw
  if (!raw || typeof raw !== 'object') return null
  const typ = (msg.wa_message_type || String((raw as { type?: string }).type || '')).toLowerCase()
  const key = ['image', 'video', 'audio', 'document', 'sticker'].find((k) => k === typ)
  if (!key) return null
  const block = (raw as Record<string, unknown>)[key]
  if (!block || typeof block !== 'object') return null
  const id = (block as { id?: string }).id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

export type ChatLead = {
  id: string
  conversation: string
  campaign_id: string
  customer_wa_id: string
  payload: Record<string, unknown>
  status: string
  order: string | null
}

export type ChatScheduledMessage = {
  id: string
  campaign: string
  run_at: string
  kind: string
  session_text: string
  template_name: string
  template_lang: string
  template_components: unknown[]
  recipient_wa_id: string
  run_status: string
  last_error: string
  processed_at: string | null
}

export async function listChatCampaigns(): Promise<ChatCampaign[]> {
  return guard((token) => api.get(endpoint.chat.campaigns, token) as Promise<ChatCampaign[]>)
}

export async function createChatCampaign(body: Partial<ChatCampaign>): Promise<ChatCampaign> {
  return guard((token) => api.post(endpoint.chat.campaigns, body, token) as Promise<ChatCampaign>)
}

export async function patchChatCampaign(id: string, body: Partial<ChatCampaign>): Promise<ChatCampaign> {
  return guard((token) => api.patch(endpoint.chat.campaign(id), body, token) as Promise<ChatCampaign>)
}

export async function listChatConversations(params?: {
  campaign?: string
  state?: string
  limit?: number
}): Promise<ChatConversation[]> {
  return guard(
    (token) => api.get(`${endpoint.chat.conversations}${q(params ?? {})}`, token) as Promise<ChatConversation[]>,
  )
}

export async function getChatConversation(id: string): Promise<ChatConversation> {
  return guard((token) => api.get(endpoint.chat.conversation(id), token) as Promise<ChatConversation>)
}

export async function listChatMessages(
  conversationId: string,
  params?: { limit?: number; before?: string },
): Promise<ChatMessage[]> {
  return guard(
    (token) =>
      api.get(`${endpoint.chat.conversationMessages(conversationId)}${q(params ?? {})}`, token) as Promise<
        ChatMessage[]
      >,
  )
}

export async function postChatOperatorMessage(conversationId: string, body: string): Promise<ChatMessage> {
  return guard(
    (token) =>
      api.post(endpoint.chat.conversationMessages(conversationId), { body }, token) as Promise<ChatMessage>,
  )
}

export async function postChatHandoff(conversationId: string): Promise<ChatConversation> {
  return guard((token) => api.post(endpoint.chat.conversationHandoff(conversationId), {}, token) as Promise<ChatConversation>)
}

export async function postChatToggleAi(conversationId: string, aiActive: boolean): Promise<ChatConversation> {
  return guard(
    (token) => api.post(endpoint.chat.conversationToggleAi(conversationId), { ai_active: aiActive }, token) as Promise<ChatConversation>,
  )
}

export async function postChatReplayAi(conversationId: string): Promise<{ detail: string }> {
  return guard((token) => api.post(endpoint.chat.conversationReplayAi(conversationId), {}, token) as Promise<{ detail: string }>)
}

export async function listChatLeads(params?: { status?: string }): Promise<ChatLead[]> {
  return guard((token) => api.get(`${endpoint.chat.leads}${q(params ?? {})}`, token) as Promise<ChatLead[]>)
}

export async function patchChatLead(id: string, body: { status?: string; order?: string | null }): Promise<ChatLead> {
  return guard((token) => api.patch(endpoint.chat.lead(id), body, token) as Promise<ChatLead>)
}

export async function listChatScheduled(params?: { campaign?: string }): Promise<ChatScheduledMessage[]> {
  return guard((token) => api.get(`${endpoint.chat.scheduled}${q(params ?? {})}`, token) as Promise<ChatScheduledMessage[]>)
}

export async function createChatScheduled(body: Record<string, unknown>): Promise<ChatScheduledMessage> {
  return guard((token) => api.post(endpoint.chat.scheduled, body, token) as Promise<ChatScheduledMessage>)
}

export async function cancelChatScheduled(id: string): Promise<ChatScheduledMessage> {
  return guard((token) => api.post(endpoint.chat.scheduledCancel(id), {}, token) as Promise<ChatScheduledMessage>)
}
