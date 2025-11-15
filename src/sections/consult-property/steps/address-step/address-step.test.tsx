import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddressStep } from './address-step'
import { listAddresses } from '@/services/addresses'

const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()
const listAddressesMock = listAddresses as unknown as ReturnType<typeof vi.fn>

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
  }),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/auto-complete-address-input', () => ({
  __esModule: true,
  default: ({
    placeholder,
    onChange,
    onConfirm,
    isLoading,
  }: {
    placeholder: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onConfirm: (address: string) => void
    isLoading: boolean
  }) => (
    <div>
      <input data-testid="address-input" placeholder={placeholder} onChange={(e) => onChange(e)} />
      {isLoading && <div data-testid="loading">Loading...</div>}
      <button data-testid="confirm-button" onClick={() => onConfirm('mockAddress')}>
        Confirm
      </button>
    </div>
  ),
}))

const useQueryMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => unknown; enabled: boolean }) => useQueryMock(opts),
}))

vi.mock('@/hooks/use-debounce', () => ({
  __esModule: true,
  default: (value: string) => value,
}))

vi.mock('@/services/addresses', () => ({
  listAddresses: vi.fn(),
}))

beforeEach(() => {
  listAddressesMock.mockReset()
  useQueryMock.mockReset()
})

describe('AddressStep', () => {
  it('should call queryFn and listAddresses when debouncedAddress is not empty', () => {
    listAddressesMock.mockResolvedValue([{ street: 'A', city: 'B', value: 'C' }])

    useQueryMock.mockImplementation(({ queryFn }) => {
      queryFn()
      return {
        data: [{ street: 'A', city: 'B', value: 'C' }],
        isLoading: false,
      }
    })

    render(<AddressStep />)

    const input = screen.getByTestId('address-input')
    fireEvent.change(input, { target: { value: 'Rua X' } })

    expect(listAddressesMock).toHaveBeenCalledWith('Rua X')
  })

  it('should render title and input', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<AddressStep />)

    expect(screen.getByTestId('text-title')).toHaveTextContent(
      'Para começar, onde fica seu imóvel?',
    )
    expect(screen.getByTestId('address-input')).toBeInTheDocument()
  })

  it('should call setValue and handleNextStep when confirming address', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<AddressStep />)

    const confirmButton = screen.getByTestId('confirm-button')
    fireEvent.click(confirmButton)

    expect(setValueMock).toHaveBeenCalledWith('address', 'mockAddress')
    expect(handleNextStepMock).toHaveBeenCalledTimes(1)
  })

  it('should show loading when fetching', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
    })

    render(<AddressStep />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })
})
