import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AutoCompleteInput from './auto-complete-address-input'

const onConfirmMock = vi.fn()
const onSelectAddressMock = vi.fn().mockResolvedValue('ENDEREÇO COMPLETO')
const onChangeMock = vi.fn()

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <h1 data-testid="title">{children}</h1>,
}))

vi.mock('@/components/text-subtitle', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="subtitle">{children}</p>
  ),
}))

vi.mock('@/components/skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('@/components/auto-complete-address-input/components/address-sheet', () => ({
  __esModule: true,
  default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="sheet">{children}</div> : null,
}))

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="icon-search" />,
  X: ({ onClick }: { onClick?: () => void }) => <svg data-testid="icon-clear" onClick={onClick} />,
  MapPin: () => <svg data-testid="icon-pin" />,
  CircleAlert: () => <svg data-testid="icon-error" />,
  MapPinX: () => <svg data-testid="icon-notfound" />,
}))

const mockOptions = [
  { primary: 'Rua ABC, 123', secondary: 'Cidade X', value: 'a', placeId: '1' },
  { primary: 'Rua Sem Numero', secondary: 'Cidade Y', value: 'b', placeId: '2' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AutoCompleteInput', () => {
  it('should render input and icons', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    expect(screen.getByTestId('icon-search')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should update input value on typing', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
        onChange={onChangeMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua' } })

    expect(input).toHaveValue('Rua')
    expect(onChangeMock).toHaveBeenCalled()
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

    fireEvent.click(screen.getByTestId('icon-clear'))

    expect(input).toHaveValue('')
  })

  it('should show skeleton when loading', () => {
    render(
      <AutoCompleteInput
        isLoading
        options={[]}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should open error sheet if address has no number', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua Sem Numero' } })

    fireEvent.click(screen.getByText('Rua Sem Numero'))

    await waitFor(() => {
      expect(screen.getByTestId('sheet')).toBeInTheDocument()
      expect(screen.getByTestId('title')).toHaveTextContent('Número do endereço obrigatório')
    })
  })

  it('should select address with number and open confirmation sheet', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Rua ABC, 123' } })

    fireEvent.click(screen.getByText('Rua ABC, 123'))

    await waitFor(() => {
      expect(screen.getAllByTestId('sheet')[0]).toBeInTheDocument()
    })
  })

  it('should fill input after selecting valid address', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Rua ABC, 123' },
    })

    fireEvent.click(screen.getByText('Rua ABC, 123'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('ENDEREÇO COMPLETO')
    })
  })

  it('should show not found sheet when no options and dirty', () => {
    render(
      <AutoCompleteInput
        isDirty
        isLoading={false}
        options={[]}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'AAA' },
    })

    expect(screen.getAllByTestId('sheet')[0]).toBeInTheDocument()
  })

  it('should confirm address on button click', async () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Rua ABC, 123' },
    })

    fireEvent.click(screen.getByText('Rua ABC, 123'))

    await waitFor(() => {
      expect(screen.getAllByTestId('sheet')[0]).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByTestId('button')[1])

    expect(onConfirmMock).toHaveBeenCalled()
  })
})
