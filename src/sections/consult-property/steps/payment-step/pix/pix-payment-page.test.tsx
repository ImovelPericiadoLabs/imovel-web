import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { PixPaymentPage } from './pix-payment-page'

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ ...props }: { alt: string }) => <img {...props} />,
}))

vi.mock('@/components/skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('@tanstack/react-query', () => {
  return {
    useMutation: vi.fn().mockImplementation((options) => {
      return {
        mutateAsync: vi.fn().mockImplementation(async () => {
          await Promise.resolve()
          return options.onSuccess && options.onSuccess()
        }),
        data: { payload: 'qr-code-payload' },
        isPending: false,
      }
    }),
  }
})

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: (fn: () => void) => fn,
    formState: { errors: {} },
  }),
  useFormContext: () => ({
    getValues: () => ({
      placeId: '123',
      document: '00011122233',
    }),
  }),
}))

describe('PixPaymentPage', () => {
  const mockWriteText = vi.fn()

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })
    mockWriteText.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render QR Code when data is available', () => {
    render(<PixPaymentPage />)

    const qrImg = screen.getByAltText(/QR Code para pagamento Pix/i)
    expect(qrImg).toBeInTheDocument()
    expect(qrImg.getAttribute('src')).toContain('qr-code-payload')
  })

  it('should copy PIX code when clicking the button', async () => {
    render(<PixPaymentPage />)

    const button = screen.getByRole('button', { name: /copiar código pix/i })
    fireEvent.click(button)

    expect(mockWriteText).toHaveBeenCalledWith('qr-code-payload')

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

  it('should display skeleton while no result is available', async () => {
    vi.resetModules()

    vi.doMock('@tanstack/react-query', () => ({
      useMutation: () => ({
        mutateAsync: vi.fn(),
        data: null,
        isPending: true,
      }),
    }))

    const { PixPaymentPage } = await import('./pix-payment-page')

    render(<PixPaymentPage />)

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should update expiration time after payment success', () => {
    vi.useFakeTimers()

    render(<PixPaymentPage />)

    const expiresText = screen.getByText(/Este código expira em 30 minutos/i)
    expect(expiresText).toBeInTheDocument()

    vi.useRealTimers()
  })
})
