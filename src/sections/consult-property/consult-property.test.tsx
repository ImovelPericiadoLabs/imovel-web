import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ConsultProperty from './consult-property'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: (schema: any) => schema,
}))

vi.mock('@/components/progress-bar', () => ({
  default: ({ value }: { value: number }) => <div data-testid="progress-bar" data-value={value} />,
}))

vi.mock('lucide-react', () => ({
  ChevronLeft: ({ onClick, className, ...props }: any) => (
    <div
      data-testid="chevron-left"
      onClick={onClick}
      className={className}
      {...props}
    />
  ),
  Menu: (props: any) => <div data-testid="menu" {...props} />,
  CircleQuestionMark: (props: any) => (
    <div data-testid="circle-question-mark" {...props} />
  ),
}))

vi.mock('@/sections/consult-property/components/traffic-light-modal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock(
  '@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step',
  () => ({
    PaymentConfirmationStep: () => (
      <div data-testid="payment-confirmation-step">Payment Confirmation</div>
    ),
  }),
)

vi.mock('@/sections/consult-property/steps/payment-step/card/select', () => ({
  SavedCardsPage: () => <div data-testid="saved-cards-page">Saved Cards</div>
}))

vi.mock('@/sections/consult-property/steps/payment-step/card/register', () => ({
  CreditCardPage: () => <div data-testid="credit-card-page">Credit Card Register</div>
}))

vi.mock('@/sections/consult-property/steps', () => {
  return {
    AddressStep: ({ onNext }: { onNext: () => void }) => (
      <div data-testid="address-step">
        <button onClick={onNext}>Next Address</button>
      </div>
    ),
    DocumentConfirmationStep: ({ onNext }: { onNext: () => void }) => (
      <div data-testid="document-confirmation-step">
        <button onClick={onNext}>Next DocConfirm</button>
      </div>
    ),
    DocumentTypeStep: ({ onNext }: { onNext: () => void }) => (
      <div data-testid="document-type-step">
        <button onClick={onNext}>Next DocType</button>
      </div>
    ),
    SendDocumentStep: ({ onNext }: { onNext: () => void }) => (
      <div data-testid="send-document-step">
        <button onClick={onNext}>Next SendDoc</button>
      </div>
    ),
    SummaryStep: ({ onNext }: { onNext: () => void }) => (
      <div data-testid="summary-step">
        <button onClick={onNext}>Next Summary</button>
      </div>
    ),
  }
})

describe('ConsultProperty Flow', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
    render(<ConsultProperty />)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render ONLY the first step initially', () => {
    const addressStep = screen.getByTestId('address-step')
    const docConfirmStep = screen.getByTestId('document-confirmation-step')

    expect(addressStep).toBeVisible()
    expect(docConfirmStep).not.toBeVisible()
  })

  it('should switch steps correctly when Next is clicked', () => {
    fireEvent.click(screen.getByText('Next Address'))

    const addressStep = screen.getByTestId('address-step')
    const docConfirmStep = screen.getByTestId('document-confirmation-step')

    expect(docConfirmStep).toBeVisible()
    expect(addressStep).not.toBeVisible()
  })

  it('should handle the "go back" logic correctly using ChevronLeft', () => {
    fireEvent.click(screen.getByText('Next Address'))
    expect(screen.getByTestId('document-confirmation-step')).toBeVisible()

    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    expect(screen.getByTestId('address-step')).toBeVisible()
    expect(screen.getByTestId('document-confirmation-step')).not.toBeVisible()
  })

  it('should go straight from Summary to Payment Confirmation (Pix)', () => {
    fireEvent.click(screen.getByText('Next Address'))
    fireEvent.click(screen.getByText('Next DocConfirm'))
    fireEvent.click(screen.getByText('Next DocType'))
    fireEvent.click(screen.getByText('Next SendDoc'))

    expect(screen.getByTestId('summary-step')).toBeVisible()
    fireEvent.click(screen.getByText('Next Summary'))

    expect(screen.getByTestId('payment-confirmation-step')).toBeVisible()
    expect(screen.getByTestId('summary-step')).not.toBeVisible()
  })

  it('should have the back button hidden/disabled on the first step', () => {
    const backButton = screen.getByTestId('chevron-left')

    expect(backButton).toHaveClass('opacity-0')
    expect(backButton).toHaveClass('pointer-events-none')
  })
})