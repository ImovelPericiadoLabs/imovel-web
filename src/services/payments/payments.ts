import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

type PaymentRequest = {
  place_id: string
  /** Texto livre quando o usuário não selecionou place_id no Google (mín. 10 caracteres no back se sem documento). */
  address_hint?: string
  plan_id: string
  document_id?: string
  name: string
  document: string
  whatsapp: string
  complement?: string
  registration_number?: string
  notary?: string
  notary_state?: string
  notary_city?: string
  lot_number?: string
  lot_name?: string
  block_number?: string
  use_credits?: boolean
  include_certificates?: boolean
  entry_path?: 'address' | 'document' | 'registry'
}

export type ProcessPaymentResult =
  | { encodedImage?: string; payload?: string; id?: string }
  | { id: string; paid_with_credits: true }

export async function processPayment(
  data: PaymentRequest,
  options?: { idempotencyKey?: string },
): Promise<ProcessPaymentResult> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const extraHeaders =
    options?.idempotencyKey != null && options.idempotencyKey !== ''
      ? { 'Idempotency-Key': options.idempotencyKey }
      : undefined

  return api.post(endpoint.payments.process, data, token, extraHeaders) as Promise<ProcessPaymentResult>
}

export type PaymentStatusResponse = {
  status: string
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  return api.get(`${endpoint.payments.status}/${paymentId}/`, token) as Promise<PaymentStatusResponse>
}