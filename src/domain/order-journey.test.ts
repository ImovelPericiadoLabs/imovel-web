import { describe, it, expect } from 'vitest'

import {
  getOrderEventsRefetchIntervalMs,
  getOrderRefetchIntervalMs,
  getOrderTimelineRows,
  isOrderPaymentConfirmed,
  isOrderPipelineActive,
  isOrderTerminalStatus,
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
    expect(getOrderRefetchIntervalMs('IN_PROGRESS')).toBe(8_000)
  })

  it('getOrderRefetchIntervalMs polls slowly on manual review queue (auto-retry externo)', () => {
    expect(getOrderRefetchIntervalMs('MANUAL_REVIEW_PENDING')).toBe(300_000)
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

  it('isOrderPipelineActive is true only for transit pipeline states', () => {
    expect(isOrderPipelineActive('IN_PROGRESS')).toBe(true)
    expect(isOrderPipelineActive('SEARCHING_DOCUMENT')).toBe(true)
    expect(isOrderPipelineActive('FINISHED')).toBe(false)
    expect(isOrderPipelineActive('PENDING')).toBe(false)
  })

  it('isOrderTerminalStatus stops polling targets', () => {
    expect(isOrderTerminalStatus('FINISHED')).toBe(true)
    expect(isOrderTerminalStatus('CANCELED')).toBe(true)
    expect(isOrderTerminalStatus('MANUAL_REVIEW_PENDING')).toBe(false)
    expect(isOrderTerminalStatus('IN_PROGRESS')).toBe(false)
  })

  it('getOrderEventsRefetchIntervalMs polls only during active pipeline', () => {
    expect(getOrderEventsRefetchIntervalMs('IN_PROGRESS')).toBe(8_000)
    expect(getOrderEventsRefetchIntervalMs('FINISHED')).toBe(false)
    expect(getOrderEventsRefetchIntervalMs('PENDING')).toBe(false)
  })

  it('getOrderEventsRefetchIntervalMs slows on action-required terminals', () => {
    expect(getOrderEventsRefetchIntervalMs('REJECTED_DATA')).toBe(90_000)
    expect(getOrderEventsRefetchIntervalMs('RETURNED_BY_NOTARY')).toBe(90_000)
  })
})
