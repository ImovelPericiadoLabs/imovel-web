import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, Mock } from 'vitest'
import { useFormContext } from 'react-hook-form'
import { PaymentConfirmationStep } from './payment-confirmation-step'

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
}))

vi.mock('@/sections/consult-property/steps/payment-step/pix', () => ({
  PixPaymentPage: (props: any) => (
    <div data-testid="pix-payment-mock">
      <span>Mock Pix Component</span>
      <span data-testid="pix-amount">{props.amount}</span>
      <span data-testid="pix-code">{props.pixCode}</span>
    </div>
  ),
}))

describe('PaymentConfirmationStep', () => {
  it('não deve renderizar nada (null) quando o método de pagamento não for "pix"', () => {
    ;(useFormContext as Mock).mockReturnValue({
      watch: vi.fn().mockReturnValue('credit_card'),
    })

    const { container } = render(<PaymentConfirmationStep />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('pix-payment-mock')).not.toBeInTheDocument()
  })

  it('não deve renderizar nada se o método de pagamento for undefined', () => {
    ;(useFormContext as Mock).mockReturnValue({
      watch: vi.fn().mockReturnValue(undefined),
    })

    const { container } = render(<PaymentConfirmationStep />)
    expect(container).toBeEmptyDOMElement()
  })
})
