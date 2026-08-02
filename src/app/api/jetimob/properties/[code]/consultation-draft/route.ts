import { NextResponse, type NextRequest } from 'next/server'

import { jetimobApiFetch } from '../../_lib/session'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { code } = await context.params
  const path = `/integrations/jetimob/properties/${encodeURIComponent(code)}/consultation-draft/`
  const { status, body } = await jetimobApiFetch(req, path)
  return NextResponse.json(body, { status })
}
