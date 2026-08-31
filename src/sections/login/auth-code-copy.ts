export const AUTH_CODE_TTL_SECONDS = 30 * 60

export function secondsUntilExpiry(expiresAt?: string | null): number {
  if (!expiresAt) return AUTH_CODE_TTL_SECONDS
  const ms = Date.parse(expiresAt) - Date.now()
  if (Number.isNaN(ms)) return AUTH_CODE_TTL_SECONDS
  return Math.max(0, Math.floor(ms / 1000))
}

export function validityLabel(seconds: number): string {
  if (seconds <= 0) return 'Este código expirou. Peça um novo.'
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `Válido por ${minutes} min`
}

export function resendCodeLabel(validSeconds: number, isResending: boolean): string {
  if (isResending) return 'Enviando...'
  return validSeconds <= 0 ? 'Pedir um novo código' : 'Reenviar o mesmo código'
}
