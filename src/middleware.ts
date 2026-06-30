import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  const host = request.headers.get('host') ?? nextUrl.host

  // Canonicaliza domínio: www -> apex. A sessão (NextAuth) vive no apex, então acessar
  // por www quebrava login/consent ("mismatch"). 308 preserva método, path e query.
  if (host.startsWith('www.')) {
    const url = nextUrl.clone()
    url.protocol = 'https:'
    url.host = host.slice(4)
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  // Compat com template do Meta: /consultas/opcoes/{id} -> /consultas/{id}/opcoes
  const match = nextUrl.pathname.match(/^\/consultas\/opcoes\/([^/]+)\/?$/)
  if (match) {
    const url = nextUrl.clone()
    url.pathname = `/consultas/${match[1]}/opcoes`
    return NextResponse.redirect(url, 307)
  }

  return NextResponse.next()
}

export const config = {
  // Roda em todas as rotas de página (exclui /api, assets estáticos e internos do Next).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images/|.*\\..*).*)'],
}
