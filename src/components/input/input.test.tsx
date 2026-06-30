import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Input from './input'

describe('Input Component', () => {
  it('should render the input', () => {
    render(<Input name="test" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should render the label when provided', () => {
    render(<Input name="test" label="Full Name" />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
  })

  it('should display error message when errors exist', () => {
    render(<Input name="cpf" errors={{ cpf: { message: 'Invalid CPF' } }} />)
    expect(screen.getByText('Invalid CPF')).toBeInTheDocument()
  })

  it('should call onChange with masked CPF', () => {
    const onChange = vi.fn()
    render(<Input name="cpf" mask="cpf" onChange={onChange} />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12345678901' } })

    expect(onChange).toHaveBeenCalled()
    expect(input.value).toBe('123.456.789-01')
  })

  it('should apply WhatsApp mask', () => {
    render(<Input name="whatsapp" mask="whatsapp" />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '11987654321' } })

    expect(input.value).toBe('(11) 98765-4321')
  })

  it('should apply CNPJ mask', () => {
    render(<Input name="cnpj" mask="cnpj" />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12345678000199' } })

    expect(input.value).toBe('12.345.678/0001-99')
  })

  it('should apply CEP mask', () => {
    render(<Input name="cep" mask="cep" />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12345678' } })

    expect(input.value).toBe('12345-678')
  })

  it('should apply custom mask function', () => {
    const customMask = (value: string) => `***${value}***`

    render(<Input name="custom" mask={customMask} />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'abc' } })

    expect(input.value).toBe('***abc***')
  })

  it('should not alter value when no mask is provided', () => {
    render(<Input name="noMask" />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '123abc' } })

    expect(input.value).toBe('123abc')
  })

  it('should set aria-invalid when there is an error', () => {
    render(<Input name="email" errors={{ email: { message: 'Invalid email' } }} />)

    const input = screen.getByRole('textbox')

    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should allow className override', () => {
    render(<Input name="styled" className="custom-class" />)

    const input = screen.getByRole('textbox')

    expect(input.className).toContain('custom-class')
  })
})
