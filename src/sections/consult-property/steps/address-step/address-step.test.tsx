import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddressStep } from './address-step'
import { listAddresses, listRegistry } from '@/services/addresses'
import type { Registry } from '@/services/addresses'

const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()

const listAddressesMock = listAddresses as unknown as ReturnType<typeof vi.fn>
const listRegistryMock = listRegistry as unknown as ReturnType<typeof vi.fn>

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

vi.mock('@/components/loading-overlay', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading-overlay">Loading...</div> : null,
}))

const useQueryMock = vi.fn()
const useMutationMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => unknown; enabled: boolean }) => useQueryMock(opts),

  useMutation: (opts: {
    mutationFn: (value: string) => Promise<Registry>
    onSuccess: (data: Registry) => void
  }) => useMutationMock(opts),
}))

vi.mock('@/hooks/use-debounce', () => ({
  __esModule: true,
  default: (value: string) => value,
}))

vi.mock('@/services/addresses', () => ({
  listAddresses: vi.fn(),
  listRegistry: vi.fn(),
}))

beforeEach(() => {
  setValueMock.mockReset()
  handleNextStepMock.mockReset()
  listAddressesMock.mockReset()
  listRegistryMock.mockReset()
  useQueryMock.mockReset()
  useMutationMock.mockReset()
})

describe('AddressStep', () => {
  it('should call listAddresses via queryFn when debouncedAddress is not empty', () => {
    listAddressesMock.mockResolvedValue([{ street: 'A', city: 'B', value: 'C' }])

    useQueryMock.mockImplementation(({ queryFn }) => {
      queryFn()
      return {
        data: [{ street: 'A', city: 'B', value: 'C' }],
        isLoading: false,
      }
    })

    useMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
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

    useMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<AddressStep />)

    expect(screen.getByTestId('text-title')).toHaveTextContent(
      'Para começar, onde fica seu imóvel?',
    )
    expect(screen.getByTestId('address-input')).toBeInTheDocument()
  })

  it('should call setValue, listRegistry and handleNextStep when confirming address', async () => {
    const registryMock: Registry = {
      id: '1',
      name: 'Registro X',
      number: 1,
      slug: 'registro-x',
      coverage: ['cidade-x'],
    }

    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    const mutateAsyncMock = vi.fn().mockResolvedValue(registryMock)

    useMutationMock.mockImplementation(({ onSuccess }) => ({
      mutateAsync: async (value: string) => {
        const result = await mutateAsyncMock(value)
        onSuccess(result)
        return result
      },
      isPending: false,
    }))

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
    })

    useMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<AddressStep />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should show loading overlay when mutation is pending', () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    useMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    })

    render(<AddressStep />)

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })
})
