import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { forgetVoucherCode, readVoucherCode, rememberVoucherCode } from '@/utils/voucher-session'

describe('voucher-session', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('leva o código do /resgate até o checkout', () => {
    rememberVoucherCode('ABCD1234EFGH')
    expect(readVoucherCode()).toBe('ABCD1234EFGH')
  })

  it('sem código guardado devolve vazio, não indefinido', () => {
    // O checkout monta o payload com `readVoucherCode() ? ... : {}`; um undefined aqui
    // viraria `voucher_code: undefined` no JSON de alguns caminhos.
    expect(readVoucherCode()).toBe('')
  })

  it('esquece o código depois do resgate', () => {
    rememberVoucherCode('ABCD1234EFGH')
    forgetVoucherCode()
    expect(readVoucherCode()).toBe('')
  })

  it('não quebra quando o navegador recusa sessionStorage', () => {
    // Safari em aba privada lança em setItem. O fluxo tem que seguir pago, não morrer.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => rememberVoucherCode('ABCD1234EFGH')).not.toThrow()
  })

  it('não quebra quando a leitura falha', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(readVoucherCode()).toBe('')
  })
})
