import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useForm, FormProvider } from 'react-hook-form'
import { VerifyCodeStep } from './verify-step'
import { signIn } from 'next-auth/react'
import { startAuth } from '@/services/account'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('@/services/account', () => ({ startAuth: vi.fn() }))

vi.mock('@/sections/login/components/InputOtp', () => ({
  InputOtp: ({ value, onChange }: any) => (
    <input
      data-testid="otp-input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

const Wrapper = ({ children, defaultValues = { email: 'test@test.com', code: '' } }: any) => {
  const methods = useForm({ defaultValues })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('VerifyCodeStep Senior Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setInterval'] })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('should process successful login', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: null } as any)
    const onSuccess = vi.fn().mockResolvedValue(undefined)
    render(<Wrapper><VerifyCodeStep onBack={vi.fn()} onSuccess={onSuccess} /></Wrapper>)

    fireEvent.change(screen.getByTestId('otp-input'), { target: { value: '123456' } })

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /continuar/i }).parentElement as HTMLFormElement)
    })

    expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ code: '123456' }))
    expect(onSuccess).toHaveBeenCalled()
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should handle timer expiration and resend', async () => {
    vi.mocked(startAuth).mockResolvedValue({} as any)

    render(
      <Wrapper>
        <VerifyCodeStep
          onBack={vi.fn()}
          enableTimer={false}
          initialTimer={0}
        />
      </Wrapper>
    )

    expect(screen.getByText('Use o e-mail mais recente.')).toBeInTheDocument()
    expect(screen.getByText(/Válido por/)).toBeInTheDocument()

    const resendBtn = screen.getByRole('button', {
      name: /reenviar o mesmo código/i,
    })

    fireEvent.click(resendBtn)

    expect(startAuth).toHaveBeenCalledWith({ email: 'test@test.com' })
  })


  it('should display error message from signIn failure', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'Error: Codigo Invalido',
    } as any)

    render(
      <Wrapper>
        <VerifyCodeStep onBack={vi.fn()} enableTimer={false} />
      </Wrapper>
    )

    fireEvent.change(screen.getByTestId('otp-input'), {
      target: { value: '000000' },
    })

    fireEvent.submit(
      screen
        .getByRole('button', { name: /continuar/i })
        .closest('form') as HTMLFormElement
    )

    expect(await screen.findByText('Codigo Invalido')).toBeInTheDocument()
  })


})