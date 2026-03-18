import { getSessionDeduplicated } from '@/utils/session'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

export type StartAuthRequest = {
  email: string
}

export type StartAuthResponse = {
  detail: string
}


export type VerifyAuthRequest = {
  email: string
  code: string
}

export type VerifyAuthResponse = {
  access: string
  refresh: string
}


export type RefreshTokenRequest = {
  refresh: string
}

export type RefreshTokenResponse = {
  access: string
  refresh?: string
}

/**
 * Passo 1: Envia o email para iniciar o processo.
 * Endpoint: /auth/start/
 */
export async function startAuth({ email }: StartAuthRequest) {
  const data = {
    email,
  }

  const result = (await api.post(endpoint.start, data)) as StartAuthResponse

  return result
}

/**
 * Passo 2: Envia o email e o código recebido para obter o token.
 * Endpoint: /auth/verify/
 */
export async function verifyAuth({ email, code }: VerifyAuthRequest) {
  const data = {
    email,
    code
  }

  const result = (await api.post(endpoint.verify, data)) as VerifyAuthResponse

  return result
}

/**
 * Passo 3: Atualiza o token de acesso usando o refresh token.
 * Endpoint: /auth/refresh/
 */
export async function refreshToken(token: string) {
  const data = {
    refresh: token,
  }

  const result = (await api.post(endpoint.refresh, data)) as RefreshTokenResponse

  return result
}

export type MeResponse = {
  email: string
  credits_balance: number
  whatsapp?: string
}

/**
 * Dados do usuário autenticado (saldo de créditos, email, etc.).
 * Endpoint: GET /me/
 */
export async function getMe(): Promise<MeResponse | null> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) return null
  const result = (await api.get(endpoint.me, token)) as MeResponse
  return result
}

export type RequestAccountDeletionRequest = {
  email: string
  reason?: string
}

export type RequestAccountDeletionResponse = {
  detail: string
  email?: string
}

function getLegalBackendBaseUrl() {
  const baseUrl = process.env.LEGAL_BACKEND_URL
    || process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '')
    || 'https://api.imovelpericiado.com'

  return baseUrl.replace(/\/$/, '')
}

export async function requestAccountDeletion({
  email,
  reason,
}: RequestAccountDeletionRequest): Promise<RequestAccountDeletionResponse> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  const response = await fetch(`${getLegalBackendBaseUrl()}/legal/exclusao-de-dados/callback/`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email,
      reason,
    }),
  })

  const payload = await response.json().catch(async () => ({
    detail: await response.text(),
  }))

  if (!response.ok) {
    throw new Error(
      typeof payload?.detail === 'string'
        ? payload.detail
        : 'Não foi possível processar a exclusão da conta.',
    )
  }

  return payload as RequestAccountDeletionResponse
}