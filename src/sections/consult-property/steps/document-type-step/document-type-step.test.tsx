import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentTypeStep } from './document-type-step'

type TextTitleProps = {
  children: React.ReactNode
}

type TextSubtitleProps = {
  children: React.ReactNode
}

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => <h1 data-testid="text-title">{children}</h1>,
}))

vi.mock('@/components/text-subtitle', () => ({
  __esModule: true,
  default: ({ children }: TextSubtitleProps) => <h2 data-testid="text-subtitle">{children}</h2>,
}))

describe('DocumentTypeStep', () => {
  it('should render TextTitle with correct text', () => {
    render(<DocumentTypeStep />)
    const title = screen.getByTestId('text-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Qual documento você tem?')
  })

  it('should render TextSubtitle with correct text', () => {
    render(<DocumentTypeStep />)
    const subtitle = screen.getByTestId('text-subtitle')
    expect(subtitle).toBeInTheDocument()
    expect(subtitle).toHaveTextContent('Selecione uma das opções abaixo')
  })

  it('should render container elements with correct structure', () => {
    const { container } = render(<DocumentTypeStep />)

    const allDivs = container.querySelectorAll('div')
    expect(allDivs.length).toBeGreaterThanOrEqual(2)

    const outerDiv = allDivs[0]
    const innerDiv = allDivs[1]

    expect(outerDiv.className).toContain('flex')
    expect(outerDiv.className).toContain('flex-col')
    expect(outerDiv.className).toContain('gap-5')

    expect(innerDiv.className).toContain('flex')
    expect(innerDiv.className).toContain('flex-col')
    expect(innerDiv.className).toContain('gap-2')
  })
})
