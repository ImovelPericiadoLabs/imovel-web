/**
 * BFF Jetimob — guarda apenas connection_id (UUID) em cookie httpOnly.
 * Tokens OAuth ficam no backend Django (apps.jetimob).
 */
import crypto from 'crypto'

import type { NextRequest, NextResponse } from 'next/server'

export const JM_COOKIE = 'jm_session'
const SESSION_TTL_SECONDS = 8 * 60 * 60

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.PARTNER_CONSOLE_SECRET || 'dev-only-insecure-secret'
  return crypto.createHash('sha256').update(secret).digest()
}

export function sealConnectionId(connectionId: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(connectionId, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, data]).toString('base64url')
}

export function unsealConnectionId(token: string | undefined): string | null {
  if (!token) return null
  try {
    const buf = Buffer.from(token, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    const out = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
    return out.trim() || null
  } catch {
    return null
  }
}

export function setJetimobSessionCookie(res: NextResponse, connectionId: string): void {
  res.cookies.set(JM_COOKIE, sealConnectionId(connectionId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearJetimobSessionCookie(res: NextResponse): void {
  res.cookies.set(JM_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function connectionIdFromRequest(req: NextRequest): string | null {
  return unsealConnectionId(req.cookies.get(JM_COOKIE)?.value)
}

export function apiV1Base(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1').replace(/\/$/, '')
}

export async function jetimobApiFetch(
  req: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  const connectionId = connectionIdFromRequest(req)
  if (!connectionId) {
    return { status: 401, body: { error: { code: 'not_connected', message: 'Sessão Jetimob ausente.' } } }
  }

  const headers = new Headers(init.headers)
  headers.set('X-Jetimob-Connection', connectionId)

  let res: Response
  try {
    res = await fetch(`${apiV1Base()}${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    return { status: 502, body: { error: { code: 'upstream_unreachable', message: 'API indisponível.' } } }
  }

  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}
