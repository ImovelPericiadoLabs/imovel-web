/**
 * BFF do Console de Integração de Parceiros.
 *
 * O parceiro acessa com client_id/client_secret. As credenciais ficam SOMENTE no
 * servidor (Vercel), cifradas (AES-256-GCM) num cookie httpOnly — nunca chegam ao
 * JS do navegador. As rotas mintam um access_token OAuth (client_credentials, scope
 * integration:manage) a cada chamada e proxyam para a API B2B.
 */
import crypto from 'crypto'

import type { NextRequest, NextResponse } from 'next/server'

export const PC_COOKIE = 'pc_session'
const SESSION_TTL_SECONDS = 2 * 60 * 60 // 2h

export type PartnerCreds = { clientId: string; clientSecret: string }

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.PARTNER_CONSOLE_SECRET || 'dev-only-insecure-secret'
  return crypto.createHash('sha256').update(secret).digest()
}

/** Cifra as credenciais para o cookie (iv|tag|ciphertext em base64url). */
export function seal(creds: PartnerCreds): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(creds), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, data]).toString('base64url')
}

/** Decifra o cookie. Retorna null se ausente/adulterado. */
export function unseal(token: string | undefined): PartnerCreds | null {
  if (!token) return null
  try {
    const buf = Buffer.from(token, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    const out = Buffer.concat([decipher.update(data), decipher.final()])
    const parsed = JSON.parse(out.toString('utf8'))
    if (parsed && typeof parsed.clientId === 'string' && typeof parsed.clientSecret === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function setSessionCookie(res: NextResponse, creds: PartnerCreds): void {
  res.cookies.set(PC_COOKIE, seal(creds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(PC_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export function credsFromRequest(req: NextRequest): PartnerCreds | null {
  return unseal(req.cookies.get(PC_COOKIE)?.value)
}

/** Raiz da API sem o sufixo /v1 (o token vive em /o/token/, fora do /v1). */
export function apiRoot(): string {
  const base = process.env.PARTNER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.imovelpericiado.com/v1'
  return base.replace(/\/v1\/?$/, '').replace(/\/$/, '')
}

export type MintResult =
  | { ok: true; token: string }
  | { ok: false; status: number; error: string }

/** Troca client_id/secret por um access_token com scope integration:manage. */
export async function mintToken(creds: PartnerCreds): Promise<MintResult> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: 'integration:manage',
  })
  let res: Response
  try {
    res = await fetch(`${apiRoot()}/o/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 502, error: 'Não foi possível alcançar a API.' }
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.access_token) {
    const code = json?.error || (res.status === 401 ? 'invalid_client' : 'token_error')
    return { ok: false, status: res.status || 400, error: String(code) }
  }
  return { ok: true, token: json.access_token as string }
}

/** Mint a partir do cookie + chamada autenticada à API B2B (relativa ao /v1). */
export async function partnerApiFetch(
  req: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  const creds = credsFromRequest(req)
  if (!creds) return { status: 401, body: { error: 'not_authenticated' } }
  const minted = await mintToken(creds)
  if (!minted.ok) return { status: minted.status === 401 ? 401 : minted.status, body: { error: minted.error } }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${minted.token}`)
  let res: Response
  try {
    res = await fetch(`${apiRoot()}/v1${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    return { status: 502, body: { error: 'upstream_unreachable' } }
  }
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}
