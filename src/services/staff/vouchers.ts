import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) throw new Error('Sessão não encontrada. Entre novamente.')
  return fn(token)
}

export type VoucherBatchStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELED'
export type VoucherStatus = 'ISSUED' | 'REDEEMED' | 'CANCELED' | 'EXPIRED'

/** Espelha `entry_path` do backend (apps/payments/pricing.py). */
export type EntryPath = 'address' | 'registry' | 'document'

export const ENTRY_PATH_LABEL: Record<EntryPath, string> = {
  address: 'Por Endereço',
  registry: 'Por Matrícula',
  document: 'Por Documento',
}

export type VoucherBatch = {
  id: string
  name: string
  event_name: string
  status: VoucherBatchStatus
  credit_amount: string
  allowed_entry_paths: EntryPath[]
  allowed_entry_paths_display: string
  max_vouchers: number
  valid_from: string
  valid_until: string
  issued: number
  redeemed: number
  canceled: number
  expired: number
  created: string
}

export type VoucherBatchReport = {
  batch_id: string
  event_name: string
  status: VoucherBatchStatus
  credit_amount: number
  issued: number
  redeemed: number
  canceled: number
  expired: number
  /** Ainda resgatáveis — é o que representa exposição financeira aberta. */
  outstanding: number
  conversion_rate: number
  redeemed_value: number
  outstanding_value: number
  valid_from: string
  valid_until: string
  expires_in_hours: number
}

export type Voucher = {
  id: string
  code: string
  formatted_code: string
  status: VoucherStatus
  redeemed_by_email: string | null
  redeemed_at: string | null
  canceled_at: string | null
  cancel_reason: string
  created: string
}

export type VoucherEvent = {
  id: number
  action: string
  actor_email: string | null
  ip: string | null
  metadata: Record<string, unknown>
  created: string
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type CreateBatchPayload = {
  name: string
  event_name: string
  credit_amount: string
  allowed_entry_paths: EntryPath[]
  max_vouchers: number
  valid_from: string
  valid_until: string
  status?: VoucherBatchStatus
  notes?: string
}

export async function listBatches(page = 1, filters: { event?: string; status?: string } = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (filters.event?.trim()) params.set('event', filters.event.trim())
  if (filters.status) params.set('status', filters.status)
  return withToken((token) =>
    api.get(`${endpoint.staff.voucherBatches}?${params.toString()}`, token),
  ) as Promise<Paginated<VoucherBatch>>
}

export async function createBatch(payload: CreateBatchPayload) {
  return withToken((token) =>
    api.post(endpoint.staff.voucherBatches, payload, token),
  ) as Promise<VoucherBatch>
}

/**
 * Altera o lote — na prática, o status. Ativar é o passo que liga o evento: em
 * rascunho nenhum código resgata, por mais que já esteja impresso.
 */
export async function updateBatch(id: string, payload: Partial<CreateBatchPayload> & { status?: VoucherBatchStatus }) {
  return withToken((token) =>
    api.patch(endpoint.staff.voucherBatch(id), payload, token),
  ) as Promise<VoucherBatch>
}

export async function getBatchReport(id: string) {
  return withToken((token) =>
    api.get(endpoint.staff.voucherBatchReport(id), token),
  ) as Promise<VoucherBatchReport>
}

export async function generateVouchers(id: string, quantity: number) {
  return withToken((token) =>
    api.post(endpoint.staff.voucherBatchGenerate(id), { quantity }, token),
  ) as Promise<{ created: number; total: number }>
}

export async function expireBatch(id: string) {
  return withToken((token) =>
    api.post(endpoint.staff.voucherBatchExpire(id), {}, token),
  ) as Promise<VoucherBatch>
}

export async function listVouchers(
  batchId: string,
  page = 1,
  filters: { status?: string; search?: string } = {},
) {
  const params = new URLSearchParams({ page: String(page) })
  if (filters.status) params.set('status', filters.status)
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  return withToken((token) =>
    api.get(`${endpoint.staff.voucherBatchVouchers(batchId)}?${params.toString()}`, token),
  ) as Promise<Paginated<Voucher>>
}

export async function cancelVoucher(id: string, reason: string) {
  return withToken((token) =>
    api.post(endpoint.staff.voucherCancel(id), { reason }, token),
  ) as Promise<Voucher>
}

export async function reissueVoucher(id: string, reason: string) {
  return withToken((token) =>
    api.post(endpoint.staff.voucherReissue(id), { reason }, token),
  ) as Promise<Voucher>
}

export async function listVoucherEvents(id: string) {
  return withToken((token) =>
    api.get(endpoint.staff.voucherEvents(id), token),
  ) as Promise<VoucherEvent[]>
}

/**
 * Baixa o PDF de impressão do lote inteiro — um arquivo só, já imposto para a gráfica.
 * Vai como blob porque a resposta é binária, não JSON.
 */
export async function downloadBatchPdf(id: string, duplex: 'long-edge' | 'short-edge' = 'long-edge') {
  return withToken((token) =>
    api.postBlob(endpoint.staff.voucherBatchPdf(id), { duplex }, token),
  ) as Promise<Blob>
}
