import { describe, expect, it } from 'vitest'
import {
  AUTH_CODE_TTL_SECONDS,
  resendCodeLabel,
  secondsUntilExpiry,
  validityLabel,
} from './auth-code-copy'

describe('auth-code-copy', () => {
  it('falls back to the full TTL when expiry is missing', () => {
    expect(secondsUntilExpiry()).toBe(AUTH_CODE_TTL_SECONDS)
    expect(secondsUntilExpiry('not-a-date')).toBe(AUTH_CODE_TTL_SECONDS)
  })

  it('labels remaining time in whole minutes', () => {
    expect(validityLabel(25 * 60)).toBe('Válido por 25 min')
    expect(validityLabel(1)).toBe('Válido por 1 min')
    expect(validityLabel(0)).toBe('Este código expirou. Peça um novo.')
  })

  it('changes the resend CTA after expiry', () => {
    expect(resendCodeLabel(120, false)).toBe('Reenviar o mesmo código')
    expect(resendCodeLabel(0, false)).toBe('Pedir um novo código')
    expect(resendCodeLabel(120, true)).toBe('Enviando...')
  })
})
