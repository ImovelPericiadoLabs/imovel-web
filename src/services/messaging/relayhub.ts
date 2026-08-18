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

export type RelayHubConnectionStatus = 'pending' | 'connected' | 'disconnected' | 'error'

export type RelayHubConnection = {
  id: string
  instance_name: string
  integration: string
  status: RelayHubConnectionStatus
  environment: string
  phone_number_e164: string | null
  relayhub_account_id: string
  inbox_id: string | null
  base_url: string
  webhook_url: string
  webhook_id: string | null
  has_token: boolean
  token_hint: string
  has_webhook_hmac: boolean
  hmac_hint: string
  qrcode_connected: boolean
  last_error: string
  last_webhook_at: string | null
  last_health_at: string | null
  last_health_ok: boolean
  created?: string
  modified?: string
  webhook_hmac_secret_once?: string
}

export type RelayHubMeta = {
  suggested_webhook_url: string
  relayhub_configured: boolean
  health: { ok?: boolean; error?: string; status?: string } | null
  can_manage: boolean
  can_test: boolean
}

export const RELAYHUB_STATUS_LABELS: Record<RelayHubConnectionStatus, string> = {
  pending: 'Pendente',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro',
}

export async function getRelayHubMeta(): Promise<RelayHubMeta> {
  return guard((token) => api.get(endpoint.messaging.relayhubMeta, token) as Promise<RelayHubMeta>)
}

export async function listRelayHubConnections(): Promise<{ results: RelayHubConnection[] }> {
  return guard(
    (token) =>
      api.get(endpoint.messaging.relayhubConnections, token) as Promise<{
        results: RelayHubConnection[]
      }>,
  )
}

export async function createRelayHubConnection(body: {
  instance_name: string
  display_name?: string
  webhook_url?: string
  environment?: string
}): Promise<RelayHubConnection> {
  return guard(
    (token) =>
      api.post(endpoint.messaging.relayhubConnections, body, token) as Promise<RelayHubConnection>,
  )
}

export async function getRelayHubConnection(id: string): Promise<RelayHubConnection> {
  return guard(
    (token) =>
      api.get(endpoint.messaging.relayhubConnection(id), token) as Promise<RelayHubConnection>,
  )
}

export async function deleteRelayHubConnection(id: string): Promise<void> {
  await guard(async (token) => {
    await api.delete(endpoint.messaging.relayhubConnection(id), token)
  })
}

export async function relayHubConnectionAction(
  id: string,
  action: 'test' | 'activate' | 'deactivate' | 'regenerate_webhook_secret' | 'refresh_state',
): Promise<Record<string, unknown>> {
  return guard(
    (token) =>
      api.post(endpoint.messaging.relayhubConnectionAction(id, action), {}, token) as Promise<
        Record<string, unknown>
      >,
  )
}

export async function getRelayHubQr(
  id: string,
): Promise<{ connection: RelayHubConnection; qr: string; code: string }> {
  return guard(
    (token) =>
      api.get(endpoint.messaging.relayhubConnectionQr(id), token) as Promise<{
        connection: RelayHubConnection
        qr: string
        code: string
      }>,
  )
}
