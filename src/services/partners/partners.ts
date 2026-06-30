import api from '@/utils/api/client'
import { endpoint, url } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'
import { requestReauth } from '@/utils/auth-reauth'

export type ConsentScope = {
  id: string
  description: string
}

export type ConsentPartner = {
  application: string | null
  organization: string | null
  organization_id: string | null
  website: string | null
  description: string | null
  logo_url: string | null
}

export type ConsentMetadata = {
  client_id: string
  partner: ConsentPartner
  redirect_uri: string
  state: string | null
  scopes: ConsentScope[]
  /** Cliente já autorizou este parceiro: a tela "reconecta" reusando a mesma conexão. */
  already_connected: boolean
  /** Escopos já concedidos (para destacar o que é novo na reconexão). */
  current_scopes: ConsentScope[]
  connected_since: string | null
}

export type ConsentDecision = {
  redirect_to?: string
  error?: string
  error_description?: string
}

export type ConnectedPartner = {
  id: string
  organization: string
  application: string
  website: string | null
  description: string | null
  logo_url: string | null
  scopes: ConsentScope[]
  granted_at: string
}

async function authToken(): Promise<string> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  if (!token) {
    requestReauth()
    throw new Error('Sessão expirada. Entre novamente para autorizar o parceiro.')
  }

  return token
}

/**
 * Valida a solicitação OAuth (client_id, redirect_uri, PKCE, scopes) e retorna os
 * metadados para a tela de consentimento. GET /partner/oauth/authorize/.
 */
export async function getConsentMetadata(rawQuery: string): Promise<ConsentMetadata> {
  const token = await authToken()

  const response = await fetch(`${url}${endpoint.partnerOAuthAuthorize}?${rawQuery}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!body || (!response.ok && typeof body.error_description !== 'string' && typeof body.error !== 'string')) {
    throw new Error('Solicitação de autorização inválida.')
  }

  if (!response.ok) {
    throw new Error(body.error_description || body.error || 'Solicitação de autorização inválida.')
  }

  return body as ConsentMetadata
}

/**
 * Emite (allow=true) ou nega (allow=false) o authorization code. POST /partner/oauth/authorize/.
 * Aprovação (200) e negação (400) retornam `redirect_to`; só erros fatais não retornam.
 */
export async function decideConsent(rawQuery: string, allow: boolean): Promise<ConsentDecision> {
  const token = await authToken()

  const response = await fetch(`${url}${endpoint.partnerOAuthAuthorize}?${rawQuery}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ allow }),
  })

  const body = (await response.json().catch(() => ({}))) as ConsentDecision

  if (body && typeof body.redirect_to === 'string') {
    return body
  }

  throw new Error(body?.error_description || body?.error || 'Não foi possível concluir a autorização.')
}

/** Lista os parceiros que o cliente final autorizou. GET /me/connected-partners/. */
export async function listConnectedPartners(): Promise<ConnectedPartner[]> {
  const token = await authToken()
  const result = (await api.get(endpoint.connectedPartners, token)) as { results: ConnectedPartner[] }
  return result.results ?? []
}

/** Revoga o acesso de um parceiro. DELETE /me/connected-partners/:id/. */
export async function revokeConnectedPartner(id: string): Promise<void> {
  const token = await authToken()
  await api.delete(endpoint.connectedPartner(id), token)
}
