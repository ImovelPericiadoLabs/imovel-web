import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
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
  ChevronLeft: (props: ComponentProps<'div'>) => <div data-testid="chevron-left" {...props} />,
  Menu: (props: ComponentProps<'div'>) => <div data-testid="menu" {...props} />,
}))

vi.mock('@/sections/consult-property/steps', async () => {
  const rhf = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')

  const MockStep = ({ testId }: { testId: string }) => {
    const { handleNextStep } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid={testId}>
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  const MockConfirmationStep = () => {
    const { handleNextStep, setHasDocument } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid="document-confirmation-step">
        <button onClick={() => setHasDocument(true)}>Set Has Document</button>
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  return {
    AddressStep: () => <MockStep testId="address-step" />,
    DocumentConfirmationStep: () => <MockConfirmationStep />,
    DocumentTypeStep: () => <MockStep testId="document-type-step" />,
    SendDocumentStep: () => <MockStep testId="send-document-step" />,
    SummaryStep: () => <MockStep testId="summary-step" />,
    PaymentStep: () => <MockStep testId="payment-step" />,
  }
})

vi.mock('@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step', () => ({
  PaymentConfirmationStep: () => <div data-testid="payment-confirmation-step">Payment Confirmation</div>
}))

describe('ConsultProperty Flow', () => {
  beforeEach(() => {
    render(<ConsultProperty />)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render ONLY the first step initially', () => {
    expect(screen.getByTestId('address-step')).toBeInTheDocument()
    expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
  })

  it('should switch steps correctly when Next is clicked', () => {
    fireEvent.click(screen.getByText('Next Step'))

    expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()
    expect(screen.queryByTestId('address-step')).not.toBeInTheDocument()
  })

  it('should handle the "go back" logic correctly using ChevronLeft', () => {
    fireEvent.click(screen.getByText('Next Step'))
    expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()

    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    expect(screen.getByTestId('address-step')).toBeInTheDocument()
    expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
  })

  it('should handle the payment sub-step logic', () => {
    const nextButtons = screen.getAllByText('Next Step')
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next Step'))
    }

    expect(screen.getByTestId('payment-step')).toBeInTheDocument()


    fireEvent.click(screen.getByText('Next Step'))

    expect(screen.getByTestId('payment-confirmation-step')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument()
  })

  it('should redirect to home if back button is clicked on step 1', () => {
    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})