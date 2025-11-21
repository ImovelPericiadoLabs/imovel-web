import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentStep } from './payment-step'

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1 data-testid="text-title">{children}</h1>,
}))

vi.mock('@/components/option-card/option-card.tsx', () => ({
  default: () => <div data-testid="option-card">Option Card</div>,
}))

vi.mock('@/components/switch', () => ({
  Switch: () => <div data-testid="switch">Switch</div>,
}))

const mockSetValue = vi.fn()
const mockWatch = vi.fn()
const mockOnNextStep = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: mockSetValue,
    watch: mockWatch,
  }),
}))

describe('PaymentStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWatch.mockReturnValue(false)
  })

  it('should render TextTitle with correct text', () => {
    render(<PaymentStep onNextStep={mockOnNextStep} />)
    
    const title = screen.getByTestId('text-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Escolha como pagar')
  })

  it('should render the container with correct structure', () => {
    const { container } = render(<PaymentStep onNextStep={mockOnNextStep} />)
    
    const wrapper = container.firstChild as HTMLElement
    
    expect(wrapper).toHaveClass('relative', 'flex-1', 'px-4')
    
    const contentDiv = wrapper.querySelector('.flex.flex-col')
    expect(contentDiv).toHaveClass('gap-5')
  })
})