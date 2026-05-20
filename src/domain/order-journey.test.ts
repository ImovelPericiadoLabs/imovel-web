import { describe, it, expect } from 'vitest'

import {
  getOrderRefetchIntervalMs,
  getOrderTimelineRows,
  isOrderPaymentConfirmed,
  resolveOrderStatusUI,
} from './order-journey'

describe('order-journey', () => {
  it('resolveOrderStatusUI maps SEARCHING_DOCUMENT', () => {
    const ui = resolveOrderStatusUI('SEARCHING_DOCUMENT')
    expect(ui.step).toBe('search')
    expect(ui.expectation).toMatch(/72/)
  })

  it('getOrderRefetchIntervalMs stops on FINISHED', () => {
    expect(getOrderRefetchIntervalMs('FINISHED')).toBe(false)
  })

  it('getOrderRefetchIntervalMs polls while pipeline is active', () => {
    expect(getOrderRefetchIntervalMs('SEARCHING_DOCUMENT')).toBe(15_000)
    expect(getOrderRefetchIntervalMs('IN_PROGRESS')).toBe(10_000)
  })

  it('getOrderRefetchIntervalMs stops on manual review queue', () => {
    expect(getOrderRefetchIntervalMs('MANUAL_REVIEW_PENDING')).toBe(false)
  })

  it('getOrderRefetchIntervalMs stops on unknown status', () => {
    expect(getOrderRefetchIntervalMs(undefined)).toBe(false)
  })

  it('getOrderTimelineRows marks search as current when searching', () => {
    const rows = getOrderTimelineRows('SEARCHING_DOCUMENT')
    expect(rows[0]!.state).toBe('done')
    expect(rows[1]!.state).toBe('current')
    expect(rows[2]!.state).toBe('pending')
  })

  it('resolveOrderStatusUI for PENDING + payment confirmed avoids checkout copy', () => {
    const ui = resolveOrderStatusUI('PENDING', { paymentConfirmed: true })
    expect(ui.step).toBe('search')
    expect(ui.headline).toMatch(/Pagamento confirmado/)
  })

  it('getOrderTimelineRows for PENDING + payment confirmed marks payment done', () => {
    const rows = getOrderTimelineRows('PENDING', { paymentConfirmed: true })
    expect(rows[0]!.state).toBe('done')
    expect(rows[1]!.state).toBe('current')
  })

  it('getOrderRefetchIntervalMs polls for PENDING when payment confirmed', () => {
    expect(
      getOrderRefetchIntervalMs('PENDING', { paymentConfirmed: true }),
    ).toBe(15_000)
    expect(getOrderRefetchIntervalMs('PENDING', {})).toBe(45_000)
  })

  it('isOrderPaymentConfirmed reads CONFIRMED', () => {
    expect(isOrderPaymentConfirmed({ value: 'CONFIRMED' })).toBe(
      true,
    )
    expect(isOrderPaymentConfirmed(undefined)).toBe(false)
  })
})
