import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirect para compatibilidade com template do Meta (variável no final da URL).
 * Meta exige: https://www.imovelpericiado.com/consultas/opcoes/{{1}}
 * Redireciona para: /consultas/[id]/opcoes
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const match = pathname.match(/^\/consultas\/opcoes\/([^/]+)\/?$/)
  if (match) {
    const id = match[1]
    const url = request.nextUrl.clone()
    url.pathname = `/consultas/${id}/opcoes`
    return NextResponse.redirect(url, 307)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/consultas/opcoes/:id',
}
