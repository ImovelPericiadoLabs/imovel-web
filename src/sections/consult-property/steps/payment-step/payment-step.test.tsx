import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentStep } from './payment-step'

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1 data-testid="text-title">{children}</h1>,
}))

vi.mock('@/components/text-subtitle', () => ({
  default: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(() => ({ data: undefined as unknown })),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}))

vi.mock('@/hooks/use-consult-price', () => ({
  useConsultDynamicPrice: () => ({ payable: 79, price: 79 }),
}))

vi.mock('@/services/payments', () => ({
  getPaymentMethods: vi.fn(),
}))

vi.mock('@/services/account', () => ({
  getMe: vi.fn(),
}))

const mockSetValue = vi.fn()
const mockWatch = vi.fn()
const mockOnPix = vi.fn()
const mockOnCredit = vi.fn()
const mockOnBoleto = vi.fn()
const mockOnCredits = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: mockSetValue,
    watch: mockWatch,
  }),
}))

describe('PaymentStep', () => {
  const defaultProps = {
    currentBalance: 240,
    onPix: mockOnPix,
    onCredit: mockOnCredit,
    onBoleto: mockOnBoleto,
    onCredits: mockOnCredits,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatch.mockReturnValue(false)
    mockUseQuery.mockReturnValue({ data: undefined })
  })

  it('should render TextTitle and default balance correctly', () => {
    render(<PaymentStep {...defaultProps} />)

    expect(screen.getByTestId('text-title')).toHaveTextContent('Escolha como pagar')
    expect(screen.getByText('Saldo em conta')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s240,00/)).toBeInTheDocument()
  })

  it('should render formatted balance provided via props', () => {
    render(<PaymentStep {...defaultProps} currentBalance={1500.50} />)
    expect(screen.getByText(/R\$\s1\.500,50/)).toBeInTheDocument()
  })

  it('escolhe saldo na listagem e não deixa o switch', () => {
    vi.useFakeTimers()
    render(<PaymentStep {...defaultProps} />)

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('option-Saldo em conta'))
    vi.advanceTimersByTime(300)

    expect(mockSetValue).toHaveBeenCalledWith('useBalance', true)
    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'credits', { shouldValidate: true })
    expect(mockOnCredits).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('should handle Pix selection', () => {
    vi.useFakeTimers()
    render(<PaymentStep {...defaultProps} />)

    const pixOption = screen.getByTestId('option-Pix')
    fireEvent.click(pixOption)
    vi.advanceTimersByTime(300)

    expect(mockSetValue).toHaveBeenCalledWith('useBalance', false)
    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'pix', { shouldValidate: true })
    expect(mockOnPix).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('should handle Credit Card selection', () => {
    vi.useFakeTimers()
    render(<PaymentStep {...defaultProps} />)

    const creditOption = screen.getByTestId('option-Cartão')
    fireEvent.click(creditOption)
    vi.advanceTimersByTime(300)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'credit_card', { shouldValidate: true })
    expect(mockOnCredit).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('option-Cartão de Débito')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('should handle Boleto selection', () => {
    vi.useFakeTimers()
    render(<PaymentStep {...defaultProps} />)

    const boletoOption = screen.getByTestId('option-Boleto')
    fireEvent.click(boletoOption)
    vi.advanceTimersByTime(300)

    expect(mockSetValue).toHaveBeenCalledWith('paymentMethod', 'boleto', { shouldValidate: true })
    expect(mockOnBoleto).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('mostra alerta e não navega quando o meio está indisponível', () => {
    mockUseQuery.mockReturnValue({
      data: {
        methods: [{ code: 'PIX', available: false, status: 'maintenance', reason: '' }],
      },
    })

    render(<PaymentStep {...defaultProps} />)

    fireEvent.click(screen.getByTestId('option-Pix'))

    expect(mockOnPix).not.toHaveBeenCalled()
    expect(screen.getByText('Instabilidade temporária')).toBeInTheDocument()
    expect(screen.getByText('Instabilidade temporária com o banco. Tente outro método.')).toBeInTheDocument()
    expect(screen.queryByText(/manutenção/i)).not.toBeInTheDocument()
  })

  it('não escolhe saldo quando não há créditos suficientes', () => {
    render(<PaymentStep {...defaultProps} currentBalance={0} />)

    fireEvent.click(screen.getByTestId('option-Saldo em conta'))
    expect(mockSetValue).not.toHaveBeenCalledWith('useBalance', true)
    expect(mockOnCredits).not.toHaveBeenCalled()
  })

  it('should render the container with correct structure classes', () => {
    const { container } = render(<PaymentStep {...defaultProps} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative', 'flex-1')

    const contentDiv = wrapper.querySelector('.flex.flex-col')
    expect(contentDiv).toHaveClass('gap-5')
  })
})
