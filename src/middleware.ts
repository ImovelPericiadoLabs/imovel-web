import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const publicPaths = ['/login', '/cadastro', '/esqueci-senha']
        const isPublicPath = publicPaths.includes(req.nextUrl.pathname)
        if (isPublicPath) {
          return true
        }
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  /*
   * MATCHER: O segredo para pegar TODAS as rotas.
   * A expressão regular abaixo diz: 
   * "Rode o middleware em tudo, EXCETO:"
   * - /api (rotas de API geralmente tratam auth internamente ou via header)
   * - /_next/static (arquivos estáticos do next)
   * - /_next/image (otimização de imagens)
   * - favicon.ico (ícone do site)
   * - public (pasta public se tiver imagens lá)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}