import { NextResponse, type NextRequest } from 'next/server'

import { apiV1Base, setJetimobSessionCookie } from '../_lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null)
  const code = String(data?.code || '').trim()

  if (!code) {
    return NextResponse.json(
      { error: { code: 'missing_code', message: 'Código OAuth ausente.' } },
      { status: 400 },
    )
  }

  let res: Response
  try {
    res = await fetch(`${apiV1Base()}/integrations/jetimob/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'upstream_unreachable', message: 'Não foi possível alcançar a API.' } },
      { status: 502 },
    )
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(body, { status: res.status })
  }

  const connectionId = String(body?.connection_id || '').trim()
  if (!connectionId) {
    return NextResponse.json(
      { error: { code: 'invalid_response', message: 'Resposta sem connection_id.' } },
      { status: 502 },
    )
  }

  const out = NextResponse.json(body)
  setJetimobSessionCookie(out, connectionId)
  return out
}
