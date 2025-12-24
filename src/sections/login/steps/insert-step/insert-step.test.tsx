import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InsertStep } from './insert-step'
import { startAuth } from '@/services/account'
import { validations } from '@/sections/login/validations'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/services/account', () => ({
  startAuth: vi.fn(),
}))

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    resolver: zodResolver(validations),
    defaultValues: { email: '' },
    mode: 'onChange'
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('InsertStep', () => {
  const mockOnNext = vi.fn()

  beforeEach(() => {
    render(
      <Wrapper>
        <InsertStep onNext={mockOnNext} />
      </Wrapper>
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render the heading and description correctly', () => {
    expect(screen.getByText('Acessar ou cadastrar')).toBeVisible()
    expect(screen.getByText(/Insira seu e-mail/)).toBeVisible()
  })

  it('should have the submit button disabled initially', () => {
    const button = screen.getByRole('button', { name: /Continuar/i })
    expect(button).toBeDisabled()
  })

  it('should enable the button when email is valid', async () => {
    const input = screen.getByPlaceholderText('Seu e-mail')
    const button = screen.getByRole('button', { name: /Continuar/i })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'invalid-email' } })
    })

    await waitFor(() => {
      expect(button).toBeDisabled()
    })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test@example.com' } })
    })

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('should call startAuth and onNext on successful submission', async () => {
    vi.mocked(startAuth).mockResolvedValue({} as any)

    const input = screen.getByPlaceholderText('Seu e-mail')
    const button = screen.getByRole('button', { name: /Continuar/i })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'user@example.com' } })
    })

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(startAuth).toHaveBeenCalledWith({ email: 'user@example.com' })
    })

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalled()
    })
  })

  it('should display error message when startAuth fails', async () => {
    const errorMessage = 'Erro ao processar solicitação'
    vi.mocked(startAuth).mockRejectedValue({
      response: {
        data: {
          detail: errorMessage
        }
      }
    })

    const input = screen.getByPlaceholderText('Seu e-mail')
    const button = screen.getByRole('button', { name: /Continuar/i })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'error@example.com' } })
    })

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeVisible()
    })

    expect(mockOnNext).not.toHaveBeenCalled()
    expect(button).not.toBeDisabled()
  })

  it('should display default error message when API fails without detail', async () => {
    vi.mocked(startAuth).mockRejectedValue(new Error('Network error'))

    const input = screen.getByPlaceholderText('Seu e-mail')
    const button = screen.getByRole('button', { name: /Continuar/i })

    await act(async () => {
      fireEvent.change(input, { target: { value: 'fail@example.com' } })
    })

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText('Não foi possível enviar o código. Tente novamente.')).toBeVisible()
    })
  })
})