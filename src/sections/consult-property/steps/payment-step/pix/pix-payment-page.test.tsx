import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { useFormContext } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { PixPaymentPage } from './pix-payment-page'

// --- Variáveis de Controle para os Mocks ---
let mockPaymentStatusResponse: { state: { data: { status: string } } } | null = null

// --- Mocks Globais ---

// 1. Mock do Resolver do Zod
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: any) => ({
    values,
    errors: {},
  }),
}))

// 2. Mock do React Hook Form
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useFormContext: vi.fn(),
  }
})

// 3. Mock do React Query (Versão da DEV com suporte a polling)
// Precisamos desse mock complexo para testar o intervalo de atualização do status
interface UseQueryOptions {
  enabled?: boolean
  refetchInterval?: number | false | ((data: any) => number | false)
  [key: string]: unknown
}

vi.mock('@tanstack/react-query', async () => {
  const React = await import('react')
  return {
    useMutation: vi.fn(),
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

// 4. Mocks de Componentes de UI (Baseado na HEAD com data-testids)
vi.mock('@/components/bottom-sheet', () => ({
  default: ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => (
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose} data-testid="close-bottom-sheet">Close Sheet</button>
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
  default: ({ message }: any) => <div data-testid="alert-error" role="alert">{message}</div>,
}))

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}))

vi.mock('@/components/skeleton', () => ({
  default: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('@/components/icons/pix-icon', () => ({ default: () => <svg /> }))
vi.mock('lucide-react', () => ({
  Check: () => <svg />,
  Clock: () => <svg />,
}))

vi.mock('@/services/payments', () => ({
  processPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
}))

describe('PixPaymentPage', () => {
  const mockOnCancel = vi.fn()
  const mockOnFinish = vi.fn()
  const mockMutateAsync = vi.fn()
  const mockGetValues = vi.fn()
  const mockWriteText = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockPaymentStatusResponse = null

    // Mock do Clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })

    // Configuração padrão do useFormContext
    ;(useFormContext as Mock).mockReturnValue({
      getValues: mockGetValues.mockReturnValue({
        placeId: 'place-123',
        document: { id: 'doc-123' },
      }),
    })

    // Configuração padrão do useMutation
    ;(useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: null,
      isPending: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  // --- TESTES DE RENDERIZAÇÃO E INTERAÇÃO BÁSICA (HEAD) ---

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

  // --- TESTES DE FORMULÁRIO (HEAD) ---

  it('deve submeter o formulário e chamar a mutação com os dados corretos', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'pay-1', payload: 'pix-code-123' })

    ;(useMutation as Mock).mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      data: null,
      isPending: false,
    }))

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    const validCPF = '572.686.040-07'

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByTestId('input-document'), { target: { value: validCPF } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'joao@test.com' } })
    fireEvent.change(screen.getByTestId('input-whatsapp'), { target: { value: '(11) 99999-9999' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Continuar'))
    })

    expect(mockMutateAsync).toHaveBeenCalledWith({
      place_id: 'place-123',
      document_id: 'doc-123',
      name: 'João Silva',
      document: validCPF,
    })
  })

  it('deve processar onSuccess corretamente (fechar sheet e mostrar QR Code)', async () => {
    let onSuccessCallback: (data: any) => void = () => {}
    
    ;(useMutation as Mock).mockImplementation((options) => {
      if (options.onSuccess) onSuccessCallback = options.onSuccess
      return {
        mutateAsync: mockMutateAsync,
        data: { payload: 'pix-payload-mock' },
        isPending: false,
      }
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    // Simula o sucesso da mutação
    act(() => {
      onSuccessCallback({ id: 'payment-123' })
    })

    await waitFor(() => {
      // O BottomSheet inicial deve fechar
      expect(screen.queryByTestId('input-name')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Este código expira em 30 minutos/)).toBeInTheDocument()
    expect(screen.getByText('pix-payload-mock')).toBeInTheDocument()
  })

  // --- TESTES DE ERRO (HEAD) ---

  it('deve exibir erro do servidor quando a mutação falha', async () => {
    let onErrorCallback: () => void = () => {}
    
    ;(useMutation as Mock).mockImplementation((options) => {
      if (options.onError) onErrorCallback = options.onError
      return {
        mutateAsync: mockMutateAsync,
        data: null,
        isPending: false,
      }
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    act(() => {
      onErrorCallback()
    })

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toHaveTextContent(
        'Houve um erro ao processar o pagamento via PIX. Por favor, tente novamente.'
      )
    })
  })

  // --- TESTES DE COPY & PASTE (MISTO) ---

  it('deve copiar o código PIX com sucesso', async () => {
    ;(useMutation as Mock).mockReturnValue({
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
    ;(useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: { payload: 'codigo-erro' },
      isPending: false,
    })

    mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    const copyButton = screen.getByText('Copiar código pix').closest('button')!
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Falha ao copiar código pix:', expect.any(Error))
    })
  })

  // --- TESTES DE POLLING E CONFIRMAÇÃO (DEV) ---

  it('deve mostrar modal de sucesso quando o status do pagamento for CONFIRMED', async () => {
    // 1. Renderiza inicialmente sem dados
    const { rerender } = render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    // 2. Simula o retorno do polling com status CONFIRMED
    mockPaymentStatusResponse = {
      state: {
        data: {
          status: 'CONFIRMED',
        },
      },
    }

    // Força re-render para o useEffect do mock disparar
    rerender(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    await waitFor(() => {
      expect(screen.getByText('Pagamento confirmado!')).toBeInTheDocument()
    })
  })

  it('deve chamar onFinish ao clicar em continuar no modal de sucesso', async () => {
    // Configura já como confirmado
    mockPaymentStatusResponse = { state: { data: { status: 'CONFIRMED' } } }
    
    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    await waitFor(() => {
      expect(screen.getByText('Pagamento confirmado!')).toBeInTheDocument()
    })

    // Busca o botão dentro do modal de sucesso (geralmente o último botão renderizado)
    const buttons = screen.getAllByRole('button', { name: /continuar/i })
    const successButton = buttons[buttons.length - 1]

    fireEvent.click(successButton)

    expect(mockOnFinish).toHaveBeenCalled()
  })

  it('deve exibir loading overlay quando isPending é true', () => {
    ;(useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: null,
      isPending: true,
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} />)

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })
})