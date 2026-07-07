import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FormProvider, useForm } from 'react-hook-form'
import { CreditCardPage } from './save-cards-page'

vi.mock('@/hooks/use-consult-price', () => ({
  useConsultDynamicPrice: () => ({ price: 59, isLoading: false }),
}))

function formWrapper() {
  function W({ children }: { children: React.ReactNode }) {
    const methods = useForm({
      defaultValues: {
        address: 'Rua Teste',
        registrationNumber: '',
        allotment: '',
        block: '',
        lot: '',
      },
    })
    return <FormProvider {...methods}>{children}</FormProvider>
  }
  return W
}

vi.mock('@/components/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked ? 'On' : 'Off'}
    </button>
  ),
}))

describe('CreditCardPage', () => {
  const mockOnSave = vi.fn()

  it('deve renderizar os campos do formulário corretamente', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })

    expect(screen.getByPlaceholderText('0000 0000 0000 0000')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Roberto Silva')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('MM/AA')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('CVV')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar/i })).toBeInTheDocument()
  })

  it('deve aplicar a máscara de cartão de crédito', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    const input = screen.getByPlaceholderText('0000 0000 0000 0000') as HTMLInputElement

    fireEvent.change(input, { target: { value: '1234567812345678' } })
    expect(input.value).toBe('1234 5678 1234 5678')

    fireEvent.change(input, { target: { value: 'abc' } })
    expect(input.value).toBe('')
  })

  it('deve atualizar o nome do titular', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    const input = screen.getByPlaceholderText('Ex: Roberto Silva') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'João da Silva' } })
    expect(input.value).toBe('João da Silva')
  })

  it('deve aplicar a máscara de validade (MM/AA)', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    const input = screen.getByPlaceholderText('MM/AA') as HTMLInputElement

    fireEvent.change(input, { target: { value: '1' } })
    expect(input.value).toBe('1')

    fireEvent.change(input, { target: { value: '12' } })
    expect(input.value).toBe('12/')

    fireEvent.change(input, { target: { value: '1225' } })
    expect(input.value).toBe('12/25')

    fireEvent.change(input, { target: { value: 'abc' } })
    expect(input.value).toBe('')
  })

  it('deve aplicar a máscara de CVV (apenas números e limite de 4)', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    const input = screen.getByPlaceholderText('CVV') as HTMLInputElement

    fireEvent.change(input, { target: { value: '123a' } })
    expect(input.value).toBe('123')

    fireEvent.change(input, { target: { value: '12345' } })
    expect(input.value).toBe('1234')
  })

  it('deve aplicar a máscara de CPF', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    const input = screen.getByPlaceholderText('000.000.000-00') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12345678901' } })
    expect(input.value).toBe('123.456.789-01')

    fireEvent.change(input, { target: { value: 'abc' } })
    expect(input.value).toBe('')
  })

  it('deve alternar o estado de salvar cartão ao clicar no texto ou no switch', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    
    const switchButton = screen.getByRole('switch')
    expect(switchButton).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(switchButton)
    expect(switchButton).toHaveAttribute('aria-checked', 'true')

    const labelText = screen.getByText('Salvar cartão para compras futuras')
    fireEvent.click(labelText)
    expect(switchButton).toHaveAttribute('aria-checked', 'false')
  })

  it('deve chamar a função onSave ao clicar no botão de pagar', () => {
    render(<CreditCardPage onSave={mockOnSave} />, { wrapper: formWrapper() })
    
    const submitButton = screen.getByRole('button', { name: /Pagar/i })
    fireEvent.click(submitButton)

    expect(mockOnSave).toHaveBeenCalledTimes(1)
  })
})