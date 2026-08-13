import { NextResponse, type NextRequest } from 'next/server'

import { jetimobApiFetch } from '../_lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { status, body } = await jetimobApiFetch(req, '/integrations/jetimob/me/')
  return NextResponse.json(body, { status })
}
