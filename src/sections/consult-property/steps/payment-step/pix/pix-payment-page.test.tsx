import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}))

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')
  return {
    ...actual,
    useFormContext: vi.fn(),
    useForm: (args: any) => {
      const methods = actual.useForm(args)
      return {
        ...methods,
        trigger: vi.fn().mockResolvedValue(true),
      }
    }
  }
})

vi.mock('./AuthCodePage/AuthCodePage', () => ({
  AuthCodePage: ({ onSuccess }: any) => (
    <div data-testid="auth-page">
      <button onClick={() => onSuccess('123456')}>Confirm Code</button>
    </div>
  )
}))

vi.mock('@/components/bottom-sheet', () => ({
  default: ({ isOpen, children }: any) => isOpen ? <div data-testid="bottom-sheet">{children}</div> : null
}))

vi.mock('@/components/input', () => ({
  default: ({ label, name, register, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid={`input-${name}`} {...props} {...(register ? register(name) : {})} name={name} />
    </div>
  )
}))

vi.mock('@/components/button', () => ({
  default: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
  )
}))

vi.mock('@/components/loading-overlay', () => ({
  default: ({ isLoading }: any) => isLoading ? <div data-testid="loading-overlay" /> : null
}))

vi.mock('@/components/alert', () => ({
  default: ({ message }: any) => <div role="alert">{message}</div>
}))

vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))

vi.mock('@/services/payments', () => ({ processPayment: vi.fn(), getPaymentStatus: vi.fn() }))
vi.mock('@/services/account', () => ({ startAuth: vi.fn(), getMe: vi.fn() }))
vi.mock('@/services/orders/orders', () => ({ listPlans: vi.fn().mockResolvedValue([{ price: 59 }]) }))
vi.mock('@/utils/text/text', () => ({ formatMoney: (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}` }))

import { PixPaymentPage } from './pix-payment-page'
import { useSession, signOut } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { startAuth } from '@/services/account'
import { useFormContext } from 'react-hook-form'
import { queryKey } from '@/constants/queries'

describe('PixPaymentPage', () => {
  const mockOnCancel = vi.fn()
  const mockOnFinish = vi.fn()
  const mockMutateAsync = vi.fn()
  const mockWriteText = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Object.assign(navigator, { clipboard: { writeText: mockWriteText } })
    mockWriteText.mockResolvedValue(undefined)

    const parentValues: Record<string, unknown> = {
      address: 'Rua Teste',
      addressHint: '',
      placeId: 'p1',
      document: { id: 'doc-1' },
      registrationNumber: '',
      notaryName: '',
      registry: null,
      complement: '',
      allotment: '',
      block: '',
      lot: '',
      entryPath: 'document',
      includeCertificates: true,
    }
    vi.mocked(useFormContext).mockReturnValue({
      getValues: (field?: string) => {
        if (field === undefined) return parentValues as never
        return parentValues[field] as never
      },
      watch: (field?: string) => {
        if (field === undefined) return parentValues as never
        return parentValues[field] as never
      },
    } as unknown as ReturnType<typeof useFormContext>)

    ;(useSession as Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
    ;(useMutation as Mock).mockReturnValue({ 
      mutateAsync: mockMutateAsync, 
      isPending: false, 
      data: null 
    })
    ;(useQuery as Mock).mockReturnValue({ data: null })
  })

  afterEach(cleanup)

  it('deve lidar com token expirado (401) e reiniciar autenticação com o email correto', async () => {
    ;(useSession as Mock).mockReturnValue({ 
      data: { user: { email: 'expired@test.com' } }, 
      status: 'authenticated' 
    })
    mockMutateAsync.mockRejectedValue({ status: 401 })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} placeId="p1" />)
    
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'João' } })
    fireEvent.click(screen.getByText(/Pagar com PIX/i))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
      expect(startAuth).toHaveBeenCalledWith({ email: 'expired@test.com' })
      expect(screen.getByTestId('auth-page')).toBeInTheDocument()
    })
  })

  it('deve copiar o código PIX e mostrar feedback no passo final', async () => {
    ;(useSession as Mock).mockReturnValue({ 
      data: { user: { email: 'test@test.com' } }, 
      status: 'authenticated' 
    })

    const pixData = { payload: '000201-PAYLOAD-TEST', value: 100, id: 'pay-123' }
    ;(useMutation as Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      data: pixData,
      isPending: false
    })
    mockMutateAsync.mockResolvedValue(pixData)

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} placeId="p1" />)
    
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'João' } })
    fireEvent.click(screen.getByText(/Pagar com PIX/i))

    const copyBtn = await screen.findByText(/Copiar PIX/i)
    fireEvent.click(copyBtn)

    expect(mockWriteText).toHaveBeenCalledWith('000201-PAYLOAD-TEST')
    expect(await screen.findByText(/Copiado!/i)).toBeInTheDocument()
  })

  it('deve interromper o polling e chamar onFinish quando CONFIRMED', async () => {
    let capturedOptions: any
    ;(useQuery as Mock).mockImplementation((options) => {
      if (options.queryKey?.[0] === queryKey.paymentStatus) {
        capturedOptions = options
      }
      return { data: null }
    })

    render(<PixPaymentPage onCancel={mockOnCancel} onFinish={mockOnFinish} placeId="p1" />)
    
    const shouldRefetch = capturedOptions.refetchInterval({ 
      state: { data: { status: 'CONFIRMED' } } 
    })

    expect(shouldRefetch).toBe(false)
    expect(mockOnFinish).toHaveBeenCalled()
  })
})