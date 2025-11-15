import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AutoCompleteInput from './auto-complete-address-input'

const onConfirmMock = vi.fn()
const onChangeMock = vi.fn()

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button data-testid="confirm-button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  X: ({ onClick }: { onClick?: () => void }) => <svg data-testid="clear-icon" onClick={onClick} />,
  MapPin: () => <svg data-testid="map-pin" />,
}))

const mockOptions = [
  { street: 'Rua A', city: 'São Paulo', value: 'rua-a' },
  { street: 'Rua B', city: 'Rio de Janeiro', value: 'rua-b' },
]

describe('AutoCompleteInput', () => {
  it('should render search input and icons', () => {
    render(<AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} />)
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should update value when typing in input', () => {
    render(
      <AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} onChange={onChangeMock} />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua' } })
    expect(input).toHaveValue('Rua')
    expect(onChangeMock).toHaveBeenCalled()
  })

  it('should clear input when clicking clear icon', () => {
    render(<AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test' } })

    const clearIcon = screen.getByTestId('clear-icon')
    fireEvent.click(clearIcon)

    expect(input).toHaveValue('')
  })

  it('should show skeletons when loading', () => {
    render(<AutoCompleteInput options={[]} onConfirm={onConfirmMock} isLoading />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should open address sheet overlay when selecting an address', () => {
    render(<AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    const option = screen.getByText('São Paulo')
    fireEvent.click(option)

    const overlay = document.querySelector('.bg-black\\/50')
    expect(overlay).toBeInTheDocument()
  })

  it('should clear value, close sheet, and move focus back to input when clicking "Mudar"', () => {
    render(<AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    const option = screen.getByText('São Paulo')
    fireEvent.click(option)

    const changeButton = screen.getByText('Mudar')
    fireEvent.click(changeButton)

    expect(document.activeElement).toBe(input)
  })

  it('should call onConfirm with selected address when clicking confirm', () => {
    render(<AutoCompleteInput options={mockOptions} onConfirm={onConfirmMock} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    const option = screen.getByText('São Paulo')
    fireEvent.click(option)

    const confirmButton = screen.getByTestId('confirm-button')
    fireEvent.click(confirmButton)

    expect(onConfirmMock).toHaveBeenCalledWith('Rua A, São Paulo')
  })
})
