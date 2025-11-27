import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { useFormContext } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { PixPaymentPage } from './pix-payment-page'

// --- Mocks Globais ---

// 1. Mock do Resolver do Zod para ignorar validação de CPF/Email nos testes
// Isso garante que o formulário seja submetido independentemente dos valores
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: any) => ({
    values,
    errors: {},
  }),
}))

// Mock do React Hook Form
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useFormContext: vi.fn(),
  }
})

// Mock do React Query
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}))

// Mock de Componentes de UI
vi.mock('@/components/bottom-sheet', () => ({
  default: ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => (
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose} data-testid="close-bottom-sheet">Close</button>
        {children}
      </div>
    ) : null
  ),
}))

vi.mock('@/components/input', () => ({
  default: ({ label, onKeyDown, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid={`input-${props.name}`} onKeyDown={onKeyDown} {...props} />
      {/* Exibe erro se houver, simulando o componente real */}
      {props.errors && props.errors[props.name] && <span>{props.errors[props.name].message}</span>}
    </div>
  ),
}))

vi.mock('@/components/button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/loading-overlay', () => ({
  default: ({ isLoading, message }: any) => (
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null
  ),
}))

vi.mock('@/components/alert', () => ({
  default: ({ message }: any) => <div data-testid="alert-error">{message}</div>,
}))

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}))

vi.mock('@/components/icons/pix-icon', () => ({ default: () => <svg /> }))
vi.mock('lucide-react', () => ({
  Check: () => <svg />,
  Clock: () => <svg />,
}))

vi.mock('@/services/payments', () => ({
  processPayment: vi.fn(),
}))

describe('PixPaymentPage', () => {
  const mockOnCancel = vi.fn()
  const mockOnFinish = vi.fn()
  const mockMutateAsync = vi.fn()
  const mockGetValues = vi.fn()

  const mockWriteText = vi.fn()
  Object.assign(navigator, {
    clipboard: {
      writeText: mockWriteText,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()

      ; (useFormContext as Mock).mockReturnValue({
        getValues: mockGetValues.mockReturnValue({
          placeId: 'place-123',
          document: { id: 'doc-123' },
        }),
      })

      ; (useMutation as Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        data: null,
        isPending: false,
      })
  })

  it('deve renderizar o BottomSheet com o formulário inicialmente', () => {
    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument()
    expect(screen.getByText('Dados do PIX')).toBeInTheDocument()
    expect(screen.getByTestId('input-name')).toBeInTheDocument()
  })

  it('deve fechar o BottomSheet ao clicar no botão de fechar (onClose)', () => {
    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    fireEvent.click(screen.getByTestId('close-bottom-sheet'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('deve submeter o formulário e chamar a mutação com os dados corretos', async () => {
    mockMutateAsync.mockResolvedValue({ payload: 'pix-code-123' })

      ; (useMutation as Mock).mockImplementation((options) => {
        return {
          mutateAsync: mockMutateAsync,
          data: null,
          isPending: false,
        }
      })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    // O valor do CPF não precisa ser matematicamente válido pois mockamos o resolver
    const validCPF = '572.686.040-07'

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByTestId('input-document'), { target: { value: validCPF } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'joao@test.com' } })
    fireEvent.change(screen.getByTestId('input-whatsapp'), { target: { value: '(11) 99999-9999' } })

    fireEvent.click(screen.getByText('Continuar'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        place_id: 'place-123',
        document_id: 'doc-123',
        name: 'João Silva',
        document: validCPF,
      })
    })
  })

  it('deve processar onSuccess corretamente (fechar sheet e mostrar QR Code)', async () => {
    let onSuccessCallback: () => void = () => { }
      ; (useMutation as Mock).mockImplementation((options) => {
        if (options.onSuccess) onSuccessCallback = options.onSuccess
        return {
          mutateAsync: mockMutateAsync,
          data: { payload: 'pix-payload-mock' },
          isPending: false,
        }
      })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    // Simula o sucesso da mutação
    onSuccessCallback()

    await waitFor(() => {
      expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Este código expira em 30 minutos/)).toBeInTheDocument()
    expect(screen.getByText('pix-payload-mock')).toBeInTheDocument()
  })

  it('deve exibir erro do servidor quando a mutação falha', async () => {
    let onErrorCallback: () => void = () => { }
      ; (useMutation as Mock).mockImplementation((options) => {
        if (options.onError) onErrorCallback = options.onError
        return {
          mutateAsync: mockMutateAsync,
          data: null,
          isPending: false,
        }
      })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    // Simula o erro da mutação
    onErrorCallback()

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toHaveTextContent(
        'Houve um erro ao processar o pagamento via PIX. Por favor, tente novamente.'
      )
    })
  })

  it('deve limpar o erro do servidor ao digitar nos inputs', async () => {
    let onErrorCallback: () => void = () => { }
      ; (useMutation as Mock).mockImplementation((options) => {
        if (options.onError) onErrorCallback = options.onError
        return { mutateAsync: mockMutateAsync, data: null, isPending: false }
      })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    onErrorCallback()
    await waitFor(() => expect(screen.getByTestId('alert-error')).toBeInTheDocument())

    fireEvent.keyDown(screen.getByTestId('input-name'), { key: 'a' })

    await waitFor(() => {
      expect(screen.queryByTestId('alert-error')).not.toBeInTheDocument()
    })
  })

  it('deve copiar o código PIX com sucesso', async () => {
    ; (useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: { payload: 'codigo-copiavel' },
      isPending: false,
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    const copyButton = screen.getByText('Copiar código pix').closest('button')!
    fireEvent.click(copyButton)

    expect(mockWriteText).toHaveBeenCalledWith('codigo-copiavel')

    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeInTheDocument()
    })
  })

  it('deve tratar erro ao copiar código PIX', async () => {
    ; (useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: { payload: 'codigo-erro' },
      isPending: false,
    })

    mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    const copyButton = screen.getByText('Copiar código pix').closest('button')!
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Falha ao copiar código pix:', expect.any(Error))
    })
  })

  it('deve exibir loading overlay quando isPending é true', () => {
    ; (useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: null,
      isPending: true,
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })
})