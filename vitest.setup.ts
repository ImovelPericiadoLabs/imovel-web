import React from 'react'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom'

expect.extend(matchers)

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: vi.fn(() => ({ variable: '--font-plus-jakarta' })),
  Noto_Sans: vi.fn(() => ({ variable: '--font-noto-sans' })),
}))

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>()
  const cache = new Map<string, React.FC<Record<string, unknown>>>()

  const makeIcon = (name: string): React.FC<Record<string, unknown>> => {
    if (!cache.has(name)) {
      const Icon: React.FC<Record<string, unknown>> = ({ onClick, className, ...rest }) =>
        React.createElement('span', {
          'data-testid': `icon-${name}`,
          onClick,
          className,
          ...rest,
        })
      cache.set(name, Icon)
    }
    return cache.get(name)!
  }

  const mocked: Record<string, unknown> = { __esModule: true as const }

  for (const key of Object.keys(actual)) {
    if (key === 'default' || key === '__esModule') continue
    mocked[key] = makeIcon(key)
  }

  return new Proxy(mocked, {
    get(target, prop) {
      if (prop === '__esModule') return true
      if (typeof prop === 'symbol') return undefined
      const name = String(prop)
      if (name in target) return target[name]
      const icon = makeIcon(name)
      target[name] = icon
      return icon
    },
  })
})

afterEach(() => {
  cleanup()
})
