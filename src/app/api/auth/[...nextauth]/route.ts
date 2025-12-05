import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyAuth } from "@/services/account"

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

        } catch (error: any) {
          console.error("Erro na autenticação:", error)
          const errorMessage = error?.response?.data?.detail || error.message || "Falha na verificação";
          throw new Error(errorMessage);
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
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }