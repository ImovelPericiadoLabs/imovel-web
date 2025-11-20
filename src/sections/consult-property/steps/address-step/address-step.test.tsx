import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddressStep } from './address-step'
import { listAddresses, listRegistry, listAddress } from '@/services/addresses'
import type { Registry } from '@/services/addresses'

// ==============================
// MOCKS
// ===============================
const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()

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
    onSelectAddress,
    error,
    isDirty,
  }: {
    placeholder: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onConfirm: (address: string) => void
    isLoading: boolean
    onSelectAddress: (value: string) => Promise<string>
    error: { title: string; subtitle: string } | null
    isDirty: boolean
  }) => (
    <div>
      <input data-testid="address-input" placeholder={placeholder} onChange={(e) => onChange(e)} />

      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error.title}</div>}
      {isDirty && <div data-testid="dirty-flag">Dirty</div>}

      <button data-testid="select-address" onClick={() => onSelectAddress('mockPlaceId')}>
        Select Address
      </button>

      <button data-testid="confirm-button" onClick={() => onConfirm('mockAddress')}>
        Confirm
      </button>
    </div>
  ),
}))

vi.mock('@/components/loading-overlay', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading-overlay">Loading...</div> : null,
}))

// Query mocks
const useQueryMock = vi.fn()
const useMutationMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => Promise<[]>; enabled: boolean }) => useQueryMock(opts),

  useMutation: (opts: {
    mutationFn: (value: unknown) => Promise<unknown>
    onSuccess?: (data: unknown) => void
  }) => useMutationMock(opts),
}))

vi.mock('@/hooks/use-debounce', () => ({
  __esModule: true,
  default: (value: string) => value,
}))

vi.mock('@/services/addresses', () => ({
  listAddresses: vi.fn(),
  listRegistry: vi.fn(),
  listAddress: vi.fn(),
}))

const listAddressesMock = listAddresses as unknown as ReturnType<typeof vi.fn>
const listRegistryMock = listRegistry as unknown as ReturnType<typeof vi.fn>
const listAddressMock = listAddress as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  setValueMock.mockReset()
  handleNextStepMock.mockReset()
  listAddressesMock.mockReset()
  listRegistryMock.mockReset()
  listAddressMock.mockReset()
  useQueryMock.mockReset()
  useMutationMock.mockReset()
})

// ==============================
// TESTS
// ===============================

describe('AddressStep', () => {
  it('should NOT call listAddresses when debounced < 3 characters', () => {
    useQueryMock.mockImplementation(({ enabled }) => ({
      data: [],
      isLoading: false,
      isEnabled: enabled,
    }))

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    render(<AddressStep />)

    const input = screen.getByTestId('address-input')

    fireEvent.change(input, { target: { value: 'Ru' } })

    expect(listAddressesMock).not.toHaveBeenCalled()
  })

  it('should call listAddresses when debounced >= 3 characters', () => {
    listAddressesMock.mockResolvedValue([])

    useQueryMock.mockImplementation(({ queryFn, enabled }) => {
      if (enabled) queryFn()
      return { data: [], isLoading: false, isEnabled: enabled }
    })

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    render(<AddressStep />)

    const input = screen.getByTestId('address-input')

    fireEvent.change(input, { target: { value: 'Rua' } })

    expect(listAddressesMock).toHaveBeenCalledWith('Rua')
  })

  it('should render initial home items when no search is made', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isEnabled: false,
    })

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    render(<AddressStep />)

    expect(screen.getAllByText(/Pesquisa rápida/).length).toBe(1)
  })

  it('should show error when debounced < 3', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isEnabled: false,
    })

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    render(<AddressStep />)

    const input = screen.getByTestId('address-input')

    fireEvent.change(input, { target: { value: 'Ru' } })

    expect(screen.getByTestId('error')).toHaveTextContent('Texto muito curso')
  })

  it('should call listAddress when selecting address', async () => {
    listAddressMock.mockResolvedValue('Selected Address')

    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isEnabled: true,
    })

    useMutationMock.mockReturnValue({
      mutateAsync: listAddressMock,
      isPending: false,
    })

    render(<AddressStep />)

    fireEvent.click(screen.getByTestId('select-address'))

    await waitFor(() => {
      expect(listAddressMock).toHaveBeenCalledWith({
        address: '',
        placeId: 'mockPlaceId',
      })
    })
  })

  it('should call setValue, listRegistry, and nextStep when confirming address', async () => {
    const registryMock: Registry = {
      id: '1',
      name: 'Mock',
      number: 1,
      slug: 'mock',
      coverage: [],
    }

    const listRegistryMutateMock = vi.fn().mockResolvedValue(registryMock)

    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isEnabled: true,
    })

    useMutationMock.mockImplementation(({ mutationFn, onSuccess }) => {
      if (mutationFn === listRegistry) {
        return {
          mutateAsync: async (value: string) => {
            const result = await listRegistryMutateMock(value)
            onSuccess?.(result)
            return result
          },
          isPending: false,
        }
      }
      return { mutateAsync: vi.fn(), isPending: false }
    })

    render(<AddressStep />)

    fireEvent.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('address', 'mockAddress')
      expect(setValueMock).toHaveBeenCalledWith('registry', registryMock)
      expect(handleNextStepMock).toHaveBeenCalledTimes(1)
    })
  })

  it('should show loading indicator from useQuery', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
      isEnabled: false,
    })

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    render(<AddressStep />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should show loading overlay when registry request is pending', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isEnabled: false,
    })

    useMutationMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: true })

    render(<AddressStep />)

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })
})
