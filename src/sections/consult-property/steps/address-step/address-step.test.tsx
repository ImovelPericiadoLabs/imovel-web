import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AddressStep } from './address-step'

const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
  }),
}))

type TextTitleProps = {
  children: React.ReactNode
}

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => <h1 data-testid="text-title">{children}</h1>,
}))

type AutoCompleteAddressInputProps = {
  placeholder: string
  options: { street: string; city: string; value: string }[]
  onConfirm: (address: string) => void
}

vi.mock('@/components/auto-complete-address-input', () => ({
  __esModule: true,
  default: ({ placeholder, options, onConfirm }: AutoCompleteAddressInputProps) => (
    <div>
      <input data-testid="address-input" placeholder={placeholder} />
      <button data-testid="confirm-button" onClick={() => onConfirm(options[0].street)}>
        Confirm
      </button>
    </div>
  ),
}))

describe('AddressStep', () => {
  it('should render title and address input', () => {
    render(<AddressStep />)
    expect(screen.getByTestId('text-title')).toHaveTextContent(
      'Para começar, onde fica seu imóvel?',
    )
    expect(screen.getByTestId('address-input')).toBeInTheDocument()
  })

  it('should call setValue and handleNextStep when confirming address', () => {
    render(<AddressStep />)
    const confirmButton = screen.getByTestId('confirm-button')
    fireEvent.click(confirmButton)
    expect(setValueMock).toHaveBeenCalledWith('address', 'Rua Pamplona')
    expect(handleNextStepMock).toHaveBeenCalledTimes(1)
  })
})
