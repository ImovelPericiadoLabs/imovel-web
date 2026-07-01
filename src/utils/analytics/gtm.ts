export type GtmEventPayload = {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer?: GtmEventPayload[]
    currentFlowStep?: string
  }
}

export const DEFAULT_CURRENCY = 'BRL'
export const CONSULT_PRODUCT_ID = 'consulta-imovel'
export const CONSULT_PRODUCT_NAME = 'Consulta Completa'
export const CONSULT_PRODUCT_PRICE = 79
export const CONSULT_PRICE_WITH_CERTIFICATES = 84.99
export const CERTIFICATES_UPSELL_PRICE = 5.99

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

export type PurchaseParams = {
  value?: number
  currency?: string
  transactionId?: string
  paymentMethod?: string
  eventDescription?: string
}

/** Push a GA4-standard `purchase` event (nested `ecommerce` so GTM/Meta Pixel read `value`/`currency`). */
export function trackPurchase(params: PurchaseParams = {}) {
  const value = typeof params.value === 'number' ? params.value : CONSULT_PRODUCT_PRICE
  const currency = params.currency ?? DEFAULT_CURRENCY
  const items = [buildConsultItem(value)]
  // GA4: reset the ecommerce object so values never merge across consecutive pushes.
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ ecommerce: null } as unknown as GtmEventPayload)
  }
  pushGtmEvent({
    event: 'purchase',
    event_category: 'payment',
    event_label: 'purchase',
    event_description: params.eventDescription,
    payment_method: params.paymentMethod,
    payment_id: params.transactionId,
    // Flat fields kept for legacy GTM variables.
    currency,
    value,
    items,
    // GA4 ecommerce object — the Meta Pixel/GA4 tags map value/currency from here.
    ecommerce: { transaction_id: params.transactionId, currency, value, items },
  })
}
