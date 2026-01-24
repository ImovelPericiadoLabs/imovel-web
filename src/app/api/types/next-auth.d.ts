import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * O que é retornado no hook useSession, getSession e na props da sessão
   */
  interface Session {
    accessToken: string
    refreshToken: string
    accessTokenExpires?: number
    user: {
      id: string
    } & DefaultSession["user"]
  }

  /**
   * O formato do objeto User retornado no provider 'authorize'
   */
  interface User {
    accessToken: string
    refreshToken: string
    id: string
  }
}

declare module "next-auth/jwt" {
  /**
   * O que é retornado no callback JWT
   */
  interface JWT {
    accessToken: string
    refreshToken: string
    id: string
    accessTokenExpires?: number
    error?: string
  }
}