import { describe, expect, it } from 'vitest'

import {
  batchPdfPayload,
  batchPdfQuery,
  DEFAULT_PRINT_CONFIG,
} from './voucher-print'

describe('batchPdfPayload', () => {
  it('envia duplex no layout clássico', () => {
    expect(batchPdfPayload({ ...DEFAULT_PRINT_CONFIG, duplex: 'short-edge' }, true)).toEqual({
      layout: 'duplex',
      duplex: 'short-edge',
      force: true,
    })
  })

  it('envia verso no layout empilhado', () => {
    expect(batchPdfPayload({
      layout: 'stacked', duplex: 'long-edge', verso: 'cut',
    })).toEqual({
      layout: 'stacked',
      verso: 'cut',
      force: false,
    })
  })
})

describe('batchPdfQuery', () => {
  it('não inclui force na query do GET', () => {
    expect(batchPdfQuery({ layout: 'stacked', duplex: 'long-edge', verso: 'fold' }))
      .toBe('layout=stacked&verso=fold')
  })
})
