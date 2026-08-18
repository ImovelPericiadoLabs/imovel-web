import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'
import { requestReauth } from '@/utils/auth-reauth'

async function guard<T>(callback: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) {
    requestReauth()
    throw new Error('Sessão inválida ou expirada.')
  }
  return callback(token)
}

export type SupportInboxStatus =
  | 'new'
  | 'unread'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'resolved'

export type SupportOrderCard = {
  id: string
  code: number | string
  status: string
  payment_status?: string
  registration_number?: string | null
  formatted_address?: string
  created?: string
  modified?: string
  onr_protocol?: string | null
  latest_notary_message?: string | null
}

export type SupportAssignee = {
  id: string
  name: string
  email: string
}

export type SupportInboxPermissions = {
  view_all?: boolean
  reply?: boolean
  assign?: boolean
  resolve?: boolean
  customer?: boolean
  order?: boolean
}

export type SupportConversation = {
  id: string
  source?: 'support' | 'campaign'
  external_conversation_id: string
  contact_phone_e164: string | null
  customer_id: string | null
  customer_name: string | null
  status: SupportInboxStatus
  assignee: SupportAssignee | null
  primary_order: SupportOrderCard | null
  related_orders: SupportOrderCard[]
  last_message_preview: string
  last_message_at: string | null
  instance_name?: string | null
  campaign_name?: string | null
  ai_active?: boolean | null
  chat_state?: string | null
  chat_conversation_id?: string | null
}


export type SupportMessage = {
  id: string
  content: string
  direction: 'in' | 'out' | 'unknown'
  created_at: string | null
  private?: boolean
  sendState?: 'sending' | 'sent' | 'error'
}

export type SupportConversationDetail = {
  conversation: SupportConversation
  orders: SupportOrderCard[]
  messages: SupportMessage[]
  permissions?: SupportInboxPermissions
}

export const STATUS_LABELS: Record<SupportInboxStatus, string> = {
  new: 'Nova',
  unread: 'Não lida',
  in_progress: 'Em atendimento',
  waiting_customer: 'Aguardando cliente',
  waiting_internal: 'Aguardando interno',
  resolved: 'Resolvida',
}

function normalizeMessage(raw: unknown): SupportMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const id = String(m.id ?? m.message_id ?? '')
  if (!id) return null

  const content = String(m.content ?? m.processed_message_content ?? m.body ?? m.text ?? '')

  let direction: SupportMessage['direction'] = 'unknown'
  const messageType = m.message_type ?? m.messageType ?? m.direction
  if (messageType === 0 || messageType === 'incoming' || messageType === 'in') {
    direction = 'in'
  } else if (
    messageType === 1 ||
    messageType === 'outgoing' ||
    messageType === 'out' ||
    Boolean(m.private)
  ) {
    direction = 'out'
  }

  const created =
    (m.created_at as string | undefined) ||
    (m.createdAt as string | undefined) ||
    (m.timestamp as string | undefined) ||
    null

  return {
    id,
    content,
    direction,
    created_at: created,
    private: Boolean(m.private),
    sendState: 'sent',
  }
}

export async function listSupportConversations(params?: {
  status?: string
  assignee?: string
  q?: string
  source?: 'all' | 'support' | 'campaign'
}): Promise<{ results: SupportConversation[]; permissions: SupportInboxPermissions }> {
  return guard(async (token) => {
    const sp = new URLSearchParams()
    if (params?.status) sp.set('status', params.status)
    if (params?.assignee) sp.set('assignee', params.assignee)
    if (params?.q) sp.set('q', params.q)
    if (params?.source && params.source !== 'all') sp.set('source', params.source)
    const qs = sp.toString()
    const url = `${endpoint.messaging.conversations}${qs ? `?${qs}` : ''}`
    const data = (await api.get(url, token)) as {
      results?: SupportConversation[]
      permissions?: SupportInboxPermissions
    }
    return {
      results: data.results ?? [],
      permissions: data.permissions ?? {},
    }
  })
}

export async function getSupportConversation(id: string): Promise<SupportConversationDetail> {
  return guard(async (token) => {
    const data = (await api.get(endpoint.messaging.conversation(id), token)) as {
      conversation: SupportConversation
      orders?: SupportOrderCard[]
      messages?: unknown[]
      permissions?: SupportInboxPermissions
    }
    return {
      conversation: data.conversation,
      orders: data.orders ?? [],
      messages: (data.messages ?? []).map(normalizeMessage).filter(Boolean) as SupportMessage[],
      permissions: data.permissions ?? {},
    }
  })
}

export async function sendSupportMessage(id: string, content: string): Promise<void> {
  await guard(async (token) => {
    await api.post(endpoint.messaging.conversation(id), { content }, token)
  })
}

export async function patchSupportConversation(
  id: string,
  body: { assignee_id?: string | null; status?: SupportInboxStatus },
): Promise<SupportConversation> {
  return guard(async (token) => {
    const data = (await api.patch(endpoint.messaging.conversation(id), body, token)) as {
      conversation: SupportConversation
    }
    return data.conversation
  })
}

export async function postSupportHandoff(id: string): Promise<SupportConversation> {
  return guard(async (token) => {
    const data = (await api.post(endpoint.messaging.conversationHandoff(id), {}, token)) as {
      conversation: SupportConversation
    }
    return data.conversation
  })
}

export async function postSupportToggleAi(
  id: string,
  aiActive: boolean,
): Promise<SupportConversation> {
  return guard(async (token) => {
    const data = (await api.post(
      endpoint.messaging.conversationToggleAi(id),
      { ai_active: aiActive },
      token,
    )) as {
      conversation: SupportConversation
    }
    return data.conversation
  })
}
