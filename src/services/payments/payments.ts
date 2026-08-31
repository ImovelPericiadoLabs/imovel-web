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
  /** Código do voucher de evento. O backend recusa em silêncio se a flag estiver off. */
  voucher_code?: string
  billing_type?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD'
}

export type CheckoutBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD'

export type PaymentMethodItem = {
  code: CheckoutBillingType
  label: string
  available: boolean
  status: 'available' | 'maintenance'
  reason: string
}

export type PaymentMethodsCatalog = {
  methods: PaymentMethodItem[]
  fallback: CheckoutBillingType | null
  available: CheckoutBillingType[]
}

export type ProcessPaymentResult =
  | { encodedImage?: string; payload?: string; id?: string; billing_type?: CheckoutBillingType; invoice_url?: string }
  | { id: string; billing_type: CheckoutBillingType; invoice_url?: string; bank_slip_url?: string; status?: string }
  | { id: string; paid_with_credits: true }
  /** Voucher cobriu 100%: pedido criado sem cobrança, então não existe PIX a exibir. */
  | { id: string; paid_with_voucher: true }

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

export type QuoteRequest = {
  entry_path?: 'address' | 'document' | 'registry'
  include_certificates?: boolean
  uf?: string | null
  place_id?: string
  document_id?: string
  registration_number?: string
  notary?: string
  /** Faz a cotação já vir com o desconto do voucher aplicado. */
  voucher_code?: string
}

/** Desconto do voucher sobre esta cotação. `null` quando não foi enviado código. */
export type QuoteVoucher =
  | { applied: true; event_name: string; describe: string; covered: number; payable: number }
  | { applied: false; code: string; message: string }

export type PaymentQuote = {
  entry_path: string
  new_pricing: boolean
  include_certificates: boolean
  uf: string | null
  base_price: number
  surcharge: number
  surcharge_configured: boolean
  certificates_surcharge: number
  amount: number
  voucher: QuoteVoucher | null
}

/** POST /payments/quote/ — preço dinâmico (base + sobretaxa Inteiro-Teor por UF). Público. */
export async function getQuote(data: QuoteRequest): Promise<PaymentQuote> {
  return api.post(endpoint.payments.quote, data) as Promise<PaymentQuote>
}

export type PricingTableRow = {
  uf: string
  uf_name: string
  registry_price: number
  address_surcharge: number
  address_price: number
}

export type PricingTableResponse = {
  new_pricing: boolean
  base_price: number
  certificates_upsell: number
  updated_at: string | null
  rows: PricingTableRow[]
}

/** GET /payments/pricing-table/ — tabela pública de preços por UF. Público. */
export async function getPricingTable(): Promise<PricingTableResponse> {
  return api.get(endpoint.payments.pricingTable) as Promise<PricingTableResponse>
}

export type PaymentStatusResponse = {
  status: string
}

export async function getPaymentMethods(): Promise<PaymentMethodsCatalog> {
  return api.get(endpoint.payments.methods) as Promise<PaymentMethodsCatalog>
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  return api.get(`${endpoint.payments.status}/${paymentId}/`, token) as Promise<PaymentStatusResponse>
}