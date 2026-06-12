import {
  CONSULT_PRODUCT_PRICE,
  CONSULT_PRICE_WITH_CERTIFICATES,
} from '@/utils/analytics/gtm'

export type EntryPath = 'address' | 'document' | 'registry'

export function resolveConsultPrice(
  entryPath?: EntryPath,
  includeCertificates?: boolean,
): { price: number; includeCertificates: boolean } {
  if (entryPath === 'document' || entryPath === 'registry') {
    return { price: CONSULT_PRODUCT_PRICE, includeCertificates: true }
  }

  if (entryPath === 'address') {
    if (includeCertificates) {
      return { price: CONSULT_PRICE_WITH_CERTIFICATES, includeCertificates: true }
    }
    return { price: CONSULT_PRODUCT_PRICE, includeCertificates: false }
  }

  return {
    price: includeCertificates ? CONSULT_PRICE_WITH_CERTIFICATES : CONSULT_PRODUCT_PRICE,
    includeCertificates: Boolean(includeCertificates),
  }
}

export function useConsultPrice(entryPath?: EntryPath, includeCertificates?: boolean) {
  return resolveConsultPrice(entryPath, includeCertificates)
}
