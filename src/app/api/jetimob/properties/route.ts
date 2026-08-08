import { NextResponse, type NextRequest } from 'next/server'

import { jetimobApiFetch } from '../_lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const qs = url.searchParams.toString()
  const path = qs ? `/integrations/jetimob/properties/?${qs}` : '/integrations/jetimob/properties/'
  const { status, body } = await jetimobApiFetch(req, path)
  return NextResponse.json(body, { status })
}
