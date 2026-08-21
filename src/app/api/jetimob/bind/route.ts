import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { jetimobApiFetch } from '../_lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const accessToken = session?.accessToken

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: 'not_authenticated', message: 'Entre na sua conta para vincular a conexão.' } },
      { status: 401 },
    )
  }

  const { status, body } = await jetimobApiFetch(req, '/integrations/jetimob/bind/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return NextResponse.json(body, { status })
}
