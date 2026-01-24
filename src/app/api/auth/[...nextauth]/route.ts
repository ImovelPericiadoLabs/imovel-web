import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { refreshToken, verifyAuth } from "@/services/account"

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 - 60 * 60
const ACCESS_TOKEN_SAFETY_WINDOW_SECONDS = 60

function getJwtExpiration(accessToken?: string) {
  if (!accessToken) return null
  const parts = accessToken.split('.')
  if (parts.length < 2) return null

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    return typeof decoded?.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          throw new Error("Email e código são obrigatórios.")
        }

        try {
          const response = await verifyAuth({
            email: credentials.email,
            code: credentials.code
          })

          if (response && response.access) {
            return {
              id: credentials.email,
              email: credentials.email,
              name: credentials.email,
              accessToken: response.access,
              refreshToken: response.refresh,
            }
          }
          throw new Error("Código inválido ou resposta inesperada.")

        } catch (error: unknown) {
          const err = error as { response?: { data?: { detail?: string } } }
          const errorMessage =
            err?.response?.data?.detail ||
            (error instanceof Error ? error.message : undefined) ||
            "Falha na verificação"
          throw new Error(errorMessage)
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.id = user.id
        const accessTokenExpires = getJwtExpiration(user.accessToken)
        if (accessTokenExpires) {
          token.accessTokenExpires = accessTokenExpires
        }
      }

      const accessTokenExpires = token.accessTokenExpires ?? getJwtExpiration(token.accessToken)
      const nowInSeconds = Math.floor(Date.now() / 1000)

      if (!accessTokenExpires) {
        return token
      }

      if (nowInSeconds < accessTokenExpires - ACCESS_TOKEN_SAFETY_WINDOW_SECONDS) {
        return token
      }

      if (!token.refreshToken) {
        return token
      }

      try {
        const refreshed = await refreshToken(token.refreshToken)
        token.accessToken = refreshed.access
        token.accessTokenExpires = getJwtExpiration(refreshed.access)

        if (refreshed.refresh) {
          token.refreshToken = refreshed.refresh
        }
      } catch {
        token.error = 'RefreshAccessTokenError'
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken

      if (session.user) {
        session.user.id = token.id
      }

      return session
    }
  },
  pages: {
    signIn: '/consultar-imovel', 
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }