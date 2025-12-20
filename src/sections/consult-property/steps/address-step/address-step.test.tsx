import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import React from 'react'
import { AddressStep } from './address-step'
import { listAddresses, listRegistry, listAddress } from '@/services/addresses'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')
  return {
    ...actual,
    useFormContext: vi.fn(),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

vi.mock('@/hooks/use-debounce', () => ({
  default: vi.fn((val) => val),
}))

vi.mock('@/services/addresses', () => ({
  listAddresses: vi.fn(),
  listRegistry: vi.fn(),
  listAddress: vi.fn(),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}))

vi.mock('@/components/auto-complete-address-input', () => ({
  default: ({ onChange, onConfirm, onSelectAddress, onClear, isLoading, error }: any) => (
    <div>
      <input data-testid="address-input" onChange={onChange} />
      <button data-testid="confirm-btn" onClick={() => onConfirm('mocked-address')}>Confirm</button>
      <button data-testid="select-btn" onClick={() => onSelectAddress('place-123')}>Select</button>
      <button data-testid="clear-btn" onClick={onClear}>Clear</button>
      {isLoading && <span data-testid="loading-search">Loading...</span>}
      {error && <span data-testid="error-msg">{error.title}</span>}
    </div>
  ),
}))

vi.mock('@/components/loading-overlay', () => ({
  default: ({ isLoading }: { isLoading: boolean }) => 
    isLoading ? <div data-testid="loading-overlay" /> : null,
}))

vi.mock('@/components/button', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

import { useFormContext } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import useDebounce from '@/hooks/use-debounce'

describe('AddressStep', () => {
  const setValueMock = vi.fn()
  const onNextMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useFormContext as Mock).mockReturnValue({ setValue: setValueMock })
    ;(useMutation as Mock).mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    ;(useQuery as Mock).mockReturnValue({ data: [], isLoading: false, isError: false })
  })

  afterEach(cleanup)

  it('deve renderizar itens iniciais e botão de pedidos quando o input está vazio', () => {
    render(<AddressStep onNext={onNextMock} />)
    expect(screen.getByText(/Pesquisa rápida/)).toBeInTheDocument()
    expect(screen.getByText(/Meus Pedidos/)).toBeInTheDocument()
  })

  it('deve chamar listAddresses apenas quando o texto tiver 3 ou mais caracteres', async () => {
    const listAddrMock = vi.mocked(listAddresses)
    let capturedEnabled = false

    ;(useQuery as Mock).mockImplementation(({ enabled, queryFn }) => {
      capturedEnabled = enabled
      if (enabled) queryFn()
      return { data: [], isLoading: false }
    })

    const { rerender } = render(<AddressStep onNext={onNextMock} />)
    
    const input = screen.getByTestId('address-input')
    
    fireEvent.change(input, { target: { value: 'Ru' } })
    expect(capturedEnabled).toBe(false)

    fireEvent.change(input, { target: { value: 'Rua' } })
    rerender(<AddressStep onNext={onNextMock} />)
    
    expect(capturedEnabled).toBe(true)
    expect(listAddrMock).toHaveBeenCalledWith('Rua')
  })

  it('deve mostrar erro de validação para texto curto após debounce', () => {
    ;(useDebounce as Mock).mockReturnValue('Ab')
    render(<AddressStep onNext={onNextMock} />)
    
    const input = screen.getByTestId('address-input')
    fireEvent.change(input, { target: { value: 'Ab' } })

    expect(screen.getByTestId('error-msg')).toHaveTextContent('Texto muito curto')
  })

  it('deve exibir erro amigável quando a query falha', () => {
    ;(useQuery as Mock).mockReturnValue({ 
      isError: true, 
      error: { message: 'Erro de rede' },
      data: null 
    })
    
    render(<AddressStep onNext={onNextMock} />)
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Não encontramos endereços')
  })

  it('deve executar handleSelectAddress corretamente', async () => {
    const mutateAddress = vi.fn().mockResolvedValue({ address: 'Rua X', addressNumber: '10' })
    ;(useMutation as Mock).mockImplementation(({ mutationFn }) => {
      if (mutationFn === listAddress) return { mutateAsync: mutateAddress, isPending: false }
      return { mutateAsync: vi.fn(), isPending: false }
    })

    render(<AddressStep onNext={onNextMock} />)
    fireEvent.click(screen.getByTestId('select-btn'))

    expect(setValueMock).toHaveBeenCalledWith('placeId', 'place-123')
    await waitFor(() => {
      expect(mutateAddress).toHaveBeenCalled()
    })
  })

  it('deve executar handleSubmit, salvar registro e avançar', async () => {
    const mutateRegistry = vi.fn().mockResolvedValue({ id: 'reg-1' })
    let successCallback: any

    ;(useMutation as Mock).mockImplementation(({ mutationFn, onSuccess }) => {
      if (mutationFn === listRegistry) {
        successCallback = onSuccess
        return { mutateAsync: mutateRegistry, isPending: false }
      }
      return { mutateAsync: vi.fn(), isPending: false }
    })

    render(<AddressStep onNext={onNextMock} />)
    fireEvent.click(screen.getByTestId('confirm-btn'))

    expect(setValueMock).toHaveBeenCalledWith('address', 'mocked-address')
    await waitFor(() => expect(mutateRegistry).toHaveBeenCalled())
    
    successCallback({ id: 'reg-1' })
    expect(setValueMock).toHaveBeenCalledWith('registry', { id: 'reg-1' })
    expect(onNextMock).toHaveBeenCalled()
  })

  it('deve mostrar loading overlay enquanto busca o cartório', () => {
    ;(useMutation as Mock).mockImplementation(({ mutationFn }) => ({
      mutateAsync: vi.fn(),
      isPending: mutationFn === listRegistry
    }))

    render(<AddressStep onNext={onNextMock} />)
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })

  it('deve limpar o endereço ao disparar onClear', () => {
    render(<AddressStep onNext={onNextMock} />)
    const input = screen.getByTestId('address-input')
    
    fireEvent.change(input, { target: { value: 'Rua Teste' } })
    expect(screen.queryByText(/Pesquisa rápida/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('clear-btn'))
    expect(screen.getByText(/Pesquisa rápida/)).toBeInTheDocument()
  })
})