import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentConfirmationStep } from './document-confirmation-step'
import type { FieldErrors } from 'react-hook-form'

const setValueMock = vi.fn()
const onNextMock = vi.fn()
const onSkipMock = vi.fn()
const triggerMock = vi.fn()

let mockErrors: FieldErrors = {}
let mockWatchValue: boolean | undefined | null = null

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    trigger: triggerMock,
    getValues: (field: string) => (field === 'address' ? 'Mock Address' : undefined),
    watch: (field: string) => (field === 'hasDocument' ? mockWatchValue : undefined),
    formState: { errors: mockErrors },
  }),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
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

const setup = (props?: { watchValue?: boolean | null; errors?: FieldErrors }) => {
  setValueMock.mockClear()
  onNextMock.mockClear()
  onSkipMock.mockClear()
  triggerMock.mockClear().mockResolvedValue(true)
  mockWatchValue = props?.watchValue ?? null
  mockErrors = props?.errors ?? {}

  render(<DocumentConfirmationStep onNext={onNextMock} onSkip={onSkipMock} />)

  const optionYes = screen.getByText('Tenho o documento do imóvel')
  const optionNo = screen.getByText('Não tenho o documento do imóvel')

  return {
    optionYes,
    optionNo,
    setValueMock,
    onNextMock,
    onSkipMock,
    triggerMock,
  }
}

describe('DocumentConfirmationStep', () => {
  describe('Renderização Inicial', () => {
    it('should render the title and options correctly', () => {
      setup()
      expect(screen.getByTestId('text-title')).toBeInTheDocument()
      expect(screen.getByText('Tenho o documento do imóvel')).toBeInTheDocument()
      expect(screen.getByText('Não tenho o documento do imóvel')).toBeInTheDocument()
    })
  })

  describe('Interação do Usuário (setValue)', () => {
    it('should call setValue when "Tenho o documento do imóvel" is selected', () => {
      const { optionYes, setValueMock } = setup()

      fireEvent.click(optionYes)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', true, {
        shouldValidate: true,
      })
    })

    it('should call setValue when "Não tenho o documento do imóvel" is selected', () => {
      const { optionNo, setValueMock } = setup()

      fireEvent.click(optionNo)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', false, {
        shouldValidate: true,
      })
    })

    it('should call onNext when user selects they have the document', () => {
      const { optionYes, onNextMock } = setup()

      fireEvent.click(optionYes)

      expect(onNextMock).toHaveBeenCalledTimes(1)
    })
  })
})