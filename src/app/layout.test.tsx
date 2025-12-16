import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RootLayout, { metadata } from './layout'

vi.mock('next/font/google', () => ({
  Noto_Sans: vi.fn(() => ({
    variable: '--font-noto-sans',
  })),
}))

describe('RootLayout', () => {
  it('should render children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeVisible()
  })

  it('should have correct title and description', () => {
    expect(metadata.title).toBe('Imóvel Periciado')
    expect(metadata.description).toBe('Imóvel Periciado')
  })
})
