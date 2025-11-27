import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentStep } from './payment-step'

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1 data-testid="text-title">{children}</h1>,
}))

vi.mock('@/components/option-card/option-card.tsx', () => ({
  default: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button data-testid={`option-${title}`} onClick={onClick}>
      {title}
    </button>
  ),
}))

vi.mock('@/components/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <button
      data-testid="switch"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      Switch
    </button>
  ),
}))

vi.mock('lucide-react', () => ({
  QrCode: () => <svg data-testid="icon-qrcode" />,
  CreditCard: () => <svg data-testid="icon-credit-card" />,
  Barcode: () => <svg data-testid="icon-barcode" />,
  DollarSign: () => <svg data-testid="icon-dollar" />,
}))

const mockSetValue = vi.fn()
const mockWatch = vi.fn()
const mockOnPix = vi.fn()
const mockOnCredit = vi.fn()
const mockOnDebit = vi.fn()
const mockOnBoleto = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: mockSetValue,
    watch: mockWatch,
  }),
}))

describe('PaymentStep', () => {
  const defaultProps = {
    onPix: mockOnPix,
    onCredit: mockOnCredit,
    onDebit: mockOnDebit,
    onBoleto: mockOnBoleto,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatch.mockReturnValue(false)
  })

  it('should render TextTitle and default balance correctly', () => {
    render(<PaymentStep {...defaultProps} />)

    expect(screen.getByTestId('text-title')).toHaveTextContent('Escolha como pagar')
    expect(screen.getByText('Saldo em conta')).toBeInTheDocument()
    // 240.0 default -> R$ 240,00
    expect(screen.getByText(/R\$\s240,00/)).toBeInTheDocument()
  })

  it('should render formatted balance provided via props', () => {
    render(<PaymentStep {...defaultProps} currentBalance={1500.50} />)
    expect(screen.getByText(/R\$\s1\.500,50/)).toBeInTheDocument()
  })

  it('should toggle balance switch correctly', () => {
    mockWatch.mockReturnValue(false)
    render(<PaymentStep {...defaultProps} />)

    const switchBtn = screen.getByTestId('switch')
    fireEvent.click(switchBtn)

    expect(mockSetValue).toHaveBeenCalledWith('useBalance', true)
  })

  it('should handle Pix selection', () => {
    render(<PaymentStep {...defaultProps} />)

    const pixOption = screen.getByTestId('option-Pix')
    fireEvent.click(pixOption)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'pix', { shouldValidate: true })
    expect(mockOnPix).toHaveBeenCalledTimes(1)
  })

  it('should handle Credit Card selection', () => {
    render(<PaymentStep {...defaultProps} />)

    const creditOption = screen.getByTestId('option-Cartão de Crédito')
    fireEvent.click(creditOption)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'credit_card', { shouldValidate: true })
    expect(mockOnCredit).toHaveBeenCalledTimes(1)
  })

  it('should handle Debit Card selection', () => {
    render(<PaymentStep {...defaultProps} />)

    const debitOption = screen.getByTestId('option-Cartão de Débito')
    fireEvent.click(debitOption)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'debit_card', { shouldValidate: true })
    expect(mockOnDebit).toHaveBeenCalledTimes(1)
  })

  it('should handle Boleto selection', () => {
    render(<PaymentStep {...defaultProps} />)

    const boletoOption = screen.getByTestId('option-Boleto')
    fireEvent.click(boletoOption)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'boleto', { shouldValidate: true })
    expect(mockOnBoleto).toHaveBeenCalledTimes(1)
  })

  it('should render the container with correct structure classes', () => {
    const { container } = render(<PaymentStep {...defaultProps} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative', 'flex-1', 'px-4')

    const contentDiv = wrapper.querySelector('.flex.flex-col')
    expect(contentDiv).toHaveClass('gap-5')
  })
})