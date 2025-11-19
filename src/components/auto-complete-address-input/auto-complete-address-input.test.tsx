import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AutoCompleteInput from './auto-complete-address-input'

const onConfirmMock = vi.fn()
const onSelectAddressMock = vi.fn().mockResolvedValue('Rua A, São Paulo')
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
  { primary: 'Rua A', secondary: 'São Paulo', value: 'rua-a', placeId: 'id-a' },
  { primary: 'Rua B', secondary: 'Rio de Janeiro', value: 'rua-b', placeId: 'id-b' },
]

describe('AutoCompleteInput', () => {
  it('should render search input and icons', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should update value when typing in input', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onChange={onChangeMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua' } })

    expect(input).toHaveValue('Rua')
    expect(onChangeMock).toHaveBeenCalled()
  })

  it('should show error message if value.length < 3', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Ru' } })

    expect(
      screen.getByText('Digite pelo menos 3 caracteres para realizar a busca.'),
    ).toBeInTheDocument()
  })

  it('should clear input when clicking clear icon', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test' } })

    fireEvent.click(screen.getByTestId('clear-icon'))

    expect(input).toHaveValue('')
  })

  it('should show loading skeletons when isLoading is true', () => {
    render(
      <AutoCompleteInput
        options={[]}
        onConfirm={onConfirmMock}
        isLoading
        onSelectAddress={onSelectAddressMock}
      />,
    )

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should open address sheet when selecting an option', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    fireEvent.click(screen.getByText('São Paulo'))

    await waitFor(() => {
      expect(document.querySelector('.bg-black\\/50')).toBeInTheDocument()
    })
  })

  it('should call onSelectAddress and fill input with returned value', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    fireEvent.click(screen.getByText('São Paulo'))

    await waitFor(() => {
      expect(input).toHaveValue('Rua A, São Paulo')
    })
  })

  it('should close sheet and focus input when clicking "Mudar"', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })

    fireEvent.click(screen.getByText('São Paulo'))

    await waitFor(() => {
      expect(document.querySelector('.bg-black\\/50')).toBeInTheDocument()
    })

    const changeButton = screen.getByText('Mudar')
    fireEvent.click(changeButton)

    expect(document.activeElement).toBe(input)
  })

  it('should call onConfirm with the selected address', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua A' } })

    fireEvent.click(screen.getByText('São Paulo'))

    const confirmButton = await screen.findByTestId('confirm-button')
    fireEvent.click(confirmButton)

    expect(onConfirmMock).toHaveBeenCalledWith('Rua A, São Paulo')
  })

  it('should show skeletons inside address sheet when isLoadingAddress is true', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        isLoadingAddress={true}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })
    fireEvent.click(screen.getByText('São Paulo'))

    await waitFor(() => {
      expect(document.querySelector('.bg-black\\/50')).toBeInTheDocument()
    })

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })

  it('should show address details and buttons when isLoadingAddress is false', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        isLoadingAddress={false}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua A' } })
    fireEvent.click(screen.getByText('São Paulo'))

    await waitFor(() => {
      expect(document.querySelector('.bg-black\\/50')).toBeInTheDocument()
    })

    expect(screen.getByText('Rua A, São Paulo')).toBeInTheDocument()
    expect(screen.getByText('Mudar')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument()
  })
})
