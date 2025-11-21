import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AutoCompleteInput from './auto-complete-address-input'

const onConfirmMock = vi.fn()
const onSelectAddressMock = vi.fn()
const onChangeMock = vi.fn()
const onClearMock = vi.fn()

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

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
  { primary: 'Rua Exemplo', secondary: 'Bairro', value: 'opt1', placeId: 'pid1' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AutoCompleteInput', () => {
  it('should render initial state correctly', () => {
    render(<AutoCompleteInput onConfirm={onConfirmMock} onSelectAddress={onSelectAddressMock} />)
    expect(screen.getByTestId('icon-search')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByTestId('icon-clear')).not.toBeInTheDocument()
  })

  it('should handle typing and call onChange prop if provided', () => {
    render(
      <AutoCompleteInput
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
        onChange={onChangeMock}
      />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test' } })

    expect(input).toHaveValue('Test')
    expect(onChangeMock).toHaveBeenCalled()
    expect(screen.getByTestId('icon-clear')).toBeInTheDocument()
  })

  it('should update value internally even without onChange prop', () => {
    render(<AutoCompleteInput onConfirm={onConfirmMock} onSelectAddress={onSelectAddressMock} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Internal' } })
    expect(input).toHaveValue('Internal')
  })

  it('should clear input and call onClear prop', () => {
    render(
      <AutoCompleteInput
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
        onClear={onClearMock}
      />,
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Clear me' } })

    const clearBtn = screen.getByTestId('icon-clear')
    fireEvent.click(clearBtn)

    expect(input.value).toBe('')
    expect(onClearMock).toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  it('should clear input without onClear prop crashing', () => {
    render(<AutoCompleteInput onConfirm={onConfirmMock} onSelectAddress={onSelectAddressMock} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Clear me' } })
    fireEvent.click(screen.getByTestId('icon-clear'))
    expect(input).toHaveValue('')
  })

  it('should show loading skeletons', () => {
    render(
      <AutoCompleteInput
        isLoading
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should render options list', () => {
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Search' } })

    expect(screen.getByText('Rua Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Bairro')).toBeInTheDocument()
  })

  it('should handle address selection invalid format (no comma)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua Sem Virgula')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(onSelectAddressMock).toHaveBeenCalledWith('pid1')
      expect(screen.getByText('Número do endereço obrigatório')).toBeInTheDocument()
    })
  })

  it('should handle address selection invalid format (comma but no number)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, Centro')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Número do endereço obrigatório')).toBeInTheDocument()
    })
  })

  it('should handle address selection valid format (number)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, 123')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar este endereço?')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveValue('Rua, 123')
    })
  })

  it('should handle address selection valid format (s/n)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, s/n')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar este endereço?')).toBeInTheDocument()
    })
  })

  it('should handle confirm action in sheet', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, 123')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar'))
    expect(onConfirmMock).toHaveBeenCalledWith('Rua, 123')
  })

  it('should handle "change address" action (backdrop click)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, 123')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar este endereço?')).toBeInTheDocument()
    })

    const backdrop = screen
      .getByRole('textbox')
      .closest('div')
      ?.parentElement?.querySelector('.fixed.inset-0')
    if (backdrop) fireEvent.click(backdrop)

    expect(screen.queryByText('Confirmar este endereço?')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('should handle "change address" action (button click)', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, 123')
    render(
      <AutoCompleteInput
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getByText('Mudar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mudar'))
    expect(screen.queryByText('Confirmar este endereço?')).not.toBeInTheDocument()
  })

  it('should show loading state inside confirmation sheet', async () => {
    onSelectAddressMock.mockResolvedValue('Rua, 123')
    render(
      <AutoCompleteInput
        isLoadingAddress
        options={mockOptions}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua Exemplo'))

    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
      expect(screen.queryByText('Confirmar')).not.toBeInTheDocument()
      expect(screen.queryByText('Mudar')).not.toBeInTheDocument()
    })
  })

  it('should show "Not Found" sheet when dirty, not loading, and no options', () => {
    render(
      <AutoCompleteInput
        isDirty
        isLoading={false}
        options={[]}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unknown' } })
    expect(screen.getByText('Não encontramos seu endereço')).toBeInTheDocument()
  })

  it('should close "Not Found" sheet on button click', () => {
    render(
      <AutoCompleteInput
        isDirty
        isLoading={false}
        options={[]}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
        error={null}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unknown' } })

    const btn = screen.getByText('Entendi')
    fireEvent.click(btn)

    expect(screen.queryByText('Não encontramos seu endereço')).not.toBeInTheDocument()
  })

  it('should display external error prop', () => {
    render(
      <AutoCompleteInput
        error={{ title: 'External Error', subtitle: 'Details' }}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    expect(screen.getByText('External Error')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('should close error sheet on button click', () => {
    render(
      <AutoCompleteInput
        error={{ title: 'External Error', subtitle: 'Details' }}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.click(screen.getByText('Entendi'))

    expect(screen.queryByText('External Error')).not.toBeInTheDocument()
  })

  it('should prioritize error sheet over not found sheet', () => {
    render(
      <AutoCompleteInput
        isDirty
        isLoading={false}
        options={[]}
        error={{ title: 'Error Priority', subtitle: 'Sub' }}
        onConfirm={onConfirmMock}
        onSelectAddress={onSelectAddressMock}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Val' } })
    expect(screen.getByText('Error Priority')).toBeInTheDocument()
    expect(screen.queryByText('Não encontramos seu endereço')).not.toBeInTheDocument()
  })
})
