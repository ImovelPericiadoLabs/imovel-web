import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) {
    throw new Error('Sessão não encontrada. Entre novamente.')
  }
  return fn(token)
}

export type ManualReviewSlice = {
  deadline?: string
  validation_messages?: string[]
  source?: string
}

export type ExternalRetrySlice = {
  attempts?: number
  next_retry_at?: string
  last_code?: number
  last_error?: string[]
  requested_by_staff_id?: string
}

export type StaffManualReviewOrderListItem = {
  id: string
  code: number
  status: string
  created: string
  modified: string
  registration_number: string | null
  manual_review_deadline: string | null
  formatted_address: string | null
  customer_email: string | null
  organization_name: string | null
  amount: string
  manual_review: ManualReviewSlice | null
  review_source: string
  external_retry: ExternalRetrySlice | null
  cost_total: string
  cost_limit: string
}

export type ManualReviewCostSummary = {
  amount_paid: string
  cost_total: string
  cost_limit: string
  guard_pct: number
  used_pct: number
  projected_profit: string
  records: number
  by_integration: { integration: string; cost: string }[]
}

export type ManualReviewTimelineEntry = {
  from: string
  to: string
  source: string
  at: string
}

export type StaffManualReviewOrderDetail = StaffManualReviewOrderListItem & {
  customer_whatsapp: string
  document_response: Record<string, unknown> | null
  place_response: Record<string, unknown> | null
  notary: string | null
  gateway: string
  payment_status: string
  payment_confirmed_at: string | null
  include_certificates: boolean
  has_registration_document: boolean
  cost_summary: ManualReviewCostSummary
  timeline: ManualReviewTimelineEntry[]
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listManualReviewOrders(
  page = 1,
  source?: string,
): Promise<Paginated<StaffManualReviewOrderListItem>> {
  const params = new URLSearchParams({ page: String(page) })
  if (source) params.set('source', source)
  return withToken((token) =>
    api.get(`${endpoint.staff.manualReviewOrders}?${params.toString()}`, token),
  ) as Promise<Paginated<StaffManualReviewOrderListItem>>
}

export async function getManualReviewOrder(id: string): Promise<StaffManualReviewOrderDetail> {
  return withToken((token) =>
    api.get(endpoint.staff.manualReviewOrder(id), token),
  ) as Promise<StaffManualReviewOrderDetail>
}

export async function uploadManualReviewRegistration(orderId: string, file: File): Promise<unknown> {
  return withToken((token) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(endpoint.staff.manualReviewUpload(orderId), fd, token)
  })
}

export async function enqueueManualReviewAnalysis(orderId: string): Promise<{ detail: string }> {
  return withToken((token) =>
    api.post(endpoint.staff.manualReviewEnqueue(orderId), {}, token),
  ) as Promise<{ detail: string }>
}

export type ResolveManualReviewBody = {
  action: 'enqueue_analysis' | 'reject' | 'retry_search'
  reason_code?: 'invalid_data' | 'registration_not_found' | 'other'
  notes?: string
}

export async function resolveManualReview(
  orderId: string,
  body: ResolveManualReviewBody,
): Promise<{ detail: string; return_reason?: string }> {
  return withToken((token) => api.post(endpoint.staff.manualReviewResolve(orderId), body, token)) as Promise<{
    detail: string
    return_reason?: string
  }>
}
