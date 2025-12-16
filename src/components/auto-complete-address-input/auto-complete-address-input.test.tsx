import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import AutoCompleteInput from './auto-complete-address-input'
import React from 'react'

type Option = {
  primary?: string
  secondary?: string
  placeId?: string
  value?: string
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: Option[]
  isLoading?: boolean
  onConfirm: (address: string) => void
  isLoadingAddress?: boolean
  onSelectAddress: (value: string) => Promise<string>
  error?: {
    title: string
    subtitle: string
  } | null
  isDirty?: boolean
  onClear?: () => void
}

vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="icon-search" />,
  X: (props: React.SVGProps<SVGSVGElement>) => <div data-testid="icon-clear" {...props} />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  CircleAlert: () => <div data-testid="icon-alert" />,
  MapPinX: () => <div data-testid="icon-map-pin-x" />,
}))

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: (string | undefined | null | boolean)[]) => inputs.join(' '),
}))

vi.mock('@/components/button', () => ({
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}))

vi.mock('@/components/text-subtitle', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('@/components/skeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}))

interface BottomSheetProps {
  isOpen: boolean
  children: React.ReactNode
  onClose: () => void
}

vi.mock('@/components/bottom-sheet', () => ({
  default: ({ isOpen, children, onClose }: BottomSheetProps) =>
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose} data-testid="close-sheet">
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

describe('AutoCompleteInput', () => {
  const defaultProps: Props = {
    onConfirm: vi.fn(),
    onSelectAddress: vi.fn(),
  }

  it('should render the input correctly', () => {
    render(<AutoCompleteInput {...defaultProps} placeholder="Search address" />)
    expect(screen.getByPlaceholderText('Search address')).toBeInTheDocument()
    expect(screen.getByTestId('icon-search')).toBeInTheDocument()
  })

  it('should update value when typing', () => {
    render(<AutoCompleteInput {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Main St' } })
    expect(input).toHaveValue('Main St')
  })

  it('should call props.onChange when provided', () => {
    const onChange = vi.fn()
    render(<AutoCompleteInput {...defaultProps} onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test change' } })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].target.value).toBe('Test change')
  })

  it('should show clear button only when input has value', () => {
    render(<AutoCompleteInput {...defaultProps} />)
    expect(screen.queryByTestId('icon-clear')).not.toBeInTheDocument()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test' } })
    expect(screen.getByTestId('icon-clear')).toBeInTheDocument()
  })

  it('should call onClear when onClear prop is provided and clear the input', () => {
    const onClearMock = vi.fn()
    render(<AutoCompleteInput {...defaultProps} onClear={onClearMock} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Will be cleared' } })
    fireEvent.click(screen.getByTestId('icon-clear'))
    expect(onClearMock).toHaveBeenCalled()
    expect(input).toHaveValue('')
  })

  it('should show loading skeletons when isLoading is true', () => {
    render(<AutoCompleteInput {...defaultProps} isLoading={true} />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('should render options when provided', () => {
    const options: Option[] = [
      { primary: 'Main Street', secondary: 'NY', value: '1', placeId: '111' },
    ]
    render(<AutoCompleteInput {...defaultProps} options={options} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'M' } })
    expect(screen.getByText('Main Street')).toBeInTheDocument()
    expect(screen.getByText('NY')).toBeInTheDocument()
  })

  it('should open confirmation sheet with address text when isLoadingAddress is false', async () => {
    const onSelectAddressMock = vi.fn().mockResolvedValue('Main St, 100')
    const options: Option[] = [{ primary: 'Main St', value: '1', placeId: 'xx' }]

    render(
      <AutoCompleteInput
        {...defaultProps}
        options={options}
        isLoadingAddress={false}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ma' } })
    fireEvent.click(screen.getByText('Main St'))

    await waitFor(() => {
      expect(screen.getByText('Main St, 100')).toBeInTheDocument()
      expect(screen.getByText('Mudar')).toBeInTheDocument()
    })
  })

  it('should render skeletons inside confirmation sheet when isLoadingAddress is true', async () => {
    const onSelectAddressMock = vi.fn().mockResolvedValue('Street, 55')
    const options: Option[] = [{ primary: 'Street', value: '1', placeId: 'pp' }]

    render(
      <AutoCompleteInput
        {...defaultProps}
        options={options}
        isLoadingAddress={true}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'S' } })
    fireEvent.click(screen.getByText('Street'))

    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
      expect(screen.queryByText('Mudar')).not.toBeInTheDocument()
    })
  })

  it('should allow clicking Mudar to close sheet', async () => {
    const onSelectAddressMock = vi.fn().mockResolvedValue('Street, 500')
    const options = [{ primary: 'Street', value: '1', placeId: '11' }]

    render(
      <AutoCompleteInput
        {...defaultProps}
        options={options}
        isLoadingAddress={false}
        onSelectAddress={onSelectAddressMock}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'S' } })
    fireEvent.click(screen.getByText('Street'))

    await waitFor(() => screen.getByText('Mudar'))

    fireEvent.click(screen.getByText('Mudar'))
    expect(screen.queryByText('Confirmar este endereço?')).not.toBeInTheDocument()
  })

  it('should call onConfirm when clicking Confirmar button', async () => {
    const onSelectAddressMock = vi.fn().mockResolvedValue('Street, 200')
    const onConfirmMock = vi.fn()
    const options = [{ primary: 'Street', value: '1', placeId: '99' }]

    render(
      <AutoCompleteInput
        {...defaultProps}
        options={options}
        onSelectAddress={onSelectAddressMock}
        onConfirm={onConfirmMock}
        isLoadingAddress={false}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'S' } })
    fireEvent.click(screen.getByText('Street'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar'))
    expect(onConfirmMock).toHaveBeenCalledWith('Street, 200')
  })

  it('should show error when address has no number', async () => {
    const onSelectAddressMock = vi.fn().mockResolvedValue('Street, ')
    const options = [{ primary: 'Street', value: '1', placeId: 'x' }]

    render(
      <AutoCompleteInput
        {...defaultProps}
        onSelectAddress={onSelectAddressMock}
        options={options}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'S' } })
    fireEvent.click(screen.getByText('Street'))

    await waitFor(() => {
      expect(screen.getByText('Número do endereço obrigatório')).toBeInTheDocument()
    })
  })

  it('should show error sheet when error prop exists', () => {
    const error = { title: 'Error Title', subtitle: 'Error Subtitle' }
    render(<AutoCompleteInput {...defaultProps} error={error} />)
    expect(screen.getByText('Error Title')).toBeInTheDocument()
    expect(screen.getByText('Error Subtitle')).toBeInTheDocument()
  })

  it('should show not found sheet when no options match', async () => {
    render(<AutoCompleteInput {...defaultProps} options={[]} isDirty={true} isLoading={false} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Unknown' } })

    await waitFor(() => {
      expect(screen.getByText('Não encontramos seu endereço')).toBeInTheDocument()
    })
  })

  it('should clear the input, call onClear if provided and focus the input', () => {
    const onClear = vi.fn()

    render(<AutoCompleteInput {...defaultProps} onClear={onClear} />)

    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'ABC' } })
    expect(input).toHaveValue('ABC')

    const clearBtn = screen.getByTestId('icon-clear')

    fireEvent.click(clearBtn)

    expect(onClear).toHaveBeenCalled()

    expect(input).toHaveValue('')

    expect(input).toHaveFocus()
  })

  it('should clear the input and focus it even when onClear is not provided', () => {
    render(<AutoCompleteInput {...defaultProps} />)

    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'Testing' } })
    expect(input).toHaveValue('Testing')

    const clearBtn = screen.getByTestId('icon-clear')
    fireEvent.click(clearBtn)

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })
})
