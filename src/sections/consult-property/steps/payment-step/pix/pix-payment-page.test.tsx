import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { PixPaymentPage } from './pix-payment-page'
import type { ReactNode, ChangeEvent } from 'react'

const mockPush = vi.fn()
const mockMutateAsync = vi.fn()
const mockUseMutation = vi.fn()
const mockSetStep = vi.fn()
const mockWriteText = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: (fn: (data: unknown) => void) => (e?: { preventDefault: () => void }) => {
      e?.preventDefault()
      fn({
        name: 'John Doe',
        document: '123.456.789-00',
        email: 'john@example.com',
        whatsapp: '11999999999',
      })
    },
    formState: { errors: {} },
  }),
  useFormContext: () => ({
    getValues: () => ({
      placeId: 'place-123',
      document: { id: 'doc-123' },
    }),
    setStep: mockSetStep,
  }),
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (data: unknown) => ({
    values: data,
    errors: {},
  }),
}))

vi.mock('./validations', () => ({
  validations: {},
  FormTypes: {},
}))

let mockPaymentStatusResponse: { state: { data: { status: string } } } | null = null

type PaymentData = {
  state: {
    data: {
      status: string
    }
  }
} | null

interface UseQueryOptions {
  enabled?: boolean
  refetchInterval?: number | false | ((data: PaymentData) => number | false)
  [key: string]: unknown
}

vi.mock('@tanstack/react-query', async () => {
  const React = await import('react')

  return {
    useMutation: (args: unknown) => mockUseMutation(args),

    useQuery: (options: UseQueryOptions) => {
      const data = mockPaymentStatusResponse

      React.useEffect(() => {
        if (data && typeof options?.refetchInterval === 'function') {
          options.refetchInterval(data)
        }
      }, [data, options])

      return {
        data: data,
        isPending: !data,
      }
    },
  }
})

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  ),
}))

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick, ...props }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

interface InputProps {
  label: string
  name: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

vi.mock('@/components/input', () => ({
  __esModule: true,
  default: ({ label, name, onChange, ...props }: InputProps) => (
    <label>
      {label}
      <input name={name} onChange={onChange} {...props} />
    </label>
  ),
}))

interface BottomSheetProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}

vi.mock('@/components/bottom-sheet', () => ({
  __esModule: true,
  default: ({ children, isOpen, onClose }: BottomSheetProps) =>
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose}>Close Sheet</button>
        {children}
      </div>
    ) : null,
}))

vi.mock('@/components/loading-overlay', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) => (isLoading ? <div>Carregando...</div> : null),
}))

vi.mock('@/components/alert', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}))

describe('PixPaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPaymentStatusResponse = null

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })
    mockWriteText.mockClear()

    mockUseMutation.mockImplementation((options: { onSuccess?: (data: unknown) => void }) => ({
      mutateAsync: async (variables: unknown) => {
        await mockMutateAsync(variables)
        const result = { id: 'payment-123', payload: 'qr-code-payload-mock' }
        if (options?.onSuccess) {
          options.onSuccess(result)
        }
        return result
      },
      data: { payload: 'qr-code-payload-mock' },
      isPending: false,
    }))
  })

  afterEach(() => {
    cleanup()
  })

  it('should render QR Code when data is available', () => {
    render(<PixPaymentPage />)

    const qrImg = screen.getByAltText(/QR Code para pagamento Pix/i)
    expect(qrImg).toBeInTheDocument()
    expect(qrImg.getAttribute('src')).toContain('qr-code-payload-mock')
  })

  it('should copy PIX code when clicking the button', async () => {
    render(<PixPaymentPage />)

    const button = screen.getByRole('button', { name: /copiar código pix/i })
    fireEvent.click(button)

    expect(mockWriteText).toHaveBeenCalledWith('qr-code-payload-mock')

    await waitFor(() => {
      expect(screen.getByText(/copiado/i)).toBeInTheDocument()
    })
  })

  it('should handle clipboard error and call console.error', async () => {
    mockWriteText.mockRejectedValue(new Error('Erro'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<PixPaymentPage />)

    const button = screen.getByRole('button', { name: /copiar código pix/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  it('should submit form with correct data and close bottom sheet', async () => {
    render(<PixPaymentPage />)

    expect(screen.getByText('Dados do PIX')).toBeInTheDocument()

    const submitButton = screen.getByRole('button', { name: /continuar/i })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(mockMutateAsync).toHaveBeenCalledWith({
      place_id: 'place-123',
      document_id: 'doc-123',
      name: 'John Doe',
      document: '123.456.789-00',
    })

    expect(screen.getByText(/Este código expira em 30 minutos/i)).toBeInTheDocument()
  })

  it('should display error alert when mutation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockUseMutation.mockImplementationOnce((options: { onError?: () => void }) => ({
      mutateAsync: async () => {
        if (options?.onError) options.onError()
        throw new Error('Falha simulada')
      },
      data: null,
      isPending: false,
    }))

    render(<PixPaymentPage />)

    const submitButton = screen.getByRole('button', { name: /continuar/i })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Houve um erro ao processar o pagamento via PIX',
    )
  })

  it('should show success modal when payment status is CONFIRMED', async () => {
    const { rerender } = render(<PixPaymentPage />)

    expect(screen.getByText('Aguardando o pagamento')).toBeInTheDocument()

    mockPaymentStatusResponse = {
      state: {
        data: {
          status: 'CONFIRMED',
        },
      },
    }

    rerender(<PixPaymentPage />)

    await waitFor(() => {
      expect(screen.getByText('Pagamento confirmado!')).toBeInTheDocument()
    })
  })

  it('should redirect to home when clicking continue on success modal', async () => {
    mockPaymentStatusResponse = { state: { data: { status: 'CONFIRMED' } } }
    render(<PixPaymentPage />)

    await waitFor(() => {
      expect(screen.getByText('Pagamento confirmado!')).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button', { name: /continuar/i })
    const successButton = buttons[buttons.length - 1]

    fireEvent.click(successButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should call setStep(5) when closing the initial bottom sheet', () => {
    render(<PixPaymentPage />)

    const closeButton = screen.getByText('Close Sheet')
    fireEvent.click(closeButton)

    expect(mockSetStep).toHaveBeenCalledWith(5)
  })
})
