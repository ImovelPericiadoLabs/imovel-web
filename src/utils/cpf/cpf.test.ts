import { describe, it, expect } from 'vitest'
import { isValidCPF } from './cpf'

describe('isValidCPF', () => {
  it('should return false when CPF length is not 11', () => {
    expect(isValidCPF('123')).toBe(false)
    expect(isValidCPF('123456789012')).toBe(false)
  })

  it('should return false for repeated digits', () => {
    expect(isValidCPF('00000000000')).toBe(false)
    expect(isValidCPF('11111111111')).toBe(false)
    expect(isValidCPF('99999999999')).toBe(false)
  })

  it('should clean non-numeric characters and validate correctly', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true)
  })

  it('should return true for a valid CPF', () => {
    expect(isValidCPF('52998224725')).toBe(true)
  })

  it('should return false when first verifier digit does not match', () => {
    const invalid = '52998224735'
    expect(isValidCPF(invalid)).toBe(false)
  })

  it('should return false when second verifier digit does not match', () => {
    const invalid = '52998224724'
    expect(isValidCPF(invalid)).toBe(false)
  })

  it('should return false for non-numeric formatted string cleaned to too few digits', () => {
    expect(isValidCPF('abc.def.ghi-jk')).toBe(false)
  })

  it('should return true when FIRST remainder is 10 (converted to 0)', () => {
    const cpf = '86136336502'
    expect(isValidCPF(cpf)).toBe(true)
  })

  it('should return false when FIRST remainder becomes 0 but digit mismatch', () => {
    const invalid = '86136336512'
    expect(isValidCPF(invalid)).toBe(false)
  })

  it('should return true when SECOND remainder is 10 (converted to 0)', () => {
    const cpf = '35512780590'
    expect(isValidCPF(cpf)).toBe(true)
  })

  it('should return false when SECOND remainder becomes 0 but digit mismatch', () => {
    const invalid = '35512780591'
    expect(isValidCPF(invalid)).toBe(false)
  })
})
