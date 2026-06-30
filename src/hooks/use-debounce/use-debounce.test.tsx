import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDebounce from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 400))
    expect(result.current).toBe('test')
  })

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    expect(result.current).toBe('initial')

    vi.advanceTimersByTime(399)
    expect(result.current).toBe('initial')
  })

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current).toBe('updated')
  })

  it('should clear previous timeout on new value', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'new-value-1' })
    rerender({ value: 'new-value-2' })

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
