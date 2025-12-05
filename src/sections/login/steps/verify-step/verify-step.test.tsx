import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from './verify-step'
import { signIn } from 'next-auth/react'
import { startAuth } from '@/services/account'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('@/services/account', () => ({
  startAuth: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="icon-mail" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
}))

vi.mock('@/sections/login/components/InputOtp', () => ({
  InputOtp: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <input
      data-testid="otp-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

vi.mock('@/sections/login/validations', () => ({
  FormTypes: {},
}))

const Wrapper = ({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) => {
  const methods = useForm({
    defaultValues: { email: '', code: '', ...defaultValues },
    mode: 'onChange',
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('VerifyCodeStep', () => {
  const mockOnBack = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  describe('Interaction & Logic', () => {
    it('should redirect back immediately if no email is provided', () => {
      render(
        <Wrapper defaultValues={{ email: '' }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )
      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should render correctly with email', () => {
      render(
        <Wrapper defaultValues={{ email: 'test@example.com' }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )
      expect(screen.getByText('test@example.com')).toBeVisible()
    })

    it('should call onBack when back button is clicked', () => {
      render(
        <Wrapper defaultValues={{ email: 'test@example.com' }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )
      fireEvent.click(screen.getByText('Voltar'))
      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should handle successful login', async () => {
      const email = 'success@example.com'
      const code = '123456'
      vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: '' })

      render(
        <Wrapper defaultValues={{ email }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )

      fireEvent.change(screen.getByTestId('otp-input'), { target: { value: code } })
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email,
          code,
          redirect: false,
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/consultar-imovel')
    })

    it('should display error message on login failure', async () => {
      const email = 'fail@example.com'
      const errorMsg = 'Invalid Code'
      vi.mocked(signIn).mockResolvedValue({ error: errorMsg, ok: false, status: 401, url: '' })

      render(
        <Wrapper defaultValues={{ email }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )

      fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '000000' } })
      fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))

      await waitFor(() => {
        expect(screen.getByText(errorMsg)).toBeVisible()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Timer & Resend Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should enable resend button after timer expires', () => {
      render(
        <Wrapper defaultValues={{ email: 'timer@example.com' }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )

      expect(screen.queryByText('Reenviar agora')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(59000)
      })

      expect(screen.getByText('Reenviar agora')).toBeVisible()
    })

    it('should call startAuth and reset timer when resend is clicked', async () => {
      const email = 'resend@example.com'
      vi.mocked(startAuth).mockResolvedValue({} as any)

      render(
        <Wrapper defaultValues={{ email }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )

      act(() => {
        vi.advanceTimersByTime(59000)
      })

      const resendBtn = screen.getByText('Reenviar agora')
      fireEvent.click(resendBtn)

      expect(screen.getByText('Enviando...')).toBeVisible()

      await act(async () => {
        await Promise.resolve()
      })

      expect(startAuth).toHaveBeenCalledWith({ email })
      expect(screen.getByText(/Reenviar em 59s/)).toBeVisible()
    })

    it('should show error message if resend fails', async () => {
      vi.mocked(startAuth).mockRejectedValue(new Error('Network error'))

      render(
        <Wrapper defaultValues={{ email: 'error@example.com' }}>
          <VerifyCodeStep onBack={mockOnBack} />
        </Wrapper>
      )

      act(() => {
        vi.advanceTimersByTime(59000)
      })

      fireEvent.click(screen.getByText('Reenviar agora'))

      await act(async () => {
        await Promise.resolve()
      })

      expect(screen.getByText('Aguarde alguns instantes antes de tentar novamente.')).toBeVisible()
    })
  })
})