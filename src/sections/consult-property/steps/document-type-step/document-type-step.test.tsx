import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentTypeStep } from './document-type-step'
import type { FieldErrors } from 'react-hook-form'

const setValueMock = vi.fn()
const onNextMock = vi.fn()

let mockErrors: FieldErrors = {}
let mockWatchValue: string | null = null

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    watch: (field: string) => (field === 'documentType' ? mockWatchValue : undefined),
    formState: { errors: mockErrors },
  }),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/text-subtitle', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="text-subtitle">{children}</h2>
  ),
}))

vi.mock('@/components/option-card/option-card.tsx', () => ({
  __esModule: true,
  default: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <div data-testid="option-card" onClick={onClick}>
      {title}
    </div>
  ),
}))

const setup = (props?: { watchValue?: string | null; errors?: FieldErrors }) => {
  setValueMock.mockClear()
  onNextMock.mockClear()
  mockWatchValue = props?.watchValue ?? null
  mockErrors = props?.errors ?? {}

  render(<DocumentTypeStep onNext={onNextMock} />)

  return {
    optionContract: screen.getByText('Contrato de compra e venda'),
    optionRegistration: screen.getByText('Matrícula'),
    optionDeed: screen.getByText('Escritura'),
    setValueMock,
    onNextMock,
  }
}

describe('DocumentTypeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização Inicial', () => {
    it('should render titles and all options', () => {
      setup()
      expect(screen.getByTestId('text-title')).toBeInTheDocument()
      expect(screen.getByTestId('text-subtitle')).toBeInTheDocument()
      expect(screen.getByText('Contrato de compra e venda')).toBeInTheDocument()
      expect(screen.getByText('Matrícula')).toBeInTheDocument()
      expect(screen.getByText('Escritura')).toBeInTheDocument()
    })

    it('should reset documentType on mount', () => {
      setup()
      expect(setValueMock).toHaveBeenCalledWith('documentType', undefined)
    })
  })

  describe('Interação do Usuário (setValue)', () => {
    it('should call setValue and onNext when "Contrato" is selected', () => {
      const { optionContract, setValueMock, onNextMock } = setup()
      fireEvent.click(optionContract)
      expect(setValueMock).toHaveBeenCalledWith('documentType', 'agreement', {
        shouldValidate: true,
      })
      expect(onNextMock).toHaveBeenCalled()
    })

    it('should call setValue and onNext when "Matrícula" is selected', () => {
      const { optionRegistration, setValueMock, onNextMock } = setup()
      fireEvent.click(optionRegistration)
      expect(setValueMock).toHaveBeenCalledWith('documentType', 'registration', {
        shouldValidate: true,
      })
      expect(onNextMock).toHaveBeenCalled()
    })

    it('should call setValue and onNext when "Escritura" is selected', () => {
      const { optionDeed, setValueMock, onNextMock } = setup()
      fireEvent.click(optionDeed)
      expect(setValueMock).toHaveBeenCalledWith('documentType', 'deed', {
        shouldValidate: true,
      })
      expect(onNextMock).toHaveBeenCalled()
    })
  })
})