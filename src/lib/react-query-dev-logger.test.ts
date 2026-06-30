import { describe, it, expect } from 'vitest'

import { isAggressivePollingInterval } from './react-query-dev-logger'

describe('react-query-dev-logger', () => {
  it('isAggressivePollingInterval flags sub-8s intervals', () => {
    expect(isAggressivePollingInterval(5_000)).toBe(true)
    expect(isAggressivePollingInterval(10_000)).toBe(false)
    expect(isAggressivePollingInterval(false)).toBe(false)
  })
})
