import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthLayout from './layout'

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}))

describe('AuthLayout', () => {
  it('should render children wrapped in AppLayout', () => {
    render(
      <AuthLayout>
        <div data-testid="test-child">Child Content</div>
      </AuthLayout>
    )

    const appLayout = screen.getByTestId('app-layout')
    const child = screen.getByTestId('test-child')

    expect(appLayout).toBeVisible()
    expect(child).toBeVisible()
    expect(appLayout).toContainElement(child)
  })
})