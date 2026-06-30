import { NextResponse, type NextRequest } from 'next/server'

import { apiRoot, credsFromRequest, mintToken, partnerApiFetch } from '../_lib/session'

export const runtime = 'nodejs'

/** Carrega a configuração atual da integração + contexto da organização. */
export async function GET(req: NextRequest) {
  const creds = credsFromRequest(req)
  if (!creds) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const minted = await mintToken(creds)
  if (!minted.ok) {
    return NextResponse.json({ error: minted.error }, { status: minted.status === 401 ? 401 : minted.status })
  }
  const headers = { Authorization: `Bearer ${minted.token}` }
  const [integration, context] = await Promise.all([
    fetch(`${apiRoot()}/v1/partner/integration/`, { headers, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`${apiRoot()}/v1/partner/context/`, { headers, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ])
  if (integration === null) {
    return NextResponse.json({ error: 'integration_unavailable' }, { status: 502 })
  }
  return NextResponse.json({ integration, context })
}

/** Atualiza branding (website/description/logo_url) e/ou redirect_uris. */
export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const { status, body } = await partnerApiFetch(req, '/partner/integration/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return NextResponse.json(body, { status })
}
