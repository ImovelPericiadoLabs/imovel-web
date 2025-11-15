import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PaymentStep } from './payment-step'

type TextTitleProps = {
  children: React.ReactNode
}

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => <h1 data-testid="text-title">{children}</h1>,
}))

describe('PaymentStep', () => {
  it('should render TextTitle with correct text', () => {
    render(<PaymentStep />)
    const title = screen.getByTestId('text-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Escolha como você quer pagar')
  })

  it('should render the container with correct structure', () => {
    const { container } = render(<PaymentStep />)
    const div = container.querySelector('div')
    expect(div).toBeInTheDocument()
    expect(div?.className).toContain('flex')
    expect(div?.className).toContain('flex-col')
    expect(div?.className).toContain('gap-5')
  })
})
