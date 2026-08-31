import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'
import { requestReauth } from '@/utils/auth-reauth'

export type SemaphoreStatus = 'green' | 'yellow' | 'red' | 'blue' | 'gray'
export type AnalisisStatus = {
  value: SemaphoreStatus
  label: string
}

export type GenericStatus = {
  value: string
  label: string
}

export type OrderAnalysisResult = {
  id: string
  title: string
  status: AnalisisStatus
  reason: string
}

export type OrderCertificateResult = OrderAnalysisResult & {
  kind_label?: string
  subject?: string
  tax_id?: string
  summary?: string
  footnote?: string
}

export type PlanFeature = {
  slug: string
  name: string
  description?: string
}

export type Plan = {
  id?: string
  slug?: string
  name?: string
  description?: string
  price?: number
  price_with_certificates?: number
  features?: PlanFeature[]
}

/** Objeto de endereço usado na análise e no re-request (GET/POST). CEP 8 dígitos quando enviado. */
export type PlaceResponse = {
  formatted_address?: string
  street_number?: string
  address_has_number?: boolean
  route?: string
  neighborhood?: string
  sublocality?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
}

export type OrderAnalysisProgress = {
  step?: string
  label?: string
  agent_title?: string
  agent_slug?: string
  updated_at?: string
}

export type Order = {
  id: string
  code: number
  status: GenericStatus
  analysis_progress?: OrderAnalysisProgress | null
  /** Confirmado = pagamento ou créditos já cobertos; útil quando ``status`` analítico ainda é PENDING (re-solicitação / fila). */
  payment_status?: GenericStatus
  gateway?: string
  billing_type?: string
  amount: string
  documents: Document[]
  place_id: string
  formatted_address: string | null
  display_address_secondary?: string | null
  complement: string | null
  legal_description?: string | null
  registration_number?: string | null
  lot_name?: string | null
  block_number?: string | null
  lot_number?: string | null
  created: string
  modified: string
  can_rerequest?: boolean
  notary_question?: string | null
  can_reply_notary?: boolean
  document_response?: {
    status?: string
    onr_protocol?: string
    return_reason?: string
    latest_notary_message?: string
  }
  /** Endereço usado na análise; preencher re-solicitação e permitir edição. */
  place_response?: PlaceResponse | null

  owners?: OwnersDetails[]
  semaphore?: SemaphoreStatus
  analysis?: OrderAnalysisResult[]
  /** Certidões oficiais emitidas (layout compacto na visualização). */
  certificates?: OrderCertificateResult[]
}

export type OwnerType =
  | 'proprietario_pleno'
  | 'nua_propriedade'
  | 'usufrutuario'
  | 'outro_titular_nao_proprietario'

export type OwnersDetails = {
  id: string
  name: string
  tax_id: string | null
  undivided_interest: number | null
  owner_type?: OwnerType | string | null
  group_id?: string | null
  group_label?: string | null
}

export type AnalysisStatusDetail = {
  value: string
  label: string
}

export type Document = {
  id: string
  file_path: string
  /** Tipo do anexo: REGISTRATION | AGREEMENT | DEED | CERTIFICATE (Document.Type no backend). */
  type?: string
  file_hash: string | null
  original_name: string
  extension: string
}

export type AnalysisDocument = {
  id: string
  file_path: string
  file_hash: string | null
  original_name: string
  extension: string
}

export type OrderAnalysisDetail = {
  id: string
  title: string
  status: AnalysisStatusDetail
  reason: string
  documents: AnalysisDocument | null
}

export type OrderEvent = {
  id: string
  type: string
  payload: Record<string, unknown>
  source: string
  created_at: string
}

export type OrdersApiResponse = {
  meta: {
    total_items: number
    total_pages: number
    page: number
    limit: number
    has_next: boolean
    has_previous: boolean
  }
  links: {
    next: string | null
    previous: string | null
  }
  items: Order[]
}

async function guard<T>(callback: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  if (!token) {
    requestReauth()
    throw new Error(
      'Não foi possível obter a sessão. Verifique sua conexão ou entre novamente.',
    )
  }

  try {
    return await callback(token)
  } catch (error: unknown) {
    const err = error as { status?: number }
    if (err?.status === 401) {
      requestReauth()
    }
    throw error
  }
}

export type ListOrdersRequest = {
  limit?: number
  p?: number
  status?: string
}

export async function listOrders(params: ListOrdersRequest = {}) {
  return guard(async (token) => {
    const { limit = 20, p = 1, status } = params

    const queryParams = new URLSearchParams({
      limit: String(limit),
      p: String(p),
    })

    if (status) {
      queryParams.append('status', status)
    }

    const url = `${endpoint.orders}?${queryParams.toString()}`

    return api.get(url, token) as Promise<OrdersApiResponse>
  })
}

/** Query key da listagem de consultas (infinite query). Centralizado p/ invalidação após pagamento/re-solicitação. */
export const ordersListQueryKey = ['orders'] as const

/** Query key para React Query: uso compartilhado entre OrderHeader, OrderOptionsPage, etc. */
export const orderQueryKey = (orderId: string) => ['order', orderId] as const

export const orderEventsQueryKey = (orderId: string) =>
  ['order-events', orderId] as const

export async function getOrder(orderId: string) {
  return guard(async (token) => {
    const baseUrl = endpoint.orders.replace(/\/$/, '')
    const url = `${baseUrl}/${orderId}/`

    return api.get(url, token) as Promise<Order>
  })
}

/** GET /orders/:id/events/ — pipeline activity (append-only). */
export async function getOrderEvents(orderId: string) {
  return guard(async (token) => {
    const base = endpoint.orders.replace(/\/$/, '')
    const url = `${base}/${orderId}/events/`
    return api.get(url, token) as Promise<OrderEvent[]>
  })
}

export async function getOrderAnalysisDetail(
  orderId: string,
  analysisId: string,
) {
  return guard(async (token) => {
    const url = `${endpoint.orders}${orderId}/analysis/${analysisId}/`
    return api.get(url, token) as Promise<OrderAnalysisDetail>
  })
}

/**
 * Retorna o PDF do relatório de análise (GET /analysis/pdfview/:orderId).
 * Use para download com nome "Consulta #{order.code}.pdf".
 */
export async function getAnalysisPdfBlob(orderId: string): Promise<Blob> {
  return guard(async (token) => {
    return api.getBlob(endpoint.analysisPdfView(orderId), token)
  })
}

/**
 * Retorna o blob de um documento do pedido (file_path pode ser URL absoluta ou path).
 * Use para download com nome correto (incluindo .pdf) e evitar arquivo sem extensão.
 */
export async function getDocumentBlob(filePath: string): Promise<Blob> {
  return guard(async (token) => {
    return api.getBlob(filePath, token)
  })
}

export type OrderRelatedDocumentKind = 'REGISTRATION' | 'CERTIFICATE' | 'REPORT'

/**
 * Documento relacionado ao pedido, derivado do detalhe (`order.documents` inline) e do
 * laudo gerado. O backend NÃO expõe /orders/:id/documents — ver toOrderRelatedDocuments.
 */
export type OrderRelatedDocument = {
  id: string
  kind: OrderRelatedDocumentKind
  label: string
  original_name: string
  extension: string
  /** URL absoluta (GCS) para download direto; null quando o arquivo só tem path relativo. */
  download_url: string | null
  /** Caminho do arquivo do anexo (absoluto ou relativo); usado no download via getDocumentBlob. */
  file_path: string | null
  file_hash: string | null
}

export const orderOwnersQueryKey = (orderId: string) =>
  ['order-owners', orderId] as const

export const orderAnalysesQueryKey = (orderId: string) =>
  ['order-analyses', orderId] as const

export const orderDocumentsQueryKey = (orderId: string) =>
  ['order-documents', orderId] as const

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  REGISTRATION: 'Matrícula',
  CERTIFICATE: 'Certidão',
  AGREEMENT: 'Contrato de compra e venda',
  DEED: 'Escritura',
}

const DOCUMENT_TYPE_KIND: Record<string, OrderRelatedDocumentKind> = {
  REGISTRATION: 'REGISTRATION',
  CERTIFICATE: 'CERTIFICATE',
}

/**
 * Deriva a lista da aba "Documentos" a partir do detalhe do pedido (GET /orders/:id/),
 * já que o backend não expõe /orders/:id/documents:
 *  - `order.documents` (anexos: matrícula, certidões anexas, contrato, escritura);
 *  - o laudo (REPORT) é sintetizado quando a consulta está FINISHED, pois é gerado sob
 *    demanda via GET /analysis/pdfview/:id (não é um anexo).
 */
export function toOrderRelatedDocuments(
  order: Order | undefined,
): OrderRelatedDocument[] {
  if (!order) return []

  const items: OrderRelatedDocument[] = (order.documents ?? []).map((doc) => ({
    id: doc.id,
    kind: DOCUMENT_TYPE_KIND[doc.type ?? ''] ?? 'REGISTRATION',
    label: DOCUMENT_TYPE_LABEL[doc.type ?? ''] ?? (doc.original_name || 'Documento'),
    original_name: doc.original_name,
    extension: doc.extension,
    // Sempre pelo backend (mesma origem, sem CORS): a URL direta do GCS depende de
    // CORS configurado no bucket para o fetch via JS funcionar, e o nome do objeto
    // no bucket pode estar sem extensão em documentos antigos — o proxy sempre
    // devolve o Content-Disposition com a extensão correta (ver DocumentDownloadView).
    download_url: null,
    file_path: endpoint.documents.download(doc.id),
    file_hash: doc.file_hash,
  }))

  if (order.status?.value === 'FINISHED') {
    items.push({
      id: `report-${order.id}`,
      kind: 'REPORT',
      label: 'Relatório de análise (PDF)',
      original_name: `Consulta #${order.code}.pdf`,
      extension: 'pdf',
      download_url: null,
      file_path: null,
      file_hash: null,
    })
  }

  return items
}

export type ReRequestOrderBody = {
  /** Se enviado, backend usa este objeto (não chama API de endereço). CEP validado 8 dígitos. */
  place_response?: PlaceResponse
  /** Opcional se place_response enviado; usado quando usuário escolhe outro endereço no autocomplete. */
  place_id?: string
  notary?: string
  lot_number?: string
  block_number?: string
  lot_name?: string
  tower?: string
}

/**
 * Re-solicitar pedido. POST /orders/:orderId/re-request/
 * 200: retorna o pedido atualizado.
 * 400: api client lança ApiError (error.code, error.message).
 */
export async function rerequestOrder(
  orderId: string,
  body: ReRequestOrderBody = {}
): Promise<Order> {
  return guard(async (token) => {
    const url = endpoint.reRequest(orderId)
    return api.post(url, body, token) as Promise<Order>
  })
}

export async function replyNotaryQuestion(
  orderId: string,
  message: string
): Promise<{ detail: string; queued?: boolean }> {
  return guard(async (token) => {
    const url = endpoint.notaryReply(orderId)
    return api.post(url, { message }, token) as Promise<{
      detail: string
      queued?: boolean
    }>
  })
}

export async function listPlans() {
  return guard(async (token) => {
    const response = (await api.get(endpoint.plans, token)) as unknown
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'plans' in response) {
      const plans = (response as { plans?: unknown }).plans
      return Array.isArray(plans) ? plans : []
    }
    return []
  })
}

/** GET /plans/ sem autenticação (mesmo payload que `listPlans` autenticado). */
export async function listPlansPublic(): Promise<Plan[]> {
  try {
    const response = (await api.get(endpoint.plans)) as unknown
    if (Array.isArray(response)) {
      return response as Plan[]
    }
    if (response && typeof response === 'object' && 'plans' in response) {
      const plans = (response as { plans?: unknown }).plans
      return Array.isArray(plans) ? (plans as Plan[]) : []
    }
    return []
  } catch {
    return []
  }
}
