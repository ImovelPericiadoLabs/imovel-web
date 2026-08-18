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

export type SupportConversation = {
  id: string
  external_conversation_id: string
  contact_phone_e164: string
  customer_id: string | null
  customer_name: string | null
  primary_order: SupportOrderCard | null
  related_orders: SupportOrderCard[]
  last_message_preview: string
  last_message_at: string | null
  instance_name?: string
}

export type SupportMessage = {
  id: string
  content: string
  direction: 'in' | 'out' | 'unknown'
  created_at: string | null
  private?: boolean
}

export type SupportConversationDetail = {
  conversation: Omit<SupportConversation, 'related_orders' | 'primary_order' | 'instance_name'>
  orders: SupportOrderCard[]
  messages: SupportMessage[]
}

function normalizeMessage(raw: unknown): SupportMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const id = String(m.id ?? m.message_id ?? '')
  if (!id) return null

  const content = String(
    m.content ?? m.processed_message_content ?? m.body ?? m.text ?? '',
  )

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
  }
}

export async function listSupportConversations(): Promise<SupportConversation[]> {
  return guard(async (token) => {
    const data = (await api.get(endpoint.messaging.conversations, token)) as {
      results?: SupportConversation[]
    }
    return data.results ?? []
  })
}

export async function getSupportConversation(id: string): Promise<SupportConversationDetail> {
  return guard(async (token) => {
    const data = (await api.get(endpoint.messaging.conversation(id), token)) as {
      conversation: SupportConversationDetail['conversation']
      orders?: SupportOrderCard[]
      messages?: unknown[]
    }
    return {
      conversation: data.conversation,
      orders: data.orders ?? [],
      messages: (data.messages ?? []).map(normalizeMessage).filter(Boolean) as SupportMessage[],
    }
  })
}

export async function sendSupportMessage(id: string, content: string): Promise<void> {
  await guard(async (token) => {
    await api.post(endpoint.messaging.conversation(id), { content }, token)
  })
}
