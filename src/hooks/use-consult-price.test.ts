import { describe, it, expect } from 'vitest'

import { resolveConsultPrice } from '@/hooks/use-consult-price'
import { CONSULT_PRODUCT_PRICE, CONSULT_PRICE_WITH_CERTIFICATES } from '@/utils/analytics/gtm'

describe('resolveConsultPrice', () => {
  it('document flow: certs included at base price', () => {
    expect(resolveConsultPrice('document', false)).toEqual({
      price: CONSULT_PRODUCT_PRICE,
      includeCertificates: true,
    })
  })

  it('registry flow: certs included at base price', () => {
    expect(resolveConsultPrice('registry', false)).toEqual({
      price: CONSULT_PRODUCT_PRICE,
      includeCertificates: true,
    })
  })

  it('address without certs', () => {
    expect(resolveConsultPrice('address', false)).toEqual({
      price: CONSULT_PRODUCT_PRICE,
      includeCertificates: false,
    })
  })

  it('address with certs', () => {
    expect(resolveConsultPrice('address', true)).toEqual({
      price: CONSULT_PRICE_WITH_CERTIFICATES,
      includeCertificates: true,
    })
  })
})
