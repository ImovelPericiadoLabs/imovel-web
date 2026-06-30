/**
 * Cliente do Console de Integração de Parceiros.
 * Fala apenas com as rotas BFF do próprio Next (/api/partner-console/*); o token
 * OAuth vive no servidor (cookie httpOnly cifrado), nunca no browser.
 */

export type IntegrationConfig = {
  consent_client_id: string | null
  redirect_uris: string[]
  website: string | null
  description: string | null
  logo_url: string
}

export type PartnerContext = {
  organization_id?: string
  organization_name?: string
  scopes?: string[]
}

const BASE = '/api/partner-console'

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    const e = data?.error
    if (typeof e === 'string') return e
    if (e?.message) return String(e.message)
    if (data?.detail) return String(data.detail)
  } catch {
    /* ignore */
  }
  return 'Algo deu errado. Tente novamente.'
}

export async function pcLogin(
  clientId: string,
  clientSecret: string,
): Promise<{ context: PartnerContext | null }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = await res.json()
  return { context: data?.context ?? null }
}

export async function pcLogout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: 'POST' })
}

export async function pcGetIntegration(): Promise<{
  integration: IntegrationConfig
  context: PartnerContext | null
}> {
  const res = await fetch(`${BASE}/integration`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function pcPatchIntegration(
  payload: Partial<Pick<IntegrationConfig, 'redirect_uris' | 'website' | 'description' | 'logo_url'>>,
): Promise<IntegrationConfig> {
  const res = await fetch(`${BASE}/integration`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function pcUploadLogo(file: File): Promise<{ logo_url: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/logo`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
