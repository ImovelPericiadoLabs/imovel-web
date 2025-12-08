// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // Se NÃO estiver autenticado, não fazemos nada aqui (não redirecionamos).
  // Apenas deixamos o fluxo seguir para a página, onde o Layout vai barrar a renderização.

  return NextResponse.next()
}

export const config = {
  matcher: ['/consultar-imovel/:path*', '/outra-rota-protegida/:path*'],
}