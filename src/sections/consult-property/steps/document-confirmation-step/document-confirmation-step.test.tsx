import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentConfirmationStep } from './document-confirmation-step'

type TextTitleProps = {
  children: React.ReactNode
}

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => <h1 data-testid="text-title">{children}</h1>,
}))

describe('DocumentConfirmationStep', () => {
  it('should render TextTitle with correct text', () => {
    render(<DocumentConfirmationStep />)
    const title = screen.getByTestId('text-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Você tem o documento do imóvel?')
  })

  it('should render the container with correct structure', () => {
    const { container } = render(<DocumentConfirmationStep />)
    const div = container.querySelector('div')
    expect(div).toBeInTheDocument()
    expect(div?.className).toContain('flex')
    expect(div?.className).toContain('flex-col')
    expect(div?.className).toContain('gap-5')
  })
})
