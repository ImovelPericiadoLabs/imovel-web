import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    secret: process.env.NEXTAUTH_SECRET, 

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
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}