/**
 * Cliente para as rotas BFF `/api/jetimob/*` (que por sua vez repassam à API Django,
 * `apps.jetimob`). Mantém o padrão de sessão por cookie httpOnly já usado nessa
 * integração (ver `src/app/api/jetimob/_lib/session.ts`) — não passa pelo wrapper
 * `api` (Bearer/NextAuth) porque a sessão Jetimob é independente do login do usuário.
 */

export type JetimobPropertyRow = {
  code?: string
  title?: string
  address?: string
  photo?: string
  /** Campos abaixo alimentam os filtros avançados — best-effort (ver apps/jetimob/properties_normalize.py). */
  property_type?: string
  status?: string
  sale_price?: number | null
  rent_price?: number | null
  city?: string
  state?: string
  neighborhood?: string
  /** ISO 8601 quando a Jetimob informa; string vazia quando não veio no payload. */
  updated_at?: string
}

export type JetimobPropertiesPayload = {
  items?: JetimobPropertyRow[]
  total_items?: number
  pagination?: { page?: string | number; page_limit?: string | number; total_items?: number }
  error?: { message?: string }
}

export type FetchJetimobPropertiesParams = {
  page?: number
  search?: string
  pageLimit?: number
  signal?: AbortSignal
}

export class JetimobRequestError extends Error {}

export async function fetchJetimobProperties({
  page = 1,
  search = '',
  pageLimit,
  signal,
}: FetchJetimobPropertiesParams = {}): Promise<JetimobPropertiesPayload> {
  const params = new URLSearchParams({ page: String(page) })
  if (search.trim()) params.set('search', search.trim())
  if (pageLimit) params.set('page_limit', String(pageLimit))

  const res = await fetch(`/api/jetimob/properties?${params}`, { cache: 'no-store', signal })
  const body = (await res.json()) as JetimobPropertiesPayload

  if (!res.ok) {
    throw new JetimobRequestError(body?.error?.message || 'Não foi possível listar seus imóveis.')
  }

  return body
}
