import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, Mock } from 'vitest'
import { useFormContext } from 'react-hook-form'
import { PaymentConfirmationStep } from './payment-confirmation-step'

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
}))

vi.mock('@/sections/consult-property/steps/payment-step/pix', () => ({
  PixPaymentPage: ({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) => (
    <div data-testid="pix-payment-page">
      <button data-testid="pix-cancel-btn" onClick={onCancel}>Cancel</button>
      <button data-testid="pix-finish-btn" onClick={onFinish}>Finish</button>
    </div>
  ),
}))

vi.mock('@/sections/consult-property/steps/payment-step/card/select', () => ({
  SavedCardsPage: ({ onAddNewCard }: { onAddNewCard: () => void }) => (
    <div data-testid="saved-cards-page">
      <button data-testid="card-add-btn" onClick={onAddNewCard}>Add New</button>
    </div>
  ),
}))

const defaultProps = {
  onFinish: vi.fn(),
  onBackToMethods: vi.fn(),
  onAddNewCard: vi.fn(),
}

describe('PaymentConfirmationStep', () => {
  it('deve renderizar PixPaymentPage e chamar os callbacks corretos quando o método for "pix"', () => {
    ; (useFormContext as Mock).mockReturnValue({
      watch: vi.fn().mockReturnValue('pix'),
    })

    render(<PaymentConfirmationStep {...defaultProps} />)

    expect(screen.getByTestId('pix-payment-page')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('pix-cancel-btn'))
    expect(defaultProps.onBackToMethods).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('pix-finish-btn'))
    expect(defaultProps.onFinish).toHaveBeenCalled()
  })

  it('deve renderizar PixPaymentPage quando o método for "credit_card"', () => {
    ; (useFormContext as Mock).mockReturnValue({
      watch: vi.fn().mockReturnValue('credit_card'),
    })

    render(<PaymentConfirmationStep {...defaultProps} />)

    expect(screen.getByTestId('pix-payment-page')).toBeInTheDocument()
  })

  it('não deve renderizar nada se o método de pagamento for undefined', () => {
    ; (useFormContext as Mock).mockReturnValue({
      watch: vi.fn().mockReturnValue(undefined),
    })

    const { container } = render(<PaymentConfirmationStep {...defaultProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})