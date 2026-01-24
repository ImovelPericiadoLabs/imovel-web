export type GtmEventPayload = {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer?: GtmEventPayload[]
  }
}

export const DEFAULT_CURRENCY = 'BRL'
export const CONSULT_PRODUCT_ID = 'consulta-imovel'
export const CONSULT_PRODUCT_NAME = 'Consulta Completa'
export const CONSULT_PRODUCT_PRICE = 59

export function buildConsultItem(value: number = CONSULT_PRODUCT_PRICE) {
  return {
    item_id: CONSULT_PRODUCT_ID,
    item_name: CONSULT_PRODUCT_NAME,
    item_category: 'consulta-imovel',
    price: value,
    quantity: 1,
  }
}

export function pushGtmEvent(payload: GtmEventPayload) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)
}

export function trackGtmEvent(event: string, params: Record<string, unknown> = {}) {
  pushGtmEvent({ event, ...params })
}
