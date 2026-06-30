import { NextResponse, type NextRequest } from 'next/server'

import { apiRoot, credsFromRequest, mintToken } from '../_lib/session'

export const runtime = 'nodejs'

/** Repassa o upload do logo (multipart, campo `file`) para a API, que re-encoda. */
export async function POST(req: NextRequest) {
  const creds = credsFromRequest(req)
  if (!creds) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const inForm = await req.formData().catch(() => null)
  const file = inForm?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie a imagem no campo 'file'." }, { status: 400 })
  }

  const minted = await mintToken(creds)
  if (!minted.ok) {
    return NextResponse.json({ error: minted.error }, { status: minted.status === 401 ? 401 : minted.status })
  }

  const out = new FormData()
  out.append('file', file, file.name || 'logo.png')

  let res: Response
  try {
    res = await fetch(`${apiRoot()}/v1/partner/integration/logo/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${minted.token}` },
      body: out,
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 })
  }
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}
