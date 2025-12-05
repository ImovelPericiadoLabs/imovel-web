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
          console.log("1. Iniciando login para:", credentials.email);

          // ATENÇÃO: Se verifyAuth for onde você faz o fetch, o erro está lá dentro.
          // O ideal é ver qual URL ele está chamando.
          // Se possível, poste o código de 'src/services/account.ts' aqui.

          const response = await verifyAuth({
            email: credentials.email,
            code: credentials.code
          })

          console.log("2. Resposta do verifyAuth:", JSON.stringify(response));

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
          // Isso vai aparecer nos logs da Vercel (Function logs)
          console.error("ERRO CRÍTICO NO AUTHORIZE:", error);
          throw error;
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