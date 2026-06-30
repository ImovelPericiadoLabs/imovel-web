import { NextResponse, type NextRequest } from 'next/server'

import { apiRoot, mintToken, setSessionCookie } from '../_lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null)
  const clientId = String(data?.clientId || '').trim()
  const clientSecret = String(data?.clientSecret || '').trim()

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Informe o Client ID e o Client Secret.' },
      { status: 400 },
    )
  }

  const creds = { clientId, clientSecret }
  const minted = await mintToken(creds)
  if (!minted.ok) {
    const message =
      minted.error === 'invalid_client'
        ? 'Client ID ou Client Secret inválidos.'
        : minted.error === 'invalid_scope'
          ? 'Esta aplicação não tem a permissão integration:manage. Fale com a equipe Imóvel Periciado.'
          : 'Não foi possível autenticar. Tente novamente.'
    return NextResponse.json({ error: message }, { status: minted.status === 401 ? 401 : 400 })
  }

  // Contexto da organização (nome/escopos) para exibir no console.
  let context: unknown = null
  try {
    const ctxRes = await fetch(`${apiRoot()}/v1/partner/context/`, {
      headers: { Authorization: `Bearer ${minted.token}` },
      cache: 'no-store',
    })
    if (ctxRes.ok) context = await ctxRes.json()
  } catch {
    /* contexto é opcional */
  }

  const res = NextResponse.json({ ok: true, context })
  setSessionCookie(res, creds)
  return res
}
