import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Login } from './login'
import { startAuth } from '@/services/account'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}))

vi.mock('@/services/account', () => ({
  startAuth: vi.fn()
}))

vi.mock('./steps/insert-step', () => ({
  InsertStep: ({ onNext }: any) => (
    <div data-testid="insert-step">
      <button onClick={onNext}>Next Step</button>
    </div>
  )
}))

vi.mock('./steps/verify-step', () => ({
  VerifyCodeStep: ({ onBack }: any) => (
    <div data-testid="verify-step">
      <button onClick={onBack}>Back Step</button>
    </div>
  )
}))

describe('Login Flow with Activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.scrollTo = vi.fn()
  })

  it('should handle auto-login from storage', async () => {
    const mockEmail = 'user@test.com'
    localStorage.setItem('@pix-payment:form-data', JSON.stringify({ email: mockEmail }))
    vi.mocked(startAuth).mockResolvedValueOnce({} as any)

    render(<Login />)

    await waitFor(() => {
      expect(startAuth).toHaveBeenCalledWith({ email: mockEmail })
      const verifyStep = screen.getByTestId('verify-step').parentElement
      expect(verifyStep).toHaveStyle('display: block')
    })
  })

  it('should toggle visibility between steps', async () => {
    render(<Login />)
    
    await waitFor(() => expect(screen.queryByText('Verificando cadastro...')).not.toBeInTheDocument())

    const insertContainer = screen.getByTestId('insert-step').parentElement
    const verifyContainer = screen.getByTestId('verify-step').parentElement

    expect(insertContainer).toHaveStyle('display: block')
    expect(verifyContainer).toHaveStyle('display: none')

    fireEvent.click(screen.getByText('Next Step'))

    expect(insertContainer).toHaveStyle('display: none')
    expect(verifyContainer).toHaveStyle('display: block')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('should navigate back to home from email step', async () => {
    render(<Login />)
    await waitFor(() => expect(screen.queryByText('Verificando cadastro...')).not.toBeInTheDocument())

    const backBtn = screen.getByLabelText('Voltar')
    fireEvent.click(backBtn)

    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('should handle API errors during initialization gracefully', async () => {
    localStorage.setItem('@pix-payment:form-data', JSON.stringify({ email: 'err@test.com' }))
    vi.mocked(startAuth).mockRejectedValueOnce(new Error('API Fail'))

    render(<Login />)

    await waitFor(() => {
      expect(screen.queryByText('Verificando cadastro...')).not.toBeInTheDocument()
      expect(screen.getByTestId('insert-step')).toBeInTheDocument()
    })
  })
})