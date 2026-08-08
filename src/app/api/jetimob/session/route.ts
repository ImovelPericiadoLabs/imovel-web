import { NextResponse, type NextRequest } from 'next/server'

import { clearJetimobSessionCookie, jetimobApiFetch } from '../_lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { status, body } = await jetimobApiFetch(req, '/integrations/jetimob/session/')
  return NextResponse.json(body, { status })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearJetimobSessionCookie(res)
  return res
}
